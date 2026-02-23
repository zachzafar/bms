import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { PermissionScope } from 'src/auth/permissions';
import { any } from 'zod';
import { SelectPaymentMethod } from '@repo/api-contract';

type CreatePaymentInput = Omit<schema.InsertPayment, 'id'>;

@Injectable()
export class PaymentsService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  private iso(d: Date | null | undefined) {
    return d ? d.toISOString() : undefined;
  }

  /** safe cents math */
  private toCents(v: string | number) {
    const n = typeof v === 'number' ? v : Number(v);
    return Math.round(n * 100);
  }
  private fromCents(c: number) {
    return (c / 100).toFixed(2);
  }

  async create(payment: CreatePaymentInput, tenantId: string, invoiceIds?: number[], amountsApplied?: string[]) {
    // If no invoice linkage provided, just insert the payment
    const date = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
    const isRefund = (payment.type ?? '').toLowerCase() === 'refund';

    if (!invoiceIds?.length) {
      if (isRefund) {
        throw new BadRequestException('Refund must target at least one invoice');
      }
      const [{ id }] = await this.db.transaction(async (tx) => {
        // normalize: ensure non-refund uses provided amount as-is
        const inserted = await tx
          .insert(schema.Payment)
          .values({
            ...payment,
            paymentDate: date,
            customerId: (payment.customerId),
            tenantId,
          })
          .$returningId();
        return inserted;
      });
      return id;
    }

    if (invoiceIds.length !== (amountsApplied?.length ?? 0)) {
      throw new BadRequestException('invoiceIds and amountsApplied length mismatch');
    }

    // Pull invoices and verify same customer + tenant consistency
    const invoices = await this.db.query.Invoice.findMany({
      where: (i, { inArray }) => inArray(i.id, invoiceIds),
    });
    if (invoices.length !== invoiceIds.length) {
      throw new BadRequestException('One or more invoices not found');
    }

    // Validate invoice statuses — cannot pay draft or void invoices
    for (const inv of invoices) {
      if (inv.status === 'draft') {
        throw new BadRequestException(`Invoice ${inv.invoiceNumber} is a draft. Approve it before applying payment.`);
      }
      if (inv.status === 'void') {
        throw new BadRequestException(`Invoice ${inv.invoiceNumber} has been voided and cannot receive payments.`);
      }
      if (inv.status === 'paid') {
        throw new BadRequestException(`Invoice ${inv.invoiceNumber} is already fully paid.`);
      }
    }

    // Ensure all invoices belong to the same customer as the payment
    // Skip invoices with null customerId (customer was deleted)
    const invoicesWithCustomer = invoices.filter((i) => i.customerId !== null);
    const allSameCustomer = invoicesWithCustomer.every((i) => String(i.customerId) === String(payment.customerId));
    if (!allSameCustomer) {
      throw new BadRequestException('Invoices must belong to the same customer as the payment');
    }

    // Safe-cents helpers
    const toCents = this.toCents.bind(this);

    if (!isRefund) {
      // Standard payment flow
      const paymentCents = toCents(String(payment.amount));
      const appliedCents = (amountsApplied ?? []).reduce((acc, s) => acc + toCents(s), 0);
      if (appliedCents > paymentCents) {
        throw new BadRequestException('Applied amounts exceed payment amount');
      }

      const [{ id }] = await this.db.transaction(async (tx) => {
        const inserted = await tx
          .insert(schema.Payment)
          .values({
            ...payment,
            paymentDate: date,
            customerId: (payment.customerId),
            tenantId,
          })
          .$returningId();
        const paymentId = inserted[0].id;

        // Create PaymentInvoice rows
        await tx.insert(schema.PaymentInvoice).values(
          invoiceIds.map((invoiceId, idx) => ({
            paymentId: (paymentId),
            invoiceId: (invoiceId),
            amountApplied: (amountsApplied ?? [])[idx] as any,
          }))
        );

        // Collect current applied per invoice (including this insert)
        const pivots = await tx.query.PaymentInvoice.findMany({
          where: (pi, { inArray }) => inArray(pi.invoiceId, invoiceIds.map((id) => (id))),
        });

        const appliedByInvoice = new Map<number, number>();
        pivots.forEach((p) => {
          appliedByInvoice.set(p.invoiceId, (appliedByInvoice.get(p.invoiceId) ?? 0) + toCents(String(p.amountApplied)));
        });

        // Also factor in issued credit notes
        const creditNotes = await tx.query.CreditNote.findMany({
          where: (cn, { inArray, eq, and }) => and(
            inArray(cn.invoiceId, invoiceIds),
            eq(cn.status, 'issued')
          ),
        });
        const creditedByInvoice = new Map<number, number>();
        creditNotes.forEach((cn) => {
          creditedByInvoice.set(cn.invoiceId, (creditedByInvoice.get(cn.invoiceId) ?? 0) + toCents(String(cn.amount)));
        });

        for (const inv of invoices) {
          const total = toCents(String(inv.totalAmount));
          const applied = appliedByInvoice.get((inv.id)) ?? 0;
          const credited = creditedByInvoice.get((inv.id)) ?? 0;
          const outstanding = total - applied - credited;
          const status = outstanding <= 0 && applied > 0 ? 'paid'
            : outstanding <= 0 ? 'void'
            : applied > 0 || credited > 0 ? 'partial'
            : 'approved';
          if (status !== inv.status) {
            await tx.update(schema.Invoice).set({ status }).where(eq(schema.Invoice.id, inv.id));
          }
        }

        return inserted;
      });

      return id;
    }

    // Refund flow
    // 1) Validate amountsApplied are negative
    const refundsCents = (amountsApplied ?? []).map((s) => toCents(s));
    if (refundsCents.some((c) => c >= 0)) {
      throw new BadRequestException('Refund amountsApplied must be negative values');
    }

    // 2) Validate total refund does not exceed refund payment amount (by magnitude)
    const paymentCentsAbs = Math.abs(toCents(String(payment.amount)));
    const appliedRefundAbs = refundsCents.reduce((acc, c) => acc + Math.abs(c), 0);
    if (appliedRefundAbs > paymentCentsAbs) {
      throw new BadRequestException('Refund application exceeds refund payment amount');
    }

    const [{ id }] = await this.db.transaction(async (tx) => {
      // 3) Validate not over-refunding per invoice: current applied >= refund magnitude
      const pivotsBefore = await tx.query.PaymentInvoice.findMany({
        where: (pi, { inArray }) => inArray(pi.invoiceId, invoiceIds.map((id) => (id))),
      });

      const appliedByInvoiceBefore = new Map<number, number>();
      pivotsBefore.forEach((p) => {
        appliedByInvoiceBefore.set(p.invoiceId, (appliedByInvoiceBefore.get(p.invoiceId) ?? 0) + toCents(String(p.amountApplied)));
      });

      invoiceIds.forEach((invoiceId, idx) => {
        const refundAbs = Math.abs(refundsCents[idx]);
        const currentApplied = appliedByInvoiceBefore.get((invoiceId)) ?? 0;
        if (refundAbs > currentApplied) {
          throw new BadRequestException(`Refund exceeds applied amount for invoice ${invoiceId}`);
        }
      });

      // 4) Normalize amount to negative for storage
      const normalizedAmount =
        Math.sign(Number(payment.amount)) === -1
          ? String(payment.amount)
          : String(-Math.abs(Number(payment.amount)));

      const inserted = await tx
        .insert(schema.Payment)
        .values({
          ...payment,
          amount: normalizedAmount as any,
          paymentDate: date,
          customerId: (payment.customerId),
          tenantId,
        })
        .$returningId();
      const paymentId = inserted[0].id;

      // 5) Insert refund pivots (negative amountsApplied)
      await tx.insert(schema.PaymentInvoice).values(
        invoiceIds.map((invoiceId, idx) => ({
          paymentId: (paymentId),
          invoiceId: (invoiceId),
          amountApplied: (amountsApplied ?? [])[idx] as any, // already negative
        }))
      );

      // 6) Recompute statuses from net applied + credit notes
      const pivots = await tx.query.PaymentInvoice.findMany({
        where: (pi, { inArray }) => inArray(pi.invoiceId, invoiceIds.map((id) => (id))),
      });

      const appliedByInvoice = new Map<number, number>();
      pivots.forEach((p) => {
        appliedByInvoice.set(p.invoiceId, (appliedByInvoice.get(p.invoiceId) ?? 0) + toCents(String(p.amountApplied)));
      });

      const creditNotes = await tx.query.CreditNote.findMany({
        where: (cn, { inArray, eq, and }) => and(
          inArray(cn.invoiceId, invoiceIds),
          eq(cn.status, 'issued')
        ),
      });
      const creditedByInvoice = new Map<number, number>();
      creditNotes.forEach((cn) => {
        creditedByInvoice.set(cn.invoiceId, (creditedByInvoice.get(cn.invoiceId) ?? 0) + toCents(String(cn.amount)));
      });

      for (const inv of invoices) {
        const total = toCents(String(inv.totalAmount));
        const applied = appliedByInvoice.get((inv.id)) ?? 0;
        const credited = creditedByInvoice.get((inv.id)) ?? 0;
        const outstanding = total - applied - credited;
        const status = outstanding <= 0 && applied > 0 ? 'paid'
          : outstanding <= 0 ? 'void'
          : applied > 0 || credited > 0 ? 'partial'
          : 'approved';
        if (status !== inv.status) {
          await tx.update(schema.Invoice).set({ status }).where(eq(schema.Invoice.id, inv.id));
        }
      }

      return inserted;
    });

    return id;
  }

  async list(tenantId: string, query: { customerId?: number }, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];
    conditions.push(eq(schema.Payment.tenantId, tenantId));
    conditions.push(isNull(schema.Payment.deletedAt));
    if (query.customerId) conditions.push(eq(schema.Payment.customerId, query.customerId));

    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Payment)
      .where(and(...conditions))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const payments = await this.db.query.Payment.findMany({
      where: (p, { eq, and, isNull }) =>
        and(
          eq(p.tenantId, tenantId),
          isNull(p.deletedAt),
          query.customerId ? eq(p.customerId, (query.customerId)) : undefined,
        ),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      limit: pageSize,
      offset: offset,
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
      data: payments.map(payment => ({
        ...payment,
        id: (payment.id),
        customerId: (payment.customerId),
      })),
      pagination: paginationData,
    };
  }

  async get(id: number) {
    const payment = await this.db.query.Payment.findFirst({
      where: (p, { eq, and, isNull }) => and(eq(p.id, id), isNull(p.deletedAt)),
    });
    if (!payment) return null;

    const pivots = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.paymentId, (id)),
      with: { invoice: true },
    });

    return {
      ...payment,
      id: (payment.id),
      customerId: (payment.customerId),
      invoices: pivots.map((p) => ({
        invoiceId: (p.invoiceId),
        amountApplied: String(p.amountApplied),
        invoiceNumber: p.invoice.invoiceNumber,
      })),
    };
  }

  async delete(id: number) {
    // Check if the payment exists first
    const payment = await this.db.query.Payment.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    });

    if (!payment) {
      throw new BadRequestException(`Payment with ID ${id} not found`);
    }

    // Get affected invoices before deletion
    const pivots = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.paymentId, (id)),
    });

    const affectedInvoiceIds = pivots.map((p) => p.invoiceId);

    // Wrap in transaction to delete payment and recalculate invoice statuses
    await this.db.transaction(async (tx) => {
      // Delete PaymentInvoice records first
      await tx.delete(schema.PaymentInvoice).where(eq(schema.PaymentInvoice.paymentId, (id))).execute();

      // Delete the payment itself
      await tx.delete(schema.Payment).where(eq(schema.Payment.id, id)).execute();

      // Recalculate statuses for affected invoices
      if (affectedInvoiceIds.length > 0) {
        const invoices = await tx.query.Invoice.findMany({
          where: (i, { inArray }) => inArray(i.id, affectedInvoiceIds),
        });

        // Get remaining payment applications
        const remainingPivots = await tx.query.PaymentInvoice.findMany({
          where: (pi, { inArray }) => inArray(pi.invoiceId, affectedInvoiceIds),
        });

        const appliedByInvoice = new Map<number, number>();
        remainingPivots.forEach((p) => {
          appliedByInvoice.set(p.invoiceId, (appliedByInvoice.get(p.invoiceId) ?? 0) + this.toCents(String(p.amountApplied)));
        });

        // Also factor in credit notes
        const remainingCreditNotes = await tx.query.CreditNote.findMany({
          where: (cn, { inArray, eq, and }) => and(
            inArray(cn.invoiceId, affectedInvoiceIds),
            eq(cn.status, 'issued')
          ),
        });
        const creditedByInvoice = new Map<number, number>();
        remainingCreditNotes.forEach((cn) => {
          creditedByInvoice.set(cn.invoiceId, (creditedByInvoice.get(cn.invoiceId) ?? 0) + this.toCents(String(cn.amount)));
        });

        for (const inv of invoices) {
          const total = this.toCents(String(inv.totalAmount));
          const applied = appliedByInvoice.get((inv.id)) ?? 0;
          const credited = creditedByInvoice.get((inv.id)) ?? 0;
          const outstanding = total - applied - credited;
          const status = outstanding <= 0 && applied > 0 ? 'paid'
            : outstanding <= 0 ? 'void'
            : applied > 0 || credited > 0 ? 'partial'
            : 'approved';
          if (status !== inv.status) {
            await tx.update(schema.Invoice).set({ status }).where(eq(schema.Invoice.id, inv.id));
          }
        }
      }
    });

    return { message: `Payment ${id} deleted successfully` };
  }

  // ==================== PAYMENT METHOD CRUD ====================

    async createPaymentMethod(
        tenantId: string,
        data: { name: string; description?: string | null }
    ): Promise<number> {
        const existing = await this.db.query.PaymentMethod.findFirst({
            where: (ct, { eq, and }) => and(
                eq(ct.tenantId, tenantId),
                eq(ct.name, data.name)
            )
        });

        if (existing) {
            if (!existing.deletedAt) {
                throw new BadRequestException('Payment method with this name already exists');
            }
            await this.db.update(schema.PaymentMethod)
                .set({ deletedAt: null, description: data.description ?? existing.description })
                .where(eq(schema.PaymentMethod.id, existing.id));
            return existing.id;
        }

        const [{ id }] = await this.db.insert(schema.PaymentMethod).values({
            tenantId,
            name: data.name,
            description: data.description ?? null
        }).$returningId();

        return id;
    }

    async getPaymentMethods(
        tenantId: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<{ data: SelectPaymentMethod[]; pagination: any }> {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.PaymentMethod)
            .where(and(
                eq(schema.PaymentMethod.tenantId, tenantId),
                isNull(schema.PaymentMethod.deletedAt)
            ))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const customerTypes = await this.db.query.PaymentMethod.findMany({
            where: (ct, { eq, and, isNull }) => and(
                eq(ct.tenantId, tenantId),
                isNull(ct.deletedAt)
            ),
            limit: pageSize,
            offset: offset,
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
            data: customerTypes,
            pagination: paginationData,
        };
    }

    async getPaymentMethodById(
        tenantId: string,
        paymentMethodId: number
    ): Promise<schema.SelectPaymentMethod | undefined> {
        return this.db.query.PaymentMethod.findFirst({
            where: (ct, { eq, and, isNull }) => and(
                eq(ct.tenantId, tenantId),
                eq(ct.id, paymentMethodId),
                isNull(ct.deletedAt)
            )
        });
    }

    async updatePaymentMethod(
        tenantId: string,
        paymentMethodId: number,
        data: { name?: string; description?: string | null }
    ): Promise<void> {
        if (data.name) {
            const existingType = await this.db.query.PaymentMethod.findFirst({
                where: (ct, { eq, and, isNull }) => and(
                    eq(ct.tenantId, tenantId),
                    eq(ct.name, data.name!),
                    isNull(ct.deletedAt)
                )
            });

            if (existingType && existingType.id !== paymentMethodId) {
                throw new BadRequestException('Payment method with this name already exists');
            }
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;

        if (Object.keys(updateData).length > 0) {
            await this.db.update(schema.PaymentMethod)
                .set(updateData)
                .where(and(
                    eq(schema.PaymentMethod.tenantId, tenantId),
                    eq(schema.PaymentMethod.id, paymentMethodId)
                ));
        }
    }

    async deletePaymentMethod(tenantId: string, paymentMethodId: number): Promise<void> {
        await this.db.update(schema.PaymentMethod)
            .set({ deletedAt: new Date() })
            .where(and(
                eq(schema.PaymentMethod.tenantId, tenantId),
                eq(schema.PaymentMethod.id, paymentMethodId)
            ));
    }
}
