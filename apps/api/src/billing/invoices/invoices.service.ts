import { Inject, Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, inArray, isNull, lte, gte, sql } from 'drizzle-orm';

type CreateInvoiceInput = Omit<schema.InsertInvoice, 'id'>;
type ItemInput = { description: string; quantity: number; unitPrice: string; totalPrice: string; };

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async create(invoice: CreateInvoiceInput, items: ItemInput[], tenantId: string) {
    this.logger.log(`Creating invoice for tenant ${tenantId}`);
    if (!items?.length) throw new BadRequestException('Invoice must have at least one item');

    const [{ id }] = await this.db.transaction(async (tx) => {
      const invValues = { ...invoice, tenantId, status: 'draft' as const };
      if (!invValues.invoiceNumber) {
        invValues.invoiceNumber = await this.generateInvoiceNumber();
      }

      const inserted = await tx.insert(schema.Invoice).values(invValues).$returningId();
      const invoiceId = inserted[0].id;

      await tx.insert(schema.InvoiceItem).values(
        items.map((i) => ({
          invoiceId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice as any,
          totalPrice: i.totalPrice as any,
        }))
      );

      return inserted;
    });

    this.logger.log(`Invoice created id=${id} for tenant ${tenantId}`);
    return id;
  }

  async list(tenantId: string, query: { customerId?: number; bookingId?: string; status?: string }, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [
      and(eq(schema.Invoice.tenantId, tenantId), isNull(schema.Invoice.deletedAt)),
    ];
    if (query.customerId) conditions.push(eq(schema.Invoice.customerId, query.customerId));
    if (query.bookingId) conditions.push(eq(schema.Invoice.bookingId, query.bookingId));
    if (query.status) conditions.push(eq(schema.Invoice.status, query.status as any));

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
          query.customerId ? eq(i.customerId, query.customerId) : undefined,
          query.bookingId ? eq(i.bookingId, query.bookingId) : undefined,
          query.status ? eq(i.status, query.status as any) : undefined
        ),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
      limit: pageSize,
      offset,
    });

    const ids = invoices.map((i) => i.id);

    const [items, creditNotes] = ids.length
      ? await Promise.all([
          this.db.query.InvoiceItem.findMany({ where: (it, { inArray }) => inArray(it.invoiceId, ids) }),
          this.db.query.CreditNote.findMany({ where: (cn, { inArray }) => inArray(cn.invoiceId, ids) }),
        ])
      : [[], []];

    const itemsMap = new Map<number, typeof items>();
    items.forEach((it) => {
      itemsMap.set(it.invoiceId, [...(itemsMap.get(it.invoiceId) ?? []), it]);
    });

    const creditNotesMap = new Map<number, typeof creditNotes>();
    (creditNotes as any[]).forEach((cn) => {
      creditNotesMap.set(cn.invoiceId, [...(creditNotesMap.get(cn.invoiceId) ?? []), cn]);
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
        id: inv.id,
        customerId: inv.customerId,
        items: (itemsMap.get(inv.id) ?? []).map((it) => ({
          ...it,
          id: it.id,
          invoiceId: it.invoiceId,
          unitPrice: String(it.unitPrice),
          totalPrice: String(it.totalPrice),
        })),
        creditNotes: (creditNotesMap.get(inv.id) ?? []).map((cn: any) => ({
          id: cn.id,
          creditNoteNumber: cn.creditNoteNumber,
          amount: String(cn.amount),
          reason: cn.reason,
          status: cn.status,
          createdAt: cn.createdAt,
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

    const [items, creditNotes] = await Promise.all([
      this.db.query.InvoiceItem.findMany({ where: (it, { eq }) => eq(it.invoiceId, id) }),
      this.db.query.CreditNote.findMany({ where: (cn, { eq }) => eq(cn.invoiceId, id) }),
    ]);

    return {
      ...invoice,
      id: invoice.id,
      customerId: invoice.customerId,
      items: items.map((it) => ({
        ...it,
        id: it.id,
        invoiceId: it.invoiceId,
        unitPrice: String(it.unitPrice),
        totalPrice: String(it.totalPrice),
      })),
      creditNotes: creditNotes.map((cn) => ({
        id: cn.id,
        creditNoteNumber: cn.creditNoteNumber,
        amount: String(cn.amount),
        reason: cn.reason,
        status: cn.status,
        createdAt: cn.createdAt,
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
    this.logger.log(`Updating invoice ${id}`);
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, id),
    });

    if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found`);

    if (invoice.status !== 'draft') {
      throw new BadRequestException(
        'Cannot edit an approved invoice. Issue a credit note to make adjustments.'
      );
    }

    await this.db.transaction(async (tx) => {
      await tx.update(schema.Invoice).set(invoiceData).where(eq(schema.Invoice.id, id)).execute();

      if (items && items.length > 0) {
        await tx.delete(schema.InvoiceItem).where(eq(schema.InvoiceItem.invoiceId, id)).execute();
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

  async delete(id: number) {
    this.logger.log(`Deleting invoice ${id}`);
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, id),
    });

    if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found`);

    if (invoice.status !== 'draft') {
      throw new BadRequestException(
        'Cannot delete an approved invoice. Issue a credit note to void it.'
      );
    }

    await this.db
      .update(schema.Invoice)
      .set({ deletedAt: new Date() })
      .where(eq(schema.Invoice.id, id))
      .execute();

    return { message: `Invoice ${id} deleted successfully` };
  }

  async approve(id: number) {
    this.logger.log(`Approving invoice ${id}`);
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, id),
    });

    if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found`);

    if (invoice.status !== 'draft') {
      throw new BadRequestException(`Invoice is already ${invoice.status} and cannot be approved again.`);
    }

    await this.db
      .update(schema.Invoice)
      .set({ status: 'approved' })
      .where(eq(schema.Invoice.id, id))
      .execute();

    this.logger.log(`Invoice ${invoice.invoiceNumber} approved`);
    return { message: `Invoice ${invoice.invoiceNumber} approved successfully` };
  }

  async createCreditNote(invoiceId: number, tenantId: string, amount: string, reason?: string) {
    this.logger.log(`Creating credit note for invoice ${invoiceId} amount=${amount}`);
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, invoiceId),
    });

    if (!invoice) throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);

    const allowedStatuses = ['approved', 'partial', 'paid'];
    if (!allowedStatuses.includes(invoice.status)) {
      throw new BadRequestException(
        `Cannot issue a credit note against a ${invoice.status} invoice.`
      );
    }

    const creditAmount = Math.round(parseFloat(amount) * 100);
    if (creditAmount <= 0) {
      throw new BadRequestException('Credit note amount must be greater than zero.');
    }

    // Compute outstanding balance
    const outstanding = await this.computeOutstanding(invoiceId);
    if (creditAmount > outstanding) {
      throw new BadRequestException(
        `Credit note amount ($${(creditAmount / 100).toFixed(2)}) exceeds outstanding balance ($${(outstanding / 100).toFixed(2)}).`
      );
    }

    const creditNoteNumber = await this.generateCreditNoteNumber();

    const [{ id }] = await this.db.transaction(async (tx) => {
      const inserted = await tx.insert(schema.CreditNote).values({
        tenantId,
        invoiceId,
        creditNoteNumber,
        amount: amount as any,
        reason: reason ?? null,
        status: 'issued',
      }).$returningId();

      await this.recalculateInvoiceStatus(invoiceId, tx);
      return inserted;
    });

    return id;
  }

  async getCreditNotes(invoiceId: number) {
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, invoiceId),
    });
    if (!invoice) throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);

    const creditNotes = await this.db.query.CreditNote.findMany({
      where: (cn, { eq }) => eq(cn.invoiceId, invoiceId),
      orderBy: (cn, { asc }) => [asc(cn.createdAt)],
    });

    return creditNotes.map((cn) => ({
      id: cn.id,
      creditNoteNumber: cn.creditNoteNumber,
      amount: String(cn.amount),
      reason: cn.reason,
      status: cn.status,
      createdAt: cn.createdAt,
    }));
  }

  async deleteCreditNote(id: number) {
    const creditNote = await this.db.query.CreditNote.findFirst({
      where: (cn, { eq }) => eq(cn.id, id),
    });

    if (!creditNote) throw new NotFoundException(`Credit note with ID ${id} not found`);

    if (creditNote.status !== 'draft') {
      throw new BadRequestException('Only draft credit notes can be deleted.');
    }

    await this.db.delete(schema.CreditNote).where(eq(schema.CreditNote.id, id)).execute();

    return { message: `Credit note ${creditNote.creditNoteNumber} deleted successfully` };
  }

  /** Compute outstanding balance in cents */
  private async computeOutstanding(invoiceId: number): Promise<number> {
    const invoice = await this.db.query.Invoice.findFirst({
      where: (i, { eq }) => eq(i.id, invoiceId),
    });
    if (!invoice) return 0;

    const total = Math.round(parseFloat(String(invoice.totalAmount)) * 100);

    const paymentInvoices = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.invoiceId, invoiceId),
    });
    const paid = paymentInvoices.reduce(
      (s, pi) => s + Math.round(parseFloat(String(pi.amountApplied)) * 100), 0
    );

    const creditNotes = await this.db.query.CreditNote.findMany({
      where: (cn, { and, eq }) => and(eq(cn.invoiceId, invoiceId), eq(cn.status, 'issued')),
    });
    const credited = creditNotes.reduce(
      (s, cn) => s + Math.round(parseFloat(String(cn.amount)) * 100), 0
    );

    return total - paid - credited;
  }

  /** Recalculate and persist invoice status based on payments + credit notes */
  async recalculateInvoiceStatus(invoiceId: number, tx?: any) {
    const db = tx ?? this.db;

    const invoice = await db.query.Invoice.findFirst({
      where: (i: any, { eq }: any) => eq(i.id, invoiceId),
    });
    if (!invoice) return;

    const total = Math.round(parseFloat(String(invoice.totalAmount)) * 100);

    const paymentInvoices = await db.query.PaymentInvoice.findMany({
      where: (pi: any, { eq }: any) => eq(pi.invoiceId, invoiceId),
    });
    const paid = paymentInvoices.reduce(
      (s: number, pi: any) => s + Math.round(parseFloat(String(pi.amountApplied)) * 100), 0
    );

    const creditNotes = await db.query.CreditNote.findMany({
      where: (cn: any, { and, eq }: any) => and(eq(cn.invoiceId, invoiceId), eq(cn.status, 'issued')),
    });
    const credited = creditNotes.reduce(
      (s: number, cn: any) => s + Math.round(parseFloat(String(cn.amount)) * 100), 0
    );

    const outstanding = total - paid - credited;

    let status: string;
    if (outstanding <= 0 && paid > 0) status = 'paid';
    else if (outstanding <= 0) status = 'void';
    else if (paid > 0 || credited > 0) status = 'partial';
    else status = 'approved';

    await db.update(schema.Invoice).set({ status }).where(eq(schema.Invoice.id, invoiceId)).execute();
  }

  async generateInvoiceFromBooking(tenantId: string, bookingId: string) {
    this.logger.log(`Generating invoice from booking ${bookingId} for tenant ${tenantId}`);
    const booking = await this.db.query.Booking.findFirst({
      where: (b, { eq }) => eq(b.id, bookingId),
      with: { asset: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const customer = await this.db.query.Customer.findFirst({
      where: (c, { eq, and }) => and(
        eq(c.id, booking.customerId as number),
        eq(c.tenantId, booking.asset.tenantId)
      ),
    });
    if (!customer) throw new BadRequestException('No customer found for booking user');

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

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
          lte(schema.Rate.startDate, startDate),
          gte(schema.Rate.endDate, endDate)
        )
      );

    if (!matchingRates.length) throw new NotFoundException('No applicable rate found for booking dates');

    const applicableEntry = matchingRates
      .reduce((prev, curr) => (prev.rate.priority ?? 100) < (curr.rate.priority ?? 100) ? prev : curr);

    const applicableRate = applicableEntry.rate;
    const rateTypeMinutes = applicableEntry.rateTypeMinutes || 1440;
    const rateTypeName = applicableEntry.rateTypeName || 'unit';

    const totalMinutes = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    const durationUnits = Math.ceil(totalMinutes / rateTypeMinutes);

    const unitPrice = Number(applicableRate.pricePerUnit ?? 0);
    const total = (unitPrice * durationUnits).toFixed(2);

    const invoiceNumber = await this.generateInvoiceNumber();

    const [{ id }] = await this.db.transaction(async (tx) => {
      const [insertedInvoice] = await tx.insert(schema.Invoice).values({
        tenantId,
        invoiceNumber,
        status: 'draft',
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

      await tx.insert(schema.InvoiceItem).values({
        invoiceId,
        description: `${booking.asset?.name ?? booking.assetId} - ${durationUnits} ${rateTypeName}${durationUnits > 1 ? 's' : ''}`,
        quantity: durationUnits,
        unitPrice: unitPrice as any,
        totalPrice: total as any,
      });

      return [insertedInvoice];
    });

    this.logger.log(`Invoice ${id} generated from booking ${bookingId}`);
    return id;
  }

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

  async generateInvoiceNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `INV-${y}${m}${d}-${rand}`;
  }

  async listForOwner(ownerAssetIds: string[], tenantId: string, query: { status?: string }, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    if (!ownerAssetIds.length) {
      return { data: [], pagination: { page, pageSize, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
    }

    // Get booking IDs for owner's assets
    const bookings = await this.db.query.Booking.findMany({
      where: (b, { inArray, isNull }) => inArray(b.assetId, ownerAssetIds),
      columns: { id: true },
    });
    const bookingIds = bookings.map((b) => b.id);

    if (!bookingIds.length) {
      return { data: [], pagination: { page, pageSize, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
    }

    const conditions: any[] = [
      and(
        eq(schema.Invoice.tenantId, tenantId),
        isNull(schema.Invoice.deletedAt),
        inArray(schema.Invoice.bookingId, bookingIds),
      ),
    ];
    if (query.status) conditions.push(eq(schema.Invoice.status, query.status as any));

    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Invoice)
      .where(and(...conditions))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const invoices = await this.db.query.Invoice.findMany({
      where: (i, { eq, and, isNull, inArray }) =>
        and(
          eq(i.tenantId, tenantId),
          isNull(i.deletedAt),
          inArray(i.bookingId, bookingIds),
          query.status ? eq(i.status, query.status as any) : undefined,
        ),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
      limit: pageSize,
      offset,
    });

    const ids = invoices.map((i) => i.id);
    const [items, creditNotes] = ids.length
      ? await Promise.all([
          this.db.query.InvoiceItem.findMany({ where: (it, { inArray }) => inArray(it.invoiceId, ids) }),
          this.db.query.CreditNote.findMany({ where: (cn, { inArray }) => inArray(cn.invoiceId, ids) }),
        ])
      : [[], []];

    const itemsMap = new Map<number, typeof items>();
    items.forEach((it) => { itemsMap.set(it.invoiceId, [...(itemsMap.get(it.invoiceId) ?? []), it]); });

    const creditNotesMap = new Map<number, typeof creditNotes>();
    (creditNotes as any[]).forEach((cn) => { creditNotesMap.set(cn.invoiceId, [...(creditNotesMap.get(cn.invoiceId) ?? []), cn]); });

    return {
      data: invoices.map((inv) => ({
        ...inv,
        id: inv.id,
        customerId: inv.customerId,
        items: (itemsMap.get(inv.id) ?? []).map((it) => ({
          ...it,
          id: it.id,
          invoiceId: it.invoiceId,
          unitPrice: String(it.unitPrice),
          totalPrice: String(it.totalPrice),
        })),
        creditNotes: (creditNotesMap.get(inv.id) ?? []).map((cn: any) => ({
          id: cn.id,
          creditNoteNumber: cn.creditNoteNumber,
          amount: String(cn.amount),
          reason: cn.reason,
          status: cn.status,
          createdAt: cn.createdAt,
        })),
      })),
      pagination: {
        page, pageSize, totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page * pageSize < totalCount,
        hasPreviousPage: page > 1,
      },
    };
  }

  private async generateCreditNoteNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `CN-${y}${m}${d}-${rand}`;
  }
}
