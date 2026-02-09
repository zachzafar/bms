import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { SlotService } from 'src/slot/slot.service';

type CreateInvoiceInput = Omit<schema.InsertInvoice, 'id'>;
type ItemInput = { description: string; quantity: number; unitPrice: string; totalPrice: string; };

@Injectable()
export class InvoicesService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
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
    conditions.push(and(eq(schema.Invoice.tenantId, tenantId),isNull(schema.Invoice.deletedAt)));
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
      where: (i, { eq, and, isNull }) =>
        and(
          eq(i.tenantId, tenantId),
          isNull(i.deletedAt),
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
      where: (i, { eq, and, isNull }) => and(eq(i.id, id), isNull(i.deletedAt)),
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
    // Check if the invoice exists and is not paid
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, id),
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Check if any payments have been applied to this invoice
    const paymentInvoices = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.invoiceId, id),
    });

    if (paymentInvoices.length > 0) {
      throw new BadRequestException(
        `Cannot edit invoice. It has ${paymentInvoices.length} payment(s) applied to it. Please refund the payments first.`
      );
    }

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
    // Check if the invoice exists first
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, id),
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Check if any payments have been applied to this invoice
    const paymentInvoices = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.invoiceId, id),
    });

    if (paymentInvoices.length > 0) {
      throw new BadRequestException(
        `Cannot delete invoice. It has ${paymentInvoices.length} payment(s) applied to it. Please refund the payments first.`
      );
    }

    // Soft delete the invoice
    await this.db
      .update(schema.Invoice)
      .set({ deletedAt: new Date() })
      .where(eq(schema.Invoice.id, id))
      .execute();

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
      eq(c.userId, booking.userId as string),
      eq(c.tenantId, booking.asset.tenantId)
    ),
  });
  if (!customer) throw new BadRequestException('No customer found for booking user');

  // 3) Calculate duration
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);

  // 4) Fetch applicable rate from Rate table (with RateType join)
  const matchingRates = await this.db
    .select({
      rate: schema.Rate,
      assetHasRate: schema.AssetHasRates,
      rateTypeMinutes: schema.RateType.minutes,
      rateTypeName: schema.RateType.name,
    })
    .from(schema.Rate)
    .innerJoin(schema.AssetHasRates, eq(schema.Rate.id, schema.AssetHasRates.rateId))
    .leftJoin(schema.RateType, eq(schema.Rate.rateTypeId, schema.RateType.id))
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
  const applicableEntry = matchingRates
    .reduce((prev, curr) => (prev.rate.priority ?? 100) < (curr.rate.priority ?? 100) ? prev : curr);

  const applicableRate = applicableEntry.rate;
  const rateTypeMinutes = applicableEntry.rateTypeMinutes || 1440; // default daily
  const rateTypeName = applicableEntry.rateTypeName || 'unit';

  const totalMinutes = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  const durationUnits = Math.ceil(totalMinutes / rateTypeMinutes);

  const unitPrice = Number(applicableRate.pricePerUnit ?? 0);
  const total = (unitPrice * durationUnits).toFixed(2);

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
      description: `${booking.asset?.name ?? booking.assetId} - ${durationUnits} ${rateTypeName}${durationUnits > 1 ? 's' : ''}`,
      quantity: durationUnits,
      unitPrice: unitPrice as any,
      totalPrice: total as any,
    });

    return [insertedInvoice];
  });

  return id;
}

  /**
   * Get all payments applied to an invoice
   */
  async getInvoicePayments(invoiceId: number) {
    const paymentInvoices = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.invoiceId, invoiceId),
      with: { payment: true },
    });

    return paymentInvoices.map((pi) => ({
      paymentId: pi.paymentId,
      amountApplied: String(pi.amountApplied),
      paymentDate: pi.payment.paymentDate.toISOString(),
      paymentMethod: pi.payment.paymentMethod,
      reference: pi.payment.reference,
    }));
  }

  /**
   * Refund all payments applied to an invoice
   * This deletes all PaymentInvoice records and the associated Payment records
   */
  async refundInvoice(invoiceId: number) {
    // Check if invoice exists
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, invoiceId),
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    // Get all payment links for this invoice
    const paymentInvoices = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.invoiceId, invoiceId),
    });

    if (paymentInvoices.length === 0) {
      throw new BadRequestException('No payments found for this invoice');
    }

    const paymentIds = paymentInvoices.map((pi) => pi.paymentId);

    await this.db.transaction(async (tx) => {
      // Delete PaymentInvoice records for this invoice
      await tx.delete(schema.PaymentInvoice)
        .where(eq(schema.PaymentInvoice.invoiceId, invoiceId))
        .execute();

      // Delete the payments themselves
      for (const paymentId of paymentIds) {
        // Check if the payment has other invoice links
        const otherLinks = await tx.query.PaymentInvoice.findMany({
          where: (pi, { eq }) => eq(pi.paymentId, paymentId),
        });

        // Only delete payment if it has no other links
        if (otherLinks.length === 0) {
          await tx.delete(schema.Payment)
            .where(eq(schema.Payment.id, paymentId))
            .execute();
        }
      }

      // Reset invoice status to Unpaid
      await tx.update(schema.Invoice)
        .set({ status: 'Unpaid' })
        .where(eq(schema.Invoice.id, invoiceId))
        .execute();
    });

    return {
      message: `Successfully refunded ${paymentIds.length} payment(s) for invoice ${invoiceId}`,
      refundedPayments: paymentIds.length,
    };
  }
}

