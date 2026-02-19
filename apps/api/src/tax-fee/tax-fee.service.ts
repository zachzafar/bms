import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, sql } from 'drizzle-orm';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { InsertTaxFee, UpdateTaxFee } from '@repo/api-contract';

@Injectable()
export class TaxFeeService {
  private logger = new Logger(TaxFeeService.name);
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async createTaxFee(data: InsertTaxFee, tenantId: string): Promise<number> {
    const [result] = await this.db
      .insert(schema.TaxFee)
      .values({ ...data, tenantId })
      .$returningId();
    return result.id;
  }

  async getTaxFees(tenantId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(schema.TaxFee)
        .where(eq(schema.TaxFee.tenantId, tenantId))
        .orderBy(schema.TaxFee.sortOrder)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.TaxFee)
        .where(eq(schema.TaxFee.tenantId, tenantId)),
    ]);

    const totalCount = Number(countResult[0]?.count ?? 0);

    return {
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page * pageSize < totalCount,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getTaxFee(id: number, tenantId: string) {
    const taxFee = await this.db.query.TaxFee.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.id, id), e(t.tenantId, tenantId)),
    });
    if (!taxFee) throw new NotFoundException('Tax/fee not found');
    return taxFee;
  }

  async updateTaxFee(id: number, data: UpdateTaxFee, tenantId: string) {
    await this.db
      .update(schema.TaxFee)
      .set(data)
      .where(and(eq(schema.TaxFee.id, id), eq(schema.TaxFee.tenantId, tenantId)));
  }

  async deleteTaxFee(id: number, tenantId: string) {
    await this.db
      .delete(schema.TaxFee)
      .where(and(eq(schema.TaxFee.id, id), eq(schema.TaxFee.tenantId, tenantId)));
  }

  async getTaxFeesBySubdomain(subdomain: string) {
    const tenantId = await this.resolveTenantBySubdomain(subdomain);
    return this.db
      .select()
      .from(schema.TaxFee)
      .where(and(eq(schema.TaxFee.tenantId, tenantId), eq(schema.TaxFee.isActive, true)))
      .orderBy(schema.TaxFee.sortOrder);
  }

  async getActiveForTenant(tenantId: string) {
    return this.db
      .select()
      .from(schema.TaxFee)
      .where(and(eq(schema.TaxFee.tenantId, tenantId), eq(schema.TaxFee.isActive, true)))
      .orderBy(schema.TaxFee.sortOrder);
  }

  /**
   * Calculate taxes and fees given a subtotal and booking units.
   * Two-pass: NET basis first, then GROSS basis (subtotal + NET taxes).
   */
  calculateTaxesAndFees(
    subtotal: number,
    bookingUnits: number,
    taxFees: Array<{
      id: number;
      name: string;
      type: 'tax' | 'fee';
      calculationType: 'percentage' | 'fixed_per_unit' | 'fixed_flat';
      rate: string;
      calculationBasis: 'net' | 'gross';
      maxUnits: number | null;
      minAmount: string | null;
      maxAmount: string | null;
      sortOrder: number;
    }>
  ): { items: Array<{ taxFeeId: number; name: string; type: string; calculationType: string; rate: string; calculationBasis: string; calculatedAmount: number }>; totalTaxAmount: number } {
    const sorted = [...taxFees].sort((a, b) => a.sortOrder - b.sortOrder);

    const netItems = sorted.filter(tf => tf.calculationBasis === 'net');
    const grossItems = sorted.filter(tf => tf.calculationBasis === 'gross');

    const resultItems: Array<{ taxFeeId: number; name: string; type: string; calculationType: string; rate: string; calculationBasis: string; calculatedAmount: number }> = [];

    // First pass: NET basis items (calculated on subtotal)
    let netTaxTotal = 0;
    for (const tf of netItems) {
      const amount = this.computeSingleTaxFee(tf, subtotal, bookingUnits);
      netTaxTotal += amount;
      resultItems.push({
        taxFeeId: tf.id,
        name: tf.name,
        type: tf.type,
        calculationType: tf.calculationType,
        rate: tf.rate,
        calculationBasis: tf.calculationBasis,
        calculatedAmount: amount,
      });
    }

    // Second pass: GROSS basis items (calculated on subtotal + net taxes)
    const grossBase = subtotal + netTaxTotal;
    let grossTaxTotal = 0;
    for (const tf of grossItems) {
      const amount = this.computeSingleTaxFee(tf, grossBase, bookingUnits);
      grossTaxTotal += amount;
      resultItems.push({
        taxFeeId: tf.id,
        name: tf.name,
        type: tf.type,
        calculationType: tf.calculationType,
        rate: tf.rate,
        calculationBasis: tf.calculationBasis,
        calculatedAmount: amount,
      });
    }

    return {
      items: resultItems,
      totalTaxAmount: netTaxTotal + grossTaxTotal,
    };
  }

  private computeSingleTaxFee(
    tf: { calculationType: string; rate: string; maxUnits: number | null; minAmount: string | null; maxAmount: string | null },
    base: number,
    bookingUnits: number,
  ): number {
    const rate = parseFloat(tf.rate);
    let amount: number;

    switch (tf.calculationType) {
      case 'percentage':
        amount = base * (rate / 100);
        break;
      case 'fixed_per_unit': {
        const units = tf.maxUnits ? Math.min(bookingUnits, tf.maxUnits) : bookingUnits;
        amount = rate * units;
        break;
      }
      case 'fixed_flat':
        amount = rate;
        break;
      default:
        amount = 0;
    }

    // Clamp to [minAmount, maxAmount]
    if (tf.minAmount !== null) {
      amount = Math.max(amount, parseFloat(tf.minAmount));
    }
    if (tf.maxAmount !== null) {
      amount = Math.min(amount, parseFloat(tf.maxAmount));
    }

    // Round to 2 decimal places
    return Math.round(amount * 100) / 100;
  }

  private async resolveTenantBySubdomain(subdomain: string): Promise<string> {
    const tenant = await this.db.query.Tenant.findFirst({
      where: (t, { eq }) => eq(t.subdomain, subdomain),
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant.id;
  }
}
