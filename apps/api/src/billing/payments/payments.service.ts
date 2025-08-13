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

  async create(payment: CreatePaymentInput, invoiceIds: number[], amountsApplied: string[]) {
    if (!invoiceIds?.length) throw new BadRequestException('No invoices specified');
    if (invoiceIds.length !== amountsApplied.length) {
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

    // Apply amounts and update invoice status (basic rule)
    const paymentCents = this.toCents(String(payment.amount));
    const appliedCents = amountsApplied.reduce((acc, s) => acc + this.toCents(s), 0);
    if (appliedCents > paymentCents) {
      throw new BadRequestException('Applied amounts exceed payment amount');
    }

    const [{ id }] = await this.db.transaction(async (tx) => {
      const inserted = await tx.insert(schema.Payment).values(payment).$returningId();
      const paymentId = inserted[0].id;

      // Create PaymentInvoice rows
      await tx.insert(schema.PaymentInvoice).values(
        invoiceIds.map((invoiceId, idx) => ({
          paymentId,
          invoiceId,
          amountApplied: amountsApplied[idx] as any,
        }))
      );

      // Naive status update: mark invoice Paid if total applied == totalAmount
      // Collect current applied per invoice
      const pivots = await tx.query.PaymentInvoice.findMany({
        where: (pi, { inArray }) => inArray(pi.invoiceId, invoiceIds),
      });

      const appliedByInvoice = new Map<number, number>();
      pivots.forEach((p) => {
        appliedByInvoice.set(
          p.invoiceId,
          (appliedByInvoice.get(p.invoiceId) ?? 0) + this.toCents(String(p.amountApplied))
        );
      });

      for (const inv of invoices) {
        const total = this.toCents(String(inv.totalAmount));
        const applied = appliedByInvoice.get(inv.id) ?? 0;
        const status = applied >= total ? 'Paid' : (applied > 0 ? 'Partial' : inv.status);
        if (status !== inv.status) {
          await tx.update(schema.Invoice).set({ status }).where(eq(schema.Invoice.id, inv.id));
        }
      }

      return inserted;
    });

    return id;
  }

  async list(tenantId: string, query: { customerId?: string }) {
    return this.db.query.Payment.findMany({
      where: (p, { eq, and }) =>
        and(
          query.customerId ? eq(p.customerId, query.customerId) : undefined,
          // If you keep tenantId on Payment via Customer link, filter in join or app layer.
          // If you add tenantId to Payment, also add eq(p.tenantId, tenantId) here.
        ),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });
  }

  async get(id: number) {
    const payment = await this.db.query.Payment.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    });
    if (!payment) return null;

    const pivots = await this.db.query.PaymentInvoice.findMany({
      where: (pi, { eq }) => eq(pi.paymentId, id),
      with: { invoice: true },
    });

    return {
      ...payment,
      invoices: pivots.map((p) => ({
        invoiceId: p.invoiceId,
        amountApplied: String(p.amountApplied),
        invoiceNumber: p.invoice.invoiceNumber,
      })),
    };
  }
}
