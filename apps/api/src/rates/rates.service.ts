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
  ) { }

  async createRate(data: InsertRate, assetIds?: string[]): Promise<number> {
    try {
      return await this.db.transaction(async (tx) => {
        // Insert Rate record (assetTypeId is stored directly on the Rate table)
        const [inserted] = await tx
          .insert(schema.Rate)
          .values({
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            // Clear assetTypeId if we're linking to specific assets
            assetTypeId: assetIds && assetIds.length > 0 ? null : data.assetTypeId,
          })
          .$returningId();

        const newRateId = inserted.id;

        // Only link to specific assets if assetIds provided (and no assetTypeId)
        if (assetIds && assetIds.length > 0) {
          await tx.insert(schema.AssetHasRates).values(
            assetIds.map((assetId) => ({
              assetId,
              rateId: newRateId,
            }))
          );
        }

        return newRateId;
      });
    } catch (e) {
      throw new ConflictException('Failed to create rate: ' + e);
    }
  }


  async getRates(assetId?: string, assetTypeId?: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (assetTypeId) {
      // Filter by asset type (stored directly on Rate table)
      conditions.push(eq(schema.Rate.assetTypeId, assetTypeId));
    }

    // Get rate IDs linked to specific asset if filtering by assetId
    let rateIdsForAsset: number[] | null = null;
    if (assetId) {
      const assetRateLinks = await this.db
        .select({ rateId: schema.AssetHasRates.rateId })
        .from(schema.AssetHasRates)
        .where(eq(schema.AssetHasRates.assetId, assetId));
      rateIdsForAsset = assetRateLinks.map(r => r.rateId);

      if (rateIdsForAsset.length === 0) {
        return {
          data: [],
          pagination: {
            page,
            pageSize,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
    }

    // Get total count
    let totalCount: number;
    if (rateIdsForAsset !== null) {
      const totalCountResult = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.Rate)
        .where(sql`${schema.Rate.id} IN (${sql.join(rateIdsForAsset, sql`, `)})`)
        .execute();
      totalCount = totalCountResult[0]?.count || 0;
    } else if (conditions.length > 0) {
      const totalCountResult = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.Rate)
        .where(and(...conditions))
        .execute();
      totalCount = totalCountResult[0]?.count || 0;
    } else {
      const totalCountResult = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.Rate)
        .execute();
      totalCount = totalCountResult[0]?.count || 0;
    }

    // Fetch rates with pagination
    let rates: (typeof schema.Rate.$inferSelect)[];

    if (rateIdsForAsset !== null) {
      rates = await this.db
        .select()
        .from(schema.Rate)
        .where(sql`${schema.Rate.id} IN (${sql.join(rateIdsForAsset, sql`, `)})`)
        .limit(pageSize)
        .offset(offset);
    } else if (conditions.length > 0) {
      rates = await this.db
        .select()
        .from(schema.Rate)
        .where(and(...conditions))
        .limit(pageSize)
        .offset(offset);
    } else {
      rates = await this.db
        .select()
        .from(schema.Rate)
        .limit(pageSize)
        .offset(offset);
    }

    if (rates.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    // Fetch asset associations for these rates
    const rateIds = rates.map(r => r.id);
    const assetLinks = await this.db
      .select()
      .from(schema.AssetHasRates)
      .where(sql`${schema.AssetHasRates.rateId} IN (${sql.join(rateIds, sql`, `)})`);

    // Group asset associations by rate ID
    const assetIdsByRate = new Map<number, string[]>();
    for (const link of assetLinks) {
      if (!assetIdsByRate.has(link.rateId)) {
        assetIdsByRate.set(link.rateId, []);
      }
      assetIdsByRate.get(link.rateId)!.push(link.assetId);
    }

    // Build response data - assetTypeId comes directly from Rate record
    const data = rates.map(rate => ({
      rate,
      assetIds: assetIdsByRate.get(rate.id) || [],
      assetTypeIds: rate.assetTypeId ? [rate.assetTypeId] : [],
    }));

    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data,
      pagination: paginationData,
    };
  }




async getRate(id: number) {
  const rate = await this.db.query.Rate.findFirst({
    where: (r, { eq }) => eq(r.id, id),
    with: {
      assets: true, // AssetHasRates junction table entries
    },
  });

  if (!rate) {
    throw new NotFoundException('Rate not found');
  }

  // assetTypeId is a direct column on Rate, already included in the result
  return rate;
}

async updateRate(id: number, updateData: UpdateRate & { assetIds?: string[]; assetTypeIds?: number[]; }) {
  const existing = await this.db.query.Rate.findFirst({
    where: (r, { eq }) => eq(r.id, id),
  });

  if (!existing) {
    throw new NotFoundException('Rate not found');
  }

  try {
    await this.db.transaction(async (tx) => {
      const hasAssetIds = updateData.assetIds && updateData.assetIds.length > 0;
      const hasAssetTypeIds = updateData.assetTypeIds && updateData.assetTypeIds.length > 0;

      // Determine assetTypeId value
      let assetTypeIdValue: number | null | undefined = undefined;
      if (hasAssetIds) {
        // If updating to specific assets, clear the assetTypeId
        assetTypeIdValue = null;
      } else if (hasAssetTypeIds) {
        // If updating to asset type, set the assetTypeId
        assetTypeIdValue = updateData.assetTypeIds![0];
      }

      const safeUpdate = {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        assetTypeId: assetTypeIdValue,
      } as Omit<typeof updateData, 'startDate' | 'endDate' | 'assetIds' | 'assetTypeIds'> & {
        startDate?: Date;
        endDate?: Date;
        assetTypeId?: number | null;
      };

      // Remove undefined values and junction table fields
      const { assetIds: _, assetTypeIds: __, ...cleanUpdate } = safeUpdate as any;

      await tx.update(schema.Rate)
        .set(cleanUpdate)
        .where(eq(schema.Rate.id, id));

      // Update asset associations
      if (hasAssetIds || hasAssetTypeIds) {
        // Clear existing asset associations
        await tx.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, id));

        // Add new asset associations if using specific assets
        if (hasAssetIds) {
          await tx.insert(schema.AssetHasRates).values(
            updateData.assetIds!.map(assetId => ({
              assetId,
              rateId: id,
            }))
          );
        }
      }
    });
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

  await this.db.transaction(async (tx) => {
    // Delete associated asset rates
    await tx.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, id));

    // Delete the rate itself
    await tx.delete(schema.Rate).where(eq(schema.Rate.id, id));
  });
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

  // Fallback: Get asset type rates (assetTypeId stored directly on Rate table)
  const asset = await this.db.query.Asset.findFirst({
    where: (a, { eq }) => eq(a.id, assetId),
  });

  if (!asset?.assetTypeId) {
    return null;
  }

  const assetTypeRates = await this.db
    .select({
      rateId: schema.Rate.id,
      pricePerNight: schema.Rate.pricePerNight,
      startDate: schema.Rate.startDate,
      endDate: schema.Rate.endDate,
      priority: schema.Rate.priority,
      name: schema.Rate.name,
    })
    .from(schema.Rate)
    .where(eq(schema.Rate.assetTypeId, asset.assetTypeId));

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
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.Rate)
    .where(eq(schema.Rate.assetTypeId, assetTypeId))
    .execute();
  const totalCount = totalCountResult[0]?.count || 0;

  const rates = await this.db
    .select()
    .from(schema.Rate)
    .where(eq(schema.Rate.assetTypeId, assetTypeId))
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
    data: rates.map(rate => ({ rate, assetTypeId: rate.assetTypeId })),
    pagination: paginationData,
  };
}
}