import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, sql, desc } from 'drizzle-orm';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { InsertRate, UpdateRate } from '@repo/api-contract';

@Injectable()
export class RatesService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) { }

  async createRate(tenantId: string, data: InsertRate, assetIds?: string[]): Promise<number> {
    const newStartDate = new Date(data.startDate);
    const newEndDate = new Date(data.endDate);
    const newMinNights = data.minNights ?? 1;
    const newMaxNights = data.maxNights ?? 999;

    // Check for overlapping rates with conflicting min/max nights
    const existingRates = await this.getOverlappingRates(tenantId, assetIds, data.assetTypeId);

    // Check for conflicts
    this.validateNoOverlap(existingRates, newStartDate, newEndDate, newMinNights, newMaxNights);

    return await this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(schema.Rate)
        .values({
          ...data,
          tenantId,
          startDate: newStartDate,
          endDate: newEndDate,
          assetTypeId: assetIds && assetIds.length > 0 ? null : data.assetTypeId,
        })
        .$returningId();

      const newRateId = inserted.id;

      if (assetIds && assetIds.length > 0) {
        await tx.insert(schema.AssetHasRates).values(
          assetIds.map((assetId) => ({ assetId, rateId: newRateId }))
        );
      }

      return newRateId;
    });
  }

  async getRates(tenantId: string, assetId?: string, assetTypeId?: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Build base conditions - always filter by tenant
    const conditions = [eq(schema.Rate.tenantId, tenantId)];

    if (assetTypeId) {
      conditions.push(eq(schema.Rate.assetTypeId, assetTypeId));
    }

    // If filtering by assetId, get rate IDs first
    let rateIdsForAsset: number[] | undefined;
    if (assetId) {
      const assetRateLinks = await this.db
        .select({ rateId: schema.AssetHasRates.rateId })
        .from(schema.AssetHasRates)
        .where(eq(schema.AssetHasRates.assetId, assetId));

      rateIdsForAsset = assetRateLinks.map(r => r.rateId);
      if (rateIdsForAsset.length === 0) {
        return this.emptyPaginatedResult(page, pageSize);
      }
    }

    // Build the query
    const baseQuery = this.db.select().from(schema.Rate);
    const countQuery = this.db.select({ count: sql<number>`COUNT(*)` }).from(schema.Rate);

    const whereClause = rateIdsForAsset
      ? and(...conditions, sql`${schema.Rate.id} IN (${sql.join(rateIdsForAsset, sql`, `)})`)
      : and(...conditions);

    // Execute queries
    const [countResult, rates] = await Promise.all([
      countQuery.where(whereClause).execute(),
      baseQuery.where(whereClause).limit(pageSize).offset(offset).orderBy(desc(schema.Rate.createdAt)),
    ]);

    const totalCount = countResult[0]?.count || 0;

    if (rates.length === 0) {
      return this.emptyPaginatedResult(page, pageSize);
    }

    // Fetch asset associations
    const rateIds = rates.map(r => r.id);
    const assetLinks = await this.db
      .select()
      .from(schema.AssetHasRates)
      .where(sql`${schema.AssetHasRates.rateId} IN (${sql.join(rateIds, sql`, `)})`);

    const assetIdsByRate = new Map<number, string[]>();
    for (const link of assetLinks) {
      if (!assetIdsByRate.has(link.rateId)) {
        assetIdsByRate.set(link.rateId, []);
      }
      assetIdsByRate.get(link.rateId)!.push(link.assetId);
    }

    return {
      data: rates.map(rate => ({
        rate,
        assetIds: assetIdsByRate.get(rate.id) || [],
        assetTypeIds: rate.assetTypeId ? [rate.assetTypeId] : [],
      })),
      pagination: this.buildPagination(page, pageSize, totalCount),
    };
  }

  async getRate(tenantId: string, id: number) {
    const rate = await this.db.query.Rate.findFirst({
      where: (r, { eq, and }) => and(eq(r.id, id), eq(r.tenantId, tenantId)),
      with: { assets: true },
    });

    if (!rate) {
      throw new NotFoundException('Rate not found');
    }

    return rate;
  }

  async updateRate(tenantId: string, id: number, updateData: UpdateRate & { assetIds?: string[]; assetTypeIds?: number[]; }) {
    const existing = await this.db.query.Rate.findFirst({
      where: (r, { eq, and }) => and(eq(r.id, id), eq(r.tenantId, tenantId)),
      with: { assets: true },
    });

    if (!existing) {
      throw new NotFoundException('Rate not found');
    }

    const newStartDate = updateData.startDate ? new Date(updateData.startDate) : new Date(existing.startDate);
    const newEndDate = updateData.endDate ? new Date(updateData.endDate) : new Date(existing.endDate);
    const newMinNights = updateData.minNights ?? existing.minNights ?? 1;
    const newMaxNights = updateData.maxNights ?? existing.maxNights ?? 999;
    const hasAssetIds = updateData.assetIds && updateData.assetIds.length > 0;
    const hasAssetTypeIds = updateData.assetTypeIds && updateData.assetTypeIds.length > 0;

    // Determine what to check against
    const assetIdsToCheck = hasAssetIds
      ? updateData.assetIds!
      : existing.assets?.map((a: any) => a.assetId) || [];

    const assetTypeIdToCheck = hasAssetTypeIds
      ? updateData.assetTypeIds![0]
      : existing.assetTypeId;

    // Check for overlapping rates (excluding current)
    const existingRates = await this.getOverlappingRates(tenantId, assetIdsToCheck, assetTypeIdToCheck, id);
    this.validateNoOverlap(existingRates, newStartDate, newEndDate, newMinNights, newMaxNights);

    await this.db.transaction(async (tx) => {
      const updatePayload: any = {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      };

      if (hasAssetIds) {
        updatePayload.assetTypeId = null;
      } else if (hasAssetTypeIds) {
        updatePayload.assetTypeId = updateData.assetTypeIds![0];
      }

      // Remove junction table fields
      delete updatePayload.assetIds;
      delete updatePayload.assetTypeIds;

      // Remove undefined values
      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined) delete updatePayload[key];
      });

      await tx.update(schema.Rate).set(updatePayload).where(eq(schema.Rate.id, id));

      if (hasAssetIds || hasAssetTypeIds) {
        await tx.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, id));

        if (hasAssetIds) {
          await tx.insert(schema.AssetHasRates).values(
            updateData.assetIds!.map(assetId => ({ assetId, rateId: id }))
          );
        }
      }
    });
  }

  async deleteRate(tenantId: string, id: number) {
    const existing = await this.db.query.Rate.findFirst({
      where: (r, { eq, and }) => and(eq(r.id, id), eq(r.tenantId, tenantId)),
    });

    if (!existing) {
      throw new NotFoundException('Rate not found');
    }

    await this.db.transaction(async (tx) => {
      await tx.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, id));
      await tx.delete(schema.Rate).where(eq(schema.Rate.id, id));
    });
  }

  async getEffectiveRateForAsset(
    assetId: string,
    bookingStartDate: Date,
    bookingEndDate: Date,
    booksByAssetType: boolean = false
  ) {
    const asset = await this.db.query.Asset.findFirst({
      where: (a, { eq }) => eq(a.id, assetId),
    });

    const filterApplicableRates = (rates: any[]) => {
      return rates
        .filter(rate => {
          if (!rate.startDate || !rate.endDate) return false;
          const rateStart = new Date(rate.startDate);
          const rateEnd = new Date(rate.endDate);
          return rateStart <= bookingStartDate && rateEnd >= bookingEndDate;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    if (booksByAssetType) {
      if (!asset?.assetTypeId) return null;

      const assetTypeRates = await this.db
        .select()
        .from(schema.Rate)
        .where(and(
          eq(schema.Rate.assetTypeId, asset.assetTypeId),
          eq(schema.Rate.isActive, true)
        ));

      const applicable = filterApplicableRates(assetTypeRates);
      return applicable.length > 0 ? { ...applicable[0], source: 'assetType' as const } : null;
    } else {
      const assetRates = await this.db
        .select({
          rateId: schema.AssetHasRates.rateId,
          pricePerNight: schema.Rate.pricePerNight,
          startDate: schema.Rate.startDate,
          endDate: schema.Rate.endDate,
          priority: schema.Rate.priority,
          name: schema.Rate.name,
          isActive: schema.Rate.isActive,
          createdAt: schema.Rate.createdAt,
        })
        .from(schema.AssetHasRates)
        .innerJoin(schema.Rate, eq(schema.AssetHasRates.rateId, schema.Rate.id))
        .where(and(
          eq(schema.AssetHasRates.assetId, assetId),
          eq(schema.Rate.isActive, true)
        ));

      const applicable = filterApplicableRates(assetRates);
      return applicable.length > 0 ? { ...applicable[0], source: 'asset' as const } : null;
    }
  }

  async getRatesForAssetType(tenantId: string, assetTypeId: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const [countResult, rates] = await Promise.all([
      this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.Rate)
        .where(and(eq(schema.Rate.tenantId, tenantId), eq(schema.Rate.assetTypeId, assetTypeId)))
        .execute(),
      this.db
        .select()
        .from(schema.Rate)
        .where(and(eq(schema.Rate.tenantId, tenantId), eq(schema.Rate.assetTypeId, assetTypeId)))
        .limit(pageSize)
        .offset(offset)
        .orderBy(desc(schema.Rate.createdAt)),
    ]);

    const totalCount = countResult[0]?.count || 0;

    return {
      data: rates.map(rate => ({ rate, assetTypeId: rate.assetTypeId })),
      pagination: this.buildPagination(page, pageSize, totalCount),
    };
  }

  // Helper methods
  private async getOverlappingRates(
    tenantId: string,
    assetIds?: string[],
    assetTypeId?: number | null,
    excludeRateId?: number
  ) {
    let rates: { id: number; startDate: Date | string; endDate: Date | string; minNights: number | null; maxNights: number | null }[] = [];

    if (assetIds && assetIds.length > 0) {
      const assetRateLinks = await this.db
        .select({ rateId: schema.AssetHasRates.rateId })
        .from(schema.AssetHasRates)
        .where(sql`${schema.AssetHasRates.assetId} IN (${sql.join(assetIds, sql`, `)})`);

      if (assetRateLinks.length > 0) {
        let rateIds = assetRateLinks.map(r => r.rateId);
        if (excludeRateId) {
          rateIds = rateIds.filter(id => id !== excludeRateId);
        }

        if (rateIds.length > 0) {
          rates = await this.db
            .select({
              id: schema.Rate.id,
              startDate: schema.Rate.startDate,
              endDate: schema.Rate.endDate,
              minNights: schema.Rate.minNights,
              maxNights: schema.Rate.maxNights,
            })
            .from(schema.Rate)
            .where(and(
              eq(schema.Rate.tenantId, tenantId),
              sql`${schema.Rate.id} IN (${sql.join(rateIds, sql`, `)})`,
              eq(schema.Rate.isActive, true)
            ));
        }
      }
    } else if (assetTypeId) {
      const conditions = [
        eq(schema.Rate.tenantId, tenantId),
        eq(schema.Rate.assetTypeId, assetTypeId),
        eq(schema.Rate.isActive, true),
      ];

      if (excludeRateId) {
        conditions.push(sql`${schema.Rate.id} != ${excludeRateId}`);
      }

      rates = await this.db
        .select({
          id: schema.Rate.id,
          startDate: schema.Rate.startDate,
          endDate: schema.Rate.endDate,
          minNights: schema.Rate.minNights,
          maxNights: schema.Rate.maxNights,
        })
        .from(schema.Rate)
        .where(and(...conditions));
    }

    return rates;
  }

  private validateNoOverlap(
    existingRates: { startDate: Date | string; endDate: Date | string; minNights: number | null; maxNights: number | null }[],
    newStartDate: Date,
    newEndDate: Date,
    newMinNights: number,
    newMaxNights: number
  ) {
    for (const existing of existingRates) {
      const existingStart = new Date(existing.startDate);
      const existingEnd = new Date(existing.endDate);
      const existingMin = existing.minNights ?? 1;
      const existingMax = existing.maxNights ?? 999;

      const datesOverlap = existingStart <= newEndDate && existingEnd >= newStartDate;
      if (datesOverlap) {
        const nightsOverlap = existingMin <= newMaxNights && existingMax >= newMinNights;
        if (nightsOverlap) {
          throw new ConflictException(
            `Cannot save rate: overlapping min/max nights (${newMinNights}-${newMaxNights}) ` +
            `with existing rate (${existingMin}-${existingMax} nights) for overlapping date range.`
          );
        }
      }
    }
  }

  private buildPagination(page: number, pageSize: number, totalCount: number) {
    return {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };
  }

  private emptyPaginatedResult(page: number, pageSize: number) {
    return {
      data: [],
      pagination: this.buildPagination(page, pageSize, 0),
    };
  }
}
