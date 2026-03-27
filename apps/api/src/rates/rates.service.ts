import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, sql, desc } from 'drizzle-orm';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { InsertRate, UpdateRate, InsertRateType, UpdateRateType } from '@repo/api-contract';

@Injectable()
export class RatesService {
      private logger = new Logger(RatesService.name);
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) { }

  // ==============================
  // RateType CRUD
  // ==============================

  async createRateType(tenantId: string, data: InsertRateType): Promise<number> {
    this.logger.log(`Creating rate type for tenant ${tenantId}`);
    const [inserted] = await this.db
      .insert(schema.RateType)
      .values({ ...data, tenantId })
      .$returningId();
    return inserted.id;
  }

  async getRateTypes(tenantId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const [countResult, rateTypes] = await Promise.all([
      this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.RateType)
        .where(eq(schema.RateType.tenantId, tenantId))
        .execute(),
      this.db
        .select()
        .from(schema.RateType)
        .where(eq(schema.RateType.tenantId, tenantId))
        .limit(pageSize)
        .offset(offset)
        .orderBy(desc(schema.RateType.createdAt)),
    ]);

    const totalCount = countResult[0]?.count || 0;

    return {
      data: rateTypes,
      pagination: this.buildPagination(page, pageSize, totalCount),
    };
  }

  async updateRateType(tenantId: string, id: number, data: UpdateRateType) {
    this.logger.log(`Updating rate type ${id} for tenant ${tenantId}`);
    const existing = await this.db.query.RateType.findFirst({
      where: (rt, { eq, and }) => and(eq(rt.id, id), eq(rt.tenantId, tenantId)),
    });

    if (!existing) {
      throw new NotFoundException('Rate type not found');
    }

    await this.db
      .update(schema.RateType)
      .set(data)
      .where(eq(schema.RateType.id, id));
  }

  async deleteRateType(tenantId: string, id: number) {
    this.logger.log(`Deleting rate type ${id} for tenant ${tenantId}`);
    const existing = await this.db.query.RateType.findFirst({
      where: (rt, { eq, and }) => and(eq(rt.id, id), eq(rt.tenantId, tenantId)),
    });

    if (!existing) {
      throw new NotFoundException('Rate type not found');
    }

    await this.db.delete(schema.RateType).where(eq(schema.RateType.id, id));
  }

  // ==============================
  // Rate CRUD
  // ==============================

  async createRate(tenantId: string, data: InsertRate, assetIds?: string[]): Promise<number> {
    this.logger.log(`Creating rate for tenant ${tenantId}`);
    const newMinDuration = data.minDuration ?? 1;
    const newMaxDuration = data.maxDuration ?? 999999;

    // Check for overlapping rates with conflicting duration ranges
    const existingRates = await this.getOverlappingRates(tenantId, assetIds, data.assetTypeId);

    // Check for conflicts
    this.validateNoOverlap(existingRates, data.startMonth, data.startDay, data.endMonth, data.endDay, newMinDuration, newMaxDuration);

    return await this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(schema.Rate)
        .values({
          ...data,
          tenantId,
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
    this.logger.log(`Updating rate ${id} for tenant ${tenantId}`);
    const existing = await this.db.query.Rate.findFirst({
      where: (r, { eq, and }) => and(eq(r.id, id), eq(r.tenantId, tenantId)),
      with: { assets: true },
    });

    if (!existing) {
      throw new NotFoundException('Rate not found');
    }

    const newStartMonth = updateData.startMonth ?? existing.startMonth;
    const newStartDay = updateData.startDay ?? existing.startDay;
    const newEndMonth = updateData.endMonth ?? existing.endMonth;
    const newEndDay = updateData.endDay ?? existing.endDay;
    const newMinDuration = updateData.minDuration ?? existing.minDuration ?? 1;
    const newMaxDuration = updateData.maxDuration ?? existing.maxDuration ?? 999999;
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
    this.validateNoOverlap(existingRates, newStartMonth, newStartDay, newEndMonth, newEndDay, newMinDuration, newMaxDuration);

    await this.db.transaction(async (tx) => {
      const updatePayload: any = {
        ...updateData,
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
    this.logger.log(`Deleting rate ${id} for tenant ${tenantId}`);
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

  private async fetchActiveRates(assetId: string, booksByAssetType: boolean) {
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

  async getEffectiveRateForAsset(
    assetId: string,
    bookingStartDate: Date,
    bookingEndDate: Date,
    booksByAssetType: boolean = false
  ) {
    const allRates = await this.fetchActiveRates(assetId, booksByAssetType);
    const bookingMinutes = Math.ceil(
      (bookingEndDate.getTime() - bookingStartDate.getTime()) / (1000 * 60)
    );

    const startMonth = bookingStartDate.getUTCMonth() + 1;
    const startDay = bookingStartDate.getUTCDate();
    const endMonth = bookingEndDate.getUTCMonth() + 1;
    const endDay = bookingEndDate.getUTCDate();

    const applicable = allRates
      .filter(rate => {
        if (!rate.startMonth || !rate.startDay || !rate.endMonth || !rate.endDay) return false;
        if (!this.isDateInRateRange(startMonth, startDay, rate.startMonth, rate.startDay, rate.endMonth, rate.endDay)) return false;
        if (!this.isDateInRateRange(endMonth, endDay, rate.startMonth, rate.startDay, rate.endMonth, rate.endDay)) return false;

        const unitMinutes = rate.rateTypeMinutes || 1440;
        const bookedUnits = Math.ceil(bookingMinutes / unitMinutes);
        const minUnits = rate.minDuration != null ? rate.minDuration / unitMinutes : 0;
        const maxUnits = rate.maxDuration != null ? rate.maxDuration / unitMinutes : Infinity;
        if (bookedUnits < minUnits || bookedUnits > maxUnits) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (applicable.length === 0) return null;
    const source = booksByAssetType ? 'assetType' as const : 'asset' as const;
    return { ...applicable[0], source };
  }

  /**
   * Get effective rates for a booking that may span multiple rate periods.
   * Returns an array of rate segments with actual start/end timestamps.
   * Works with any rate type (hourly, daily, etc.) including same-day bookings.
   */
  async getEffectiveRatesForBooking(
    assetId: string,
    bookingStartDate: Date,
    bookingEndDate: Date,
    booksByAssetType: boolean = false
  ): Promise<Array<{ rate: any; segmentStart: Date; segmentEnd: Date }>> {
    this.logger.debug(`getEffectiveRatesForBooking - assetId: ${assetId}, start: ${bookingStartDate.toISOString()}, end: ${bookingEndDate.toISOString()}, booksByAssetType: ${booksByAssetType}`);

    const allRates = await this.fetchActiveRates(assetId, booksByAssetType);
    this.logger.debug(`getEffectiveRatesForBooking - fetched ${allRates.length} active rate(s): ${JSON.stringify(allRates.map(r => ({ id: r.id, name: r.name, pricePerUnit: r.pricePerUnit, startMonth: r.startMonth, startDay: r.startDay, endMonth: r.endMonth, endDay: r.endDay, rateTypeMinutes: r.rateTypeMinutes })))}`);
    if (allRates.length === 0) return [];

    const source = booksByAssetType ? 'assetType' as const : 'asset' as const;

    const validRates = allRates.filter(r => r.startMonth && r.startDay && r.endMonth && r.endDay);
    this.logger.debug(`getEffectiveRatesForBooking - ${validRates.length} rate(s) with valid month/day ranges`);

    const segments: Array<{ rate: any; segmentStart: Date; segmentEnd: Date }> = [];
    const currentDate = new Date(bookingStartDate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(bookingEndDate);
    endDate.setUTCHours(0, 0, 0, 0);

    // Handle same-day bookings: ensure we process at least one day
    const effectiveEnd = endDate <= currentDate ? new Date(currentDate.getTime() + 86400000) : endDate;
    this.logger.debug(`getEffectiveRatesForBooking - cursor range: ${currentDate.toISOString()} → ${effectiveEnd.toISOString()}`);

    let cursor = new Date(currentDate);

    while (cursor < effectiveEnd) {
      const cursorMonth = cursor.getUTCMonth() + 1;
      const cursorDay = cursor.getUTCDate();

      // Find rate covering this day (most recently created wins ties)
      const dayRate = validRates
        .filter(r => this.isDateInRateRange(cursorMonth, cursorDay, r.startMonth, r.startDay, r.endMonth, r.endDay))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

      this.logger.debug(`getEffectiveRatesForBooking - cursor: ${cursor.toISOString()}, matched rate: ${dayRate ? `id=${dayRate.id} name=${dayRate.name} pricePerUnit=${dayRate.pricePerUnit}` : 'none'}`);

      if (!dayRate) {
        throw new ConflictException(
          `No rate covers ${cursor.toISOString().split('T')[0]}. Please ensure rates cover the entire booking period.`
        );
      }

      // Segment runs from cursor until the earlier of: rate season end or booking end
      const rateSeasonEnd = this.resolveRateEndDate(cursor, dayRate.startMonth, dayRate.endMonth, dayRate.endDay);
      const segEnd = new Date(Math.min(rateSeasonEnd.getTime(), effectiveEnd.getTime()));

      segments.push({
        rate: { ...dayRate, source },
        segmentStart: new Date(cursor),
        segmentEnd: segEnd,
      });

      cursor = segEnd;
    }

    this.logger.debug(`getEffectiveRatesForBooking - returning ${segments.length} segment(s)`);
    return segments;
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

  // ==============================
  // Helper methods
  // ==============================

  private async getOverlappingRates(
    tenantId: string,
    assetIds?: string[],
    assetTypeId?: number | null,
    excludeRateId?: number
  ) {
    let rates: { id: number; startMonth: number; startDay: number; endMonth: number; endDay: number; minDuration: number | null; maxDuration: number | null }[] = [];

    const rateMonthDayColumns = {
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

      if (assetRateLinks.length > 0) {
        let rateIds = assetRateLinks.map(r => r.rateId);
        if (excludeRateId) {
          rateIds = rateIds.filter(id => id !== excludeRateId);
        }

        if (rateIds.length > 0) {
          rates = await this.db
            .select(rateMonthDayColumns)
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
        .select(rateMonthDayColumns)
        .from(schema.Rate)
        .where(and(...conditions));
    }

    return rates;
  }

  // Returns an integer proxy for a month/day position, handling year-crossing.
  // For year-crossing ranges (e.g. Dec→Feb), the end DOY is offset by 1200 so
  // it sorts after the start even though the month number is smaller.
  private monthDayToProxy(month: number, day: number): number {
    return month * 32 + day;
  }

  private isDateInRateRange(
    month: number, day: number,
    startMonth: number, startDay: number,
    endMonth: number, endDay: number
  ): boolean {
    const cursor = this.monthDayToProxy(month, day);
    const start = this.monthDayToProxy(startMonth, startDay);
    const end = this.monthDayToProxy(endMonth, endDay);
    const yearCrossing = end < start;
    if (yearCrossing) {
      return cursor >= start || cursor <= end;
    }
    return cursor >= start && cursor <= end;
  }

  // Resolve the actual calendar Date when a rate's season ends, relative to the cursor date.
  private resolveRateEndDate(cursor: Date, startMonth: number, endMonth: number, endDay: number): Date {
    const year = cursor.getUTCFullYear();
    const yearCrossing = endMonth < startMonth;
    const endYear = yearCrossing && cursor.getUTCMonth() + 1 >= startMonth ? year + 1 : year;
    // Add 1 day since end is inclusive
    const resolved = new Date(Date.UTC(endYear, endMonth - 1, endDay + 1));
    return resolved;
  }

  private validateNoOverlap(
    existingRates: { startMonth: number; startDay: number; endMonth: number; endDay: number; minDuration: number | null; maxDuration: number | null }[],
    newStartMonth: number,
    newStartDay: number,
    newEndMonth: number,
    newEndDay: number,
    newMinDuration: number,
    newMaxDuration: number
  ) {
    const newStart = this.monthDayToProxy(newStartMonth, newStartDay);
    const newEnd = this.monthDayToProxy(newEndMonth, newEndDay);
    const newYearCrossing = newEnd < newStart;

    for (const existing of existingRates) {
      const exStart = this.monthDayToProxy(existing.startMonth, existing.startDay);
      const exEnd = this.monthDayToProxy(existing.endMonth, existing.endDay);
      const exYearCrossing = exEnd < exStart;
      const existingMin = existing.minDuration ?? 1;
      const existingMax = existing.maxDuration ?? 999999;

      // Check if the two month/day ranges overlap on the calendar
      let seasonOverlap: boolean;
      if (!newYearCrossing && !exYearCrossing) {
        seasonOverlap = newStart <= exEnd && newEnd >= exStart;
      } else if (newYearCrossing && !exYearCrossing) {
        seasonOverlap = exStart <= 1200 + newEnd || exEnd >= newStart;
      } else if (!newYearCrossing && exYearCrossing) {
        seasonOverlap = newStart <= 1200 + exEnd || newEnd >= exStart;
      } else {
        // Both year-crossing — they always overlap
        seasonOverlap = true;
      }

      if (seasonOverlap) {
        const durationOverlap = existingMin <= newMaxDuration && existingMax >= newMinDuration;
        if (durationOverlap) {
          throw new ConflictException(
            `Cannot save rate: overlapping min/max duration (${newMinDuration}-${newMaxDuration} min) ` +
            `with existing rate (${existingMin}-${existingMax} min) for overlapping seasonal range.`
          );
        }
      }
    }
  }

  // ==============================
  // Public (subdomain-based) methods
  // ==============================

  private async resolveTenantBySubdomain(subdomain: string): Promise<string> {
    const tenant = await this.db.query.Tenant.findFirst({
      where: (t, { eq }) => eq(t.subdomain, subdomain),
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant.id;
  }

  async getRatesBySubdomain(subdomain: string, assetId?: string, assetTypeId?: number, page: number = 1, pageSize: number = 10) {
    const tenantId = await this.resolveTenantBySubdomain(subdomain);
    return this.getRates(tenantId, assetId, assetTypeId, page, pageSize);
  }

  async getRateBySubdomain(subdomain: string, id: number) {
    const tenantId = await this.resolveTenantBySubdomain(subdomain);
    return this.getRate(tenantId, id);
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
