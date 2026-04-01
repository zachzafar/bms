import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, sql, desc } from 'drizzle-orm';
import * as schema from '@repo/api-contract';
import { InsertRate, UpdateRate, InsertRateType, UpdateRateType } from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { paginate, buildPagination, emptyPaginatedResult } from 'src/common/paginate';

@Injectable()
export class RatesRepository {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async findOrThrow<T>(query: Promise<T | undefined>, message: string): Promise<T> {
    const result = await query;
    if (!result) throw new NotFoundException(message);
    return result;
  }

  // ==============================
  // RateType
  // ==============================

  async createRateType(tenantId: string, data: InsertRateType): Promise<number> {
    const [inserted] = await this.db
      .insert(schema.RateType)
      .values({ ...data, tenantId })
      .$returningId();
    return inserted.id;
  }

  async findRateTypes(tenantId: string, page: number, pageSize: number) {
    return paginate<typeof schema.RateType.$inferSelect>(this.db, schema.RateType, eq(schema.RateType.tenantId, tenantId), page, pageSize);
  }

  async findRateTypeByIdAndTenant(id: number, tenantId: string) {
    return this.db.query.RateType.findFirst({
      where: (rt, { eq, and }) => and(eq(rt.id, id), eq(rt.tenantId, tenantId)),
    });
  }

  async updateRateType(id: number, data: UpdateRateType) {
    await this.db.update(schema.RateType).set(data).where(eq(schema.RateType.id, id));
  }

  async deleteRateType(id: number) {
    await this.db.delete(schema.RateType).where(eq(schema.RateType.id, id));
  }

  // ==============================
  // Rate
  // ==============================

  async createRateWithAssets(tenantId: string, data: InsertRate, assetIds?: string[]): Promise<number> {
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(schema.Rate)
        .values({
          ...data,
          tenantId,
          assetTypeId: assetIds && assetIds.length > 0 ? null : data.assetTypeId,
        })
        .$returningId();

      if (assetIds && assetIds.length > 0) {
        await tx.insert(schema.AssetHasRates).values(
          assetIds.map((assetId) => ({ assetId, rateId: inserted.id })),
        );
      }

      return inserted.id;
    });
  }

  async findRateByIdAndTenant(id: number, tenantId: string) {
    return this.db.query.Rate.findFirst({
      where: (r, { eq, and }) => and(eq(r.id, id), eq(r.tenantId, tenantId)),
      with: { assets: true },
    });
  }

  async findRates(tenantId: string, assetId?: string, assetTypeId?: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;
    const conditions = [eq(schema.Rate.tenantId, tenantId)];

    if (assetTypeId) {
      conditions.push(eq(schema.Rate.assetTypeId, assetTypeId));
    }

    let rateIdsForAsset: number[] | undefined;
    if (assetId) {
      const links = await this.db
        .select({ rateId: schema.AssetHasRates.rateId })
        .from(schema.AssetHasRates)
        .where(eq(schema.AssetHasRates.assetId, assetId));

      rateIdsForAsset = links.map((r) => r.rateId);
      if (rateIdsForAsset.length === 0) {
        return emptyPaginatedResult(page, pageSize);
      }
    }

    const whereClause = rateIdsForAsset
      ? and(...conditions, sql`${schema.Rate.id} IN (${sql.join(rateIdsForAsset, sql`, `)})`)
      : and(...conditions);

    const [countResult, rates] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)` }).from(schema.Rate).where(whereClause).execute(),
      this.db.select().from(schema.Rate).where(whereClause).limit(pageSize).offset(offset).orderBy(desc(schema.Rate.createdAt)),
    ]);

    if (rates.length === 0) {
      return emptyPaginatedResult(page, pageSize);
    }

    const rateIds = rates.map((r) => r.id);
    const assetLinks = await this.db
      .select()
      .from(schema.AssetHasRates)
      .where(sql`${schema.AssetHasRates.rateId} IN (${sql.join(rateIds, sql`, `)})`);

    const assetIdsByRate = new Map<number, string[]>();
    for (const link of assetLinks) {
      if (!assetIdsByRate.has(link.rateId)) assetIdsByRate.set(link.rateId, []);
      assetIdsByRate.get(link.rateId)!.push(link.assetId);
    }

    return {
      data: rates.map((rate) => ({
        rate,
        assetIds: assetIdsByRate.get(rate.id) ?? [],
        assetTypeIds: rate.assetTypeId ? [rate.assetTypeId] : [],
      })),
      pagination: buildPagination(page, pageSize, countResult[0]?.count ?? 0),
    };
  }

  async updateRateWithAssets(
    id: number,
    ratePayload: Partial<typeof schema.Rate.$inferInsert>,
    assetIds?: string[],
    hasAssetTypeIds?: boolean,
  ) {
    await this.db.transaction(async (tx) => {
      await tx.update(schema.Rate).set(ratePayload).where(eq(schema.Rate.id, id));

      if (assetIds !== undefined || hasAssetTypeIds) {
        await tx.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, id));

        if (assetIds && assetIds.length > 0) {
          await tx.insert(schema.AssetHasRates).values(
            assetIds.map((assetId) => ({ assetId, rateId: id })),
          );
        }
      }
    });
  }

  async deleteRateWithAssets(id: number) {
    await this.db.transaction(async (tx) => {
      await tx.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, id));
      await tx.delete(schema.Rate).where(eq(schema.Rate.id, id));
    });
  }

  async findRatesForAssetType(tenantId: string, assetTypeId: number, page: number, pageSize: number) {
    const where = and(eq(schema.Rate.tenantId, tenantId), eq(schema.Rate.assetTypeId, assetTypeId))!;
    const result = await paginate<typeof schema.Rate.$inferSelect>(this.db, schema.Rate, where, page, pageSize);
    return {
      data: result.data.map((rate) => ({ rate, assetTypeId: rate.assetTypeId })),
      pagination: result.pagination,
    };
  }

  // ==============================
  // Active rates for booking
  // ==============================

  private readonly rateColumns = {
    id: schema.Rate.id,
    name: schema.Rate.name,
    pricePerUnit: schema.Rate.pricePerUnit,
    startMonth: schema.Rate.startMonth,
    startDay: schema.Rate.startDay,
    endMonth: schema.Rate.endMonth,
    endDay: schema.Rate.endDay,
    minDuration: schema.Rate.minDuration,
    maxDuration: schema.Rate.maxDuration,
    priority: schema.Rate.priority,
    isActive: schema.Rate.isActive,
    createdAt: schema.Rate.createdAt,
    rateTypeId: schema.Rate.rateTypeId,
    rateTypeMinutes: schema.RateType.minutes,
    rateTypeName: schema.RateType.name,
  };

  async fetchActiveRates(assetId: string, booksByAssetType: boolean) {
    const asset = await this.db.query.Asset.findFirst({
      where: (a, { eq }) => eq(a.id, assetId),
    });

    if (booksByAssetType) {
      if (!asset?.assetTypeId) return [];
      return this.db
        .select(this.rateColumns)
        .from(schema.Rate)
        .leftJoin(schema.RateType, eq(schema.Rate.rateTypeId, schema.RateType.id))
        .where(and(eq(schema.Rate.assetTypeId, asset.assetTypeId), eq(schema.Rate.isActive, true)));
    }

    return this.db
      .select(this.rateColumns)
      .from(schema.AssetHasRates)
      .innerJoin(schema.Rate, eq(schema.AssetHasRates.rateId, schema.Rate.id))
      .leftJoin(schema.RateType, eq(schema.Rate.rateTypeId, schema.RateType.id))
      .where(and(eq(schema.AssetHasRates.assetId, assetId), eq(schema.Rate.isActive, true)));
  }

  // ==============================
  // Overlapping rates
  // ==============================

  async findOverlappingRates(
    tenantId: string,
    assetIds?: string[],
    assetTypeId?: number | null,
    excludeRateId?: number,
  ) {
    const rateColumns = {
      id: schema.Rate.id,
      startMonth: schema.Rate.startMonth,
      startDay: schema.Rate.startDay,
      endMonth: schema.Rate.endMonth,
      endDay: schema.Rate.endDay,
      minDuration: schema.Rate.minDuration,
      maxDuration: schema.Rate.maxDuration,
    };

    if (assetIds && assetIds.length > 0) {
      const assetRateLinks = await this.db
        .select({ rateId: schema.AssetHasRates.rateId })
        .from(schema.AssetHasRates)
        .where(sql`${schema.AssetHasRates.assetId} IN (${sql.join(assetIds, sql`, `)})`);

      let rateIds = assetRateLinks.map((r) => r.rateId);
      if (excludeRateId) rateIds = rateIds.filter((id) => id !== excludeRateId);
      if (rateIds.length === 0) return [];

      return this.db
        .select(rateColumns)
        .from(schema.Rate)
        .where(and(
          eq(schema.Rate.tenantId, tenantId),
          sql`${schema.Rate.id} IN (${sql.join(rateIds, sql`, `)})`,
          eq(schema.Rate.isActive, true),
        ));
    }

    if (assetTypeId) {
      const conditions = [
        eq(schema.Rate.tenantId, tenantId),
        eq(schema.Rate.assetTypeId, assetTypeId),
        eq(schema.Rate.isActive, true),
      ];
      if (excludeRateId) conditions.push(sql`${schema.Rate.id} != ${excludeRateId}`);

      return this.db.select(rateColumns).from(schema.Rate).where(and(...conditions));
    }

    return [];
  }

  // ==============================
  // Tenant
  // ==============================

  async findTenantBySubdomain(subdomain: string) {
    return this.db.query.Tenant.findFirst({
      where: (t, { eq }) => eq(t.subdomain, subdomain),
    });
  }
}
