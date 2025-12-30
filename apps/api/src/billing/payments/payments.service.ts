import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, inArray } from 'drizzle-orm';

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

    // Ensure all invoices belong to the same customer as the payment
    const allSameCustomer = invoices.every((i) => String(i.customerId) === String(payment.customerId));
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

        for (const inv of invoices) {
          const total = toCents(String(inv.totalAmount));
          const applied = appliedByInvoice.get((inv.id)) ?? 0;
          const status = applied >= total ? 'Paid' : applied > 0 ? 'Partial' : 'Unpaid';
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

      // 6) Recompute statuses from net applied
      const pivots = await tx.query.PaymentInvoice.findMany({
        where: (pi, { inArray }) => inArray(pi.invoiceId, invoiceIds.map((id) => (id))),
      });

      const appliedByInvoice = new Map<number, number>();
      pivots.forEach((p) => {
        appliedByInvoice.set(p.invoiceId, (appliedByInvoice.get(p.invoiceId) ?? 0) + toCents(String(p.amountApplied)));
      });

      for (const inv of invoices) {
        const total = toCents(String(inv.totalAmount));
        const applied = appliedByInvoice.get((inv.id)) ?? 0;
        const status = applied >= total ? 'Paid' : applied > 0 ? 'Partial' : 'Unpaid';
        if (status !== inv.status) {
          await tx.update(schema.Invoice).set({ status }).where(eq(schema.Invoice.id, inv.id));
        }
      }

      return inserted;
    });

    return id;
  }

  async list(tenantId: string, query: { customerId?: number }) {
    const payments = await this.db.query.Payment.findMany({
      where: (p, { eq, and }) =>
        and(
          eq(p.tenantId, tenantId),
          query.customerId ? eq(p.customerId, (query.customerId)) : undefined,
        ),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });

    // Convert bigint values to numbers for API compatibility
    return payments.map(payment => ({
      ...payment,
      id: Number(payment.id),
      customerId: Number(payment.customerId),
    }));
  }

  async get(id: number) {
    const payment = await this.db.query.Payment.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    });
    if (!payment) return null;

    const pivots = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.paymentId, (id)),
      with: { invoice: true },
    });

    return {
      ...payment,
      id: Number(payment.id),
      customerId: Number(payment.customerId),
      invoices: pivots.map((p) => ({
        invoiceId: Number(p.invoiceId),
        amountApplied: String(p.amountApplied),
        invoiceNumber: p.invoice.invoiceNumber,
      })),
    };
  }
}
