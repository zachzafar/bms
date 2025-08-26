import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, inArray } from 'drizzle-orm';

type CreateInvoiceInput = Omit<schema.InsertInvoice, 'id'>;
type ItemInput = { description: string; quantity: number; unitPrice: string; totalPrice: string; };

@Injectable()
export class InvoicesService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

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

  async create(invoice: CreateInvoiceInput, items: ItemInput[]) {
    if (!items?.length) throw new BadRequestException('Invoice must have at least one item');

    const [{ id }] = await this.db.transaction(async (tx) => {
      // Optionally ensure invoiceNumber is unique or generate if missing
      const invValues = { ...invoice };
      if (!invValues.invoiceNumber) {
        invValues.invoiceNumber = await this.generateInvoiceNumber();
      }

      const inserted = await tx.insert(schema.Invoice).values(invValues).$returningId();
      const invoiceId = inserted[0].id;

      await tx.insert(schema.InvoiceItem).values(
        items.map((i) => ({
          invoiceId: BigInt(invoiceId),
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

  async list(tenantId: string, query: { customerId?: string; bookingId?: string; status?: string }) {
    const invoices = await this.db.query.Invoice.findMany({
      where: (i, { eq, and }) =>
        and(
          eq(i.tenantId, tenantId),
          query.customerId ? eq(i.customerId, BigInt(query.customerId)) : undefined,
          query.bookingId ? eq(i.bookingId, query.bookingId) : undefined,
          query.status ? eq(i.status, query.status) : undefined
        ),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    });

    const ids = invoices.map((i) => BigInt(i.id));
    const items = ids.length
      ? await this.db.query.InvoiceItem.findMany({ where: (it, { inArray }) => inArray(it.invoiceId, ids) })
      : [];

    const itemsMap = new Map<bigint, typeof items>();
    items.forEach((it) => {
      itemsMap.set(it.invoiceId, [...(itemsMap.get(it.invoiceId) ?? []), it]);
    });

    return invoices.map((inv) => ({
      ...inv,
      // Convert bigint values to numbers for API compatibility
      id: Number(inv.id),
      customerId: Number(inv.customerId),
      items: (itemsMap.get(BigInt(inv.id)) ?? []).map((it) => ({
        ...it,
        id: Number(it.id),
        invoiceId: Number(it.invoiceId),
        unitPrice: String(it.unitPrice),
        totalPrice: String(it.totalPrice),
      })),
    }));
  }

  async get(id: number) {
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, id),
    });
    if (!invoice) return null;

    const items = await this.db.query.InvoiceItem.findMany({
      where: (it, { eq }) => eq(it.invoiceId, BigInt(id)),
    });

    return {
      ...invoice,
      // Convert bigint values to numbers for API compatibility
      id: Number(invoice.id),
      customerId: Number(invoice.customerId),
      items: items.map((it) => ({
        ...it,
        id: Number(it.id),
        invoiceId: Number(it.invoiceId),
        unitPrice: String(it.unitPrice),
        totalPrice: String(it.totalPrice),
      })),
    };
  }

  async update(id: number, patch: Partial<schema.UpdateInvoice>) {
    await this.db.update(schema.Invoice).set(patch).where(eq(schema.Invoice.id, id)).execute();
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

  /**
   * Create an invoice from a Booking:
   * - Uses the first associated booking customer
   * - Subtotal/Total from booking.totalPrice, tax 0.00 (customize if needed)
   * - Single item line "Booking {asset.name}"
   */
  async generateFromBooking(tenantId: string, bookingId: string) {
    // 1) Pull booking + asset
    const booking = await this.db.query.Booking.findFirst({
      where: (b, { eq }) => eq(b.id, bookingId),
      with: { asset: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // 2) Derive a customer from booking (first linked customer via UserHasBookings → Customer)
    const userLinks = await this.db.query.UserHasBookings.findMany({
      where: (ub, { eq }) => eq(ub.bookingId, bookingId),
    });
    if (!userLinks.length) throw new BadRequestException('No users linked to booking');
    const firstUserId = userLinks[0].userId;

    const customer = await this.db.query.Customer.findFirst({
      where: (c, { eq }) => eq(c.userId, firstUserId),
    });
    if (!customer) throw new BadRequestException('No customer found for booking user');

    // Optional: you can validate tenant here against the asset
    // (usually done at controller via TenantService.validateTenantAccess(tenantId, schema.Asset, booking.assetId))

    const total = booking.totalPrice ? String(booking.totalPrice) : '0.00';
    const invoiceNumber = await this.generateInvoiceNumber();

    const [{ id }] = await this.db.transaction(async (tx) => {
      const inserted = await tx.insert(schema.Invoice).values({
        tenantId,
        invoiceNumber,
        status: 'Unpaid',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
        subtotal: total as any,
        taxAmount: '0.00' as any,
        totalAmount: total as any,
        notes: `Invoice for booking ${bookingId}`,
        customerId: BigInt(customer.id),  // Convert to bigint
        bookingId,
      }).$returningId();

      const invoiceId = inserted[0].id;

      await tx.insert(schema.InvoiceItem).values({
        invoiceId: BigInt(invoiceId),
        description: `Booking ${booking.asset?.name ?? booking.assetId}`,
        quantity: 1,
        unitPrice: total as any,
        totalPrice: total as any,
      });

      return inserted;
    });

    return id;
  }
}
