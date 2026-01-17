import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { SlotService } from 'src/slot/slot.service';

type CreateInvoiceInput = Omit<schema.InsertInvoice, 'id'>;
type ItemInput = { description: string; quantity: number; unitPrice: string; totalPrice: string; };

@Injectable()
export class InvoicesService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private readonly slotService: SlotService,
  ) { }

  private iso(d: Date | null | undefined) {
    return d ? d.toISOString() : undefined;
  }

  private toExtended(row: any) {
    return {
      ...row.invoice,
      items: row.items.map((it: any) => ({
        ...it.invoice_item,
        unitPrice: String(it.invoice_item.unitPrice),
        totalPrice: String(it.invoice_item.totalPrice),
      })),
    };
  }

  async create(invoice: CreateInvoiceInput, items: ItemInput[], tenantId: string) {
    if (!items?.length) throw new BadRequestException('Invoice must have at least one item');

    const [{ id }] = await this.db.transaction(async (tx) => {
      // Optionally ensure invoiceNumber is unique or generate if missing
      const invValues = { ...invoice, tenantId };
      if (!invValues.invoiceNumber) {
        invValues.invoiceNumber = await this.generateInvoiceNumber();
      }

      const inserted = await tx.insert(schema.Invoice).values(invValues).$returningId();
      const invoiceId = inserted[0].id;

      await tx.insert(schema.InvoiceItem).values(
        items.map((i) => ({
          invoiceId: invoiceId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice as any,
          totalPrice: i.totalPrice as any,
        }))
      );

      return inserted;
    });

    return id;
  }

  async list(tenantId: string, query: { customerId?: number; bookingId?: string; status?: string }, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];
    conditions.push(eq(schema.Invoice.tenantId, tenantId));
    if (query.customerId) conditions.push(eq(schema.Invoice.customerId, query.customerId));
    if (query.bookingId) conditions.push(eq(schema.Invoice.bookingId, query.bookingId));
    if (query.status) conditions.push(eq(schema.Invoice.status, query.status));

    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Invoice)
      .where(and(...conditions))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const invoices = await this.db.query.Invoice.findMany({
      where: (i, { eq, and }) =>
        and(
          eq(i.tenantId, tenantId),
          query.customerId ? eq(i.customerId, (query.customerId)) : undefined,
          query.bookingId ? eq(i.bookingId, query.bookingId) : undefined,
          query.status ? eq(i.status, query.status) : undefined
        ),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
      limit: pageSize,
      offset: offset,
    });

    const ids = invoices.map((i) => i.id);
    const items = ids.length
      ? await this.db.query.InvoiceItem.findMany({ where: (it, { inArray }) => inArray(it.invoiceId, ids) })
      : [];

    const itemsMap = new Map<number, typeof items>();
    items.forEach((it) => {
      itemsMap.set(it.invoiceId, [...(itemsMap.get(it.invoiceId) ?? []), it]);
    });

    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: invoices.map((inv) => ({
        ...inv,
        // Convert bigint values to numbers for API compatibility
        id: inv.id,
        customerId: inv.customerId,
        items: (itemsMap.get(inv.id) ?? []).map((it) => ({
          ...it,
          id: it.id,
          invoiceId: it.invoiceId,
          unitPrice: String(it.unitPrice),
          totalPrice: String(it.totalPrice),
        })),
      })),
      pagination: paginationData,
    };
  }

  async get(id: number) {
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, id),
    });
    if (!invoice) return null;

    const items = await this.db.query.InvoiceItem.findMany({
      where: (it, { eq }) => eq(it.invoiceId, id),
    });

    return {
      ...invoice,
      // Convert bigint values to numbers for API compatibility
      id: invoice.id,
      customerId: invoice.customerId,
      items: items.map((it) => ({
        ...it,
        id: it.id,
        invoiceId: it.invoiceId,
        unitPrice: String(it.unitPrice),
        totalPrice: String(it.totalPrice),
      })),
    };
  }

  async update(
    id: number,
    invoiceData: Partial<schema.UpdateInvoice>,
    items?: {
      id?: number;
      description: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      invoiceId?: number;
    }[]
  ) {
    await this.db.transaction(async (tx) => {
      // Update invoice main fields
      await tx.update(schema.Invoice).set(invoiceData).where(eq(schema.Invoice.id, id)).execute();

      if (items && items.length > 0) {
        // Delete existing items
        await tx.delete(schema.InvoiceItem).where(eq(schema.InvoiceItem.invoiceId, id)).execute();

        // Insert updated items
        await tx.insert(schema.InvoiceItem).values(
          items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice as any,
            totalPrice: i.totalPrice as any,
            invoiceId: id,
          }))
        ).execute();
      }
    });
  }



  /** Simple invoice number generator you can replace with your own sequence */
  async generateInvoiceNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `INV-${y}${m}${d}-${rand}`;
  }

  async delete(id: number) {
    // Optional: check if the invoice exists first
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, id),
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Wrap in transaction to also delete related items
    await this.db.transaction(async (tx) => {
      // Delete related invoice items first
      await tx.delete(schema.InvoiceItem).where(eq(schema.InvoiceItem.invoiceId, id)).execute();

      // Delete the invoice itself
      await tx.delete(schema.Invoice).where(eq(schema.Invoice.id, id)).execute();
    });

    return { message: `Invoice ${id} deleted successfully` };
  }

  /**
   * Create an invoice from a Booking:
   * - Uses the first associated booking customer
   * - Subtotal/Total from booking.totalPrice, tax 0.00 (customize if needed)
   * - Single item line "Booking {asset.name}"
   */
 async generateInvoiceFromBooking(tenantId: string, bookingId: string) {
  // 1) Pull booking + asset
  const booking = await this.db.query.Booking.findFirst({
    where: (b, { eq }) => eq(b.id, bookingId),
    with: { asset: true },
  });
  if (!booking) throw new NotFoundException('Booking not found');

  // 2) Pull customer linked to booking via userId and tenantId
  const customer = await this.db.query.Customer.findFirst({
    where: (c, { eq, and }) => and(
      eq(c.userId, booking.userId),
      eq(c.tenantId, booking.asset.tenantId)
    ),
  });
  if (!customer) throw new BadRequestException('No customer found for booking user');

  // 3) Calculate number of nights
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // 4) Fetch applicable rate from Rate table
  const matchingRates = await this.db
    .select({
      rate: schema.Rate,
      assetHasRate: schema.AssetHasRates,
    })
    .from(schema.Rate)
    .innerJoin(schema.AssetHasRates, eq(schema.Rate.id, schema.AssetHasRates.rateId))
    .where(
      and(
        eq(schema.AssetHasRates.assetId, booking.assetId),
        lte(schema.Rate.startDate, startDate), // rate start <= booking start
        gte(schema.Rate.endDate, endDate)      // rate end >= booking end
      )
    );

  if (!matchingRates.length) {
    throw new NotFoundException('No applicable rate found for booking dates');
  }

  // Pick the rate with highest priority (lowest number)
  const applicableRate = matchingRates
    .map((r) => r.rate)
    .reduce((prev, curr) => (prev.priority ?? 100) < (curr.priority ?? 100) ? prev : curr);

  const unitPrice = Number(applicableRate.pricePerNight ?? 0);
  const total = (unitPrice * nights).toFixed(2);

  const invoiceNumber = await this.generateInvoiceNumber();

  const [{ id }] = await this.db.transaction(async (tx) => {
    // 5) Insert invoice
    const [insertedInvoice] = await tx.insert(schema.Invoice).values({
      tenantId,
      invoiceNumber,
      status: 'Unpaid',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subtotal: total as any,
      taxAmount: '0.00' as any,
      totalAmount: total as any,
      notes: `Invoice for booking ${bookingId}`,
      customerId: customer.id,
      bookingId,
    }).$returningId();

    const invoiceId = insertedInvoice.id;

    // 6) Insert invoice item
    await tx.insert(schema.InvoiceItem).values({
      invoiceId,
      description: `Rate per night for ${booking.asset?.name ?? booking.assetId}`,
      quantity: nights,
      unitPrice: unitPrice as any,
      totalPrice: total as any,
    });

    return [insertedInvoice];
  });

  return id;
}




}

