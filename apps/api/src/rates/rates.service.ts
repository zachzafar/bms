import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { InsertRate, UpdateRate } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class RatesService {
  constructor(
    private readonly tenantService: TenantService,
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

 async createRate(data: InsertRate, assetIds?: string[], assetTypeIds?: number[]): Promise<number> {
  try {
    // Insert Rate record, convert dates properly
    const [inserted] = await this.db
      .insert(schema.Rate)
      .values({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      })
      .$returningId();

    const newRateId = inserted.id;

    // If assetIds provided, bulk insert join rows
    if (assetIds && assetIds.length > 0) {
      await this.db.insert(schema.AssetHasRates).values(
        assetIds.map((assetId) => ({
          assetId,
          rateId: inserted.id,
        }))
      );
    }

    // If assetTypeIds provided, bulk insert join rows
    if (assetTypeIds && assetTypeIds.length > 0) {
      await this.db.insert(schema.AssetTypeHasRates).values(
        assetTypeIds.map((assetTypeId) => ({
          assetTypeId,
          rateId: inserted.id,
        }))
      );
    }

    return newRateId;
  } catch (e) {
    throw new ConflictException('Failed to create rate: ' + e);
  }
}




  async getRates(assetId?: string, page: number = 1, pageSize: number = 10) {
  const offset = (page - 1) * pageSize;

  if (assetId) {
    // Get total count for asset-specific rates
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(DISTINCT ${schema.Rate.id})` })
      .from(schema.Rate)
      .innerJoin(schema.AssetHasRates, eq(schema.Rate.id, schema.AssetHasRates.rateId))
      .where(and(eq(schema.AssetHasRates.assetId, assetId)))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Join Rate with AssetHasRates and filter on assetId
    const rows = await this.db
      .select({
        rate: schema.Rate,
        assetHasRate: schema.AssetHasRates,
      })
      .from(schema.Rate)
      .innerJoin(schema.AssetHasRates, eq(schema.Rate.id, schema.AssetHasRates.rateId))
      .where(eq(schema.AssetHasRates.assetId, assetId))
      .limit(pageSize)
      .offset(offset);

    const grouped = new Map<
      number,
      { rate: typeof schema.Rate.$inferSelect; assetIds: string[] }
    >();

    for (const { rate, assetHasRate } of rows) {
      if (!grouped.has(rate.id)) {
        grouped.set(rate.id, { rate, assetIds: [] });
      }
      grouped.get(rate.id)!.assetIds.push(assetHasRate.assetId);
    }

    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: Array.from(grouped.values()),
      pagination: paginationData,
    };
  }

  // No asset filter - fetch all rates with pagination
  const totalCountResult = await this.db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.Rate)
    .execute();
  const totalCount = totalCountResult[0]?.count || 0;

  const rows = await this.db
    .select({
      rate: schema.Rate,
      assetHasRate: schema.AssetHasRates,
    })
    .from(schema.Rate)
    .leftJoin(schema.AssetHasRates, eq(schema.Rate.id, schema.AssetHasRates.rateId))
    .limit(pageSize)
    .offset(offset);

  const grouped = new Map<
    number,
    { rate: typeof schema.Rate.$inferSelect; assetIds: string[] }
  >();

  for (const { rate, assetHasRate } of rows) {
    if (!grouped.has(rate.id)) {
      grouped.set(rate.id, { rate, assetIds: [] });
    }
    if (assetHasRate) {
      grouped.get(rate.id)!.assetIds.push(assetHasRate.assetId);
    }
  }

  const paginationData = {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    hasNextPage: page * pageSize < totalCount,
    hasPreviousPage: page > 1,
  };

  return {
    data: Array.from(grouped.values()),
    pagination: paginationData,
  };
}




async getRate(id: number) {
  const rate = await this.db.query.Rate.findFirst({
    where: (r, { eq }) => eq(r.id, id),
    with: {
      assets: true,
      assetTypes: true,
    },
  });

  if (!rate) {
    throw new NotFoundException('Rate not found');
  }

  return rate;
}

async updateRate(id: number, updateData: UpdateRate & { assetIds?: string[]; assetTypeIds?: number[] }) {
  const existing = await this.db.query.Rate.findFirst({
    where: (r, { eq }) => eq(r.id, id),
  });

  if (!existing) {
    throw new NotFoundException('Rate not found');
  }

  try {
    const safeUpdate = {
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
    } as Omit<typeof updateData, 'startDate' | 'endDate' | 'assetIds' | 'assetTypeIds'> & {
      startDate?: Date;
      endDate?: Date;
    };

    await this.db.update(schema.Rate)
      .set(safeUpdate)
      .where(eq(schema.Rate.id, id));

    // Update asset associations
    if (updateData.assetIds) {
      await this.db.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, id));

      if (updateData.assetIds.length > 0) {
        await this.db.insert(schema.AssetHasRates).values(
          updateData.assetIds.map(assetId => ({
            assetId,
            rateId: id,
          }))
        );
      }
    }

    // Update asset type associations
    if (updateData.assetTypeIds) {
      await this.db.delete(schema.AssetTypeHasRates).where(eq(schema.AssetTypeHasRates.rateId, id));

      if (updateData.assetTypeIds.length > 0) {
        await this.db.insert(schema.AssetTypeHasRates).values(
          updateData.assetTypeIds.map(assetTypeId => ({
            assetTypeId,
            rateId: id,
          }))
        );
      }
    }
  } catch (e) {
    throw new ConflictException('Error updating rate: ' + e);
  }
}


async deleteRate(id: number) {
  const existing = await this.db.query.Rate.findFirst({
    where: (r, { eq }) => eq(r.id, id),
  });

  if (!existing) {
    throw new NotFoundException('Rate not found');
  }

  // Delete associated asset rates
  await this.db.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, id));

  // Delete associated asset type rates
  await this.db.delete(schema.AssetTypeHasRates).where(eq(schema.AssetTypeHasRates.rateId, id));

  // Then delete the rate itself
  await this.db.delete(schema.Rate)
    .where(eq(schema.Rate.id, id));
}

/**
 * Get the effective rate for an asset for a given date range.
 * Checks asset-specific rates first, then falls back to asset type rates.
 * Returns the highest priority (lowest priority number) applicable rate.
 */
async getEffectiveRateForAsset(assetId: string, bookingStartDate: Date, bookingEndDate: Date) {
  // First try to get asset-specific rates
  const assetRates = await this.db
    .select({
      rateId: schema.AssetHasRates.rateId,
      pricePerNight: schema.Rate.pricePerNight,
      startDate: schema.Rate.startDate,
      endDate: schema.Rate.endDate,
      priority: schema.Rate.priority,
      name: schema.Rate.name,
    })
    .from(schema.AssetHasRates)
    .innerJoin(schema.Rate, eq(schema.AssetHasRates.rateId, schema.Rate.id))
    .where(eq(schema.AssetHasRates.assetId, assetId));

  // Filter applicable asset rates (overlapping date range)
  const applicableAssetRates = assetRates.filter((rate) => {
    if (!rate.startDate || !rate.endDate) return false;
    const rateStart = new Date(rate.startDate);
    const rateEnd = new Date(rate.endDate);
    return rateStart <= bookingEndDate && rateEnd >= bookingStartDate;
  });

  // If asset has specific rates, use them (sorted by priority)
  if (applicableAssetRates.length > 0) {
    applicableAssetRates.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    return { ...applicableAssetRates[0], source: 'asset' as const };
  }

  // Fallback: Get asset type rates
  const asset = await this.db.query.Asset.findFirst({
    where: (a, { eq }) => eq(a.id, assetId),
  });

  if (!asset?.assetTypeId) {
    return null;
  }

  const assetTypeRates = await this.db
    .select({
      rateId: schema.AssetTypeHasRates.rateId,
      pricePerNight: schema.Rate.pricePerNight,
      startDate: schema.Rate.startDate,
      endDate: schema.Rate.endDate,
      priority: schema.Rate.priority,
      name: schema.Rate.name,
    })
    .from(schema.AssetTypeHasRates)
    .innerJoin(schema.Rate, eq(schema.AssetTypeHasRates.rateId, schema.Rate.id))
    .where(eq(schema.AssetTypeHasRates.assetTypeId, asset.assetTypeId));

  // Filter applicable asset type rates
  const applicableTypeRates = assetTypeRates.filter((rate) => {
    if (!rate.startDate || !rate.endDate) return false;
    const rateStart = new Date(rate.startDate);
    const rateEnd = new Date(rate.endDate);
    return rateStart <= bookingEndDate && rateEnd >= bookingStartDate;
  });

  if (applicableTypeRates.length > 0) {
    applicableTypeRates.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    return { ...applicableTypeRates[0], source: 'assetType' as const };
  }

  return null;
}

/**
 * Get rates for an asset type
 */
async getRatesForAssetType(assetTypeId: number, page: number = 1, pageSize: number = 10) {
  const offset = (page - 1) * pageSize;

  const totalCountResult = await this.db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.Rate.id})` })
    .from(schema.Rate)
    .innerJoin(schema.AssetTypeHasRates, eq(schema.Rate.id, schema.AssetTypeHasRates.rateId))
    .where(eq(schema.AssetTypeHasRates.assetTypeId, assetTypeId))
    .execute();
  const totalCount = totalCountResult[0]?.count || 0;

  const rows = await this.db
    .select({
      rate: schema.Rate,
      assetTypeHasRate: schema.AssetTypeHasRates,
    })
    .from(schema.Rate)
    .innerJoin(schema.AssetTypeHasRates, eq(schema.Rate.id, schema.AssetTypeHasRates.rateId))
    .where(eq(schema.AssetTypeHasRates.assetTypeId, assetTypeId))
    .limit(pageSize)
    .offset(offset);

  const paginationData = {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    hasNextPage: page * pageSize < totalCount,
    hasPreviousPage: page > 1,
  };

  return {
    data: rows.map(r => ({ rate: r.rate, assetTypeId: r.assetTypeHasRate.assetTypeId })),
    pagination: paginationData,
  };
}
}