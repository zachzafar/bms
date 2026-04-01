import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InsertRate, UpdateRate, InsertRateType, UpdateRateType } from '@repo/api-contract';
import { RatesRepository } from './rates.repository';

@Injectable()
export class RatesService {
  private logger = new Logger(RatesService.name);

  constructor(private repo: RatesRepository) {}

  // ==============================
  // RateType CRUD
  // ==============================

  async createRateType(tenantId: string, data: InsertRateType): Promise<number> {
    this.logger.log(`Creating rate type for tenant ${tenantId}`);
    return this.repo.createRateType(tenantId, data);
  }

  async getRateTypes(tenantId: string, page: number = 1, pageSize: number = 10) {
    return this.repo.findRateTypes(tenantId, page, pageSize);
  }

  async updateRateType(tenantId: string, id: number, data: UpdateRateType) {
    this.logger.log(`Updating rate type ${id} for tenant ${tenantId}`);
    await this.repo.findOrThrow(
      this.repo.findRateTypeByIdAndTenant(id, tenantId),
      'Rate type not found',
    );
    await this.repo.updateRateType(id, data);
  }

  async deleteRateType(tenantId: string, id: number) {
    this.logger.log(`Deleting rate type ${id} for tenant ${tenantId}`);
    await this.repo.findOrThrow(
      this.repo.findRateTypeByIdAndTenant(id, tenantId),
      'Rate type not found',
    );
    await this.repo.deleteRateType(id);
  }

  // ==============================
  // Rate CRUD
  // ==============================

  async createRate(tenantId: string, data: InsertRate, assetIds?: string[]): Promise<number> {
    this.logger.log(`Creating rate for tenant ${tenantId}`);
    const newMinDuration = data.minDuration ?? 1;
    const newMaxDuration = data.maxDuration ?? 999999;

    const existingRates = await this.repo.findOverlappingRates(tenantId, assetIds, data.assetTypeId);
    this.validateNoOverlap(existingRates, data.startMonth, data.startDay, data.endMonth, data.endDay, newMinDuration, newMaxDuration);

    return this.repo.createRateWithAssets(tenantId, data, assetIds);
  }

  async getRates(tenantId: string, assetId?: string, assetTypeId?: number, page: number = 1, pageSize: number = 10) {
    return this.repo.findRates(tenantId, assetId, assetTypeId, page, pageSize);
  }

  async getRate(tenantId: string, id: number) {
    return this.repo.findOrThrow(
      this.repo.findRateByIdAndTenant(id, tenantId),
      'Rate not found',
    );
  }

  async updateRate(tenantId: string, id: number, updateData: UpdateRate & { assetIds?: string[]; assetTypeIds?: number[] }) {
    this.logger.log(`Updating rate ${id} for tenant ${tenantId}`);
    const existing = await this.repo.findOrThrow(
      this.repo.findRateByIdAndTenant(id, tenantId),
      'Rate not found',
    );

    const { assetIds, assetTypeIds, ...ratePayload } = updateData;
    const hasAssetIds = assetIds && assetIds.length > 0;
    const hasAssetTypeIds = assetTypeIds && assetTypeIds.length > 0;

    const newStartMonth = ratePayload.startMonth ?? existing.startMonth;
    const newStartDay = ratePayload.startDay ?? existing.startDay;
    const newEndMonth = ratePayload.endMonth ?? existing.endMonth;
    const newEndDay = ratePayload.endDay ?? existing.endDay;
    const newMinDuration = ratePayload.minDuration ?? existing.minDuration ?? 1;
    const newMaxDuration = ratePayload.maxDuration ?? existing.maxDuration ?? 999999;

    const assetIdsToCheck = hasAssetIds
      ? assetIds!
      : existing.assets?.map((a: any) => a.assetId) ?? [];
    const assetTypeIdToCheck = hasAssetTypeIds ? assetTypeIds![0] : existing.assetTypeId;

    const existingRates = await this.repo.findOverlappingRates(tenantId, assetIdsToCheck, assetTypeIdToCheck, id);
    this.validateNoOverlap(existingRates, newStartMonth, newStartDay, newEndMonth, newEndDay, newMinDuration, newMaxDuration);

    const dbPayload = {
      ...ratePayload,
      assetTypeId: hasAssetIds ? null : hasAssetTypeIds ? assetTypeIds![0] : ratePayload.assetTypeId,
    };

    await this.repo.updateRateWithAssets(id, dbPayload, hasAssetIds ? assetIds : undefined, hasAssetTypeIds);
  }

  async deleteRate(tenantId: string, id: number) {
    this.logger.log(`Deleting rate ${id} for tenant ${tenantId}`);
    await this.repo.findOrThrow(
      this.repo.findRateByIdAndTenant(id, tenantId),
      'Rate not found',
    );
    await this.repo.deleteRateWithAssets(id);
  }

  async getRatesForAssetType(tenantId: string, assetTypeId: number, page: number = 1, pageSize: number = 10) {
    return this.repo.findRatesForAssetType(tenantId, assetTypeId, page, pageSize);
  }

  // ==============================
  // Booking rate resolution
  // ==============================

  async getEffectiveRateForAsset(
    assetId: string,
    bookingStartDate: Date,
    bookingEndDate: Date,
    booksByAssetType: boolean = false,
  ) {
    const allRates = await this.repo.fetchActiveRates(assetId, booksByAssetType);
    const bookingMinutes = Math.ceil(
      (bookingEndDate.getTime() - bookingStartDate.getTime()) / (1000 * 60),
    );

    const startMonth = bookingStartDate.getUTCMonth() + 1;
    const startDay = bookingStartDate.getUTCDate();
    const endMonth = bookingEndDate.getUTCMonth() + 1;
    const endDay = bookingEndDate.getUTCDate();

    const applicable = allRates
      .filter((rate) => {
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
    booksByAssetType: boolean = false,
  ): Promise<Array<{ rate: any; segmentStart: Date; segmentEnd: Date }>> {
    this.logger.debug(`getEffectiveRatesForBooking - assetId: ${assetId}, start: ${bookingStartDate.toISOString()}, end: ${bookingEndDate.toISOString()}, booksByAssetType: ${booksByAssetType}`);

    const allRates = await this.repo.fetchActiveRates(assetId, booksByAssetType);
    this.logger.debug(`getEffectiveRatesForBooking - fetched ${allRates.length} active rate(s): ${JSON.stringify(allRates.map((r) => ({ id: r.id, name: r.name, pricePerUnit: r.pricePerUnit, startMonth: r.startMonth, startDay: r.startDay, endMonth: r.endMonth, endDay: r.endDay, rateTypeMinutes: r.rateTypeMinutes })))}`);
    if (allRates.length === 0) return [];

    const source = booksByAssetType ? 'assetType' as const : 'asset' as const;
    const validRates = allRates.filter((r) => r.startMonth && r.startDay && r.endMonth && r.endDay);
    this.logger.debug(`getEffectiveRatesForBooking - ${validRates.length} rate(s) with valid month/day ranges`);

    const totalBookingMinutes = Math.ceil(
      (bookingEndDate.getTime() - bookingStartDate.getTime()) / (1000 * 60),
    );

    const segments: Array<{ rate: any; segmentStart: Date; segmentEnd: Date }> = [];
    const currentDate = new Date(bookingStartDate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(bookingEndDate);
    endDate.setUTCHours(0, 0, 0, 0);

    const effectiveEnd = endDate <= currentDate ? new Date(currentDate.getTime() + 86400000) : endDate;
    this.logger.debug(`getEffectiveRatesForBooking - cursor range: ${currentDate.toISOString()} → ${effectiveEnd.toISOString()}`);

    let cursor = new Date(currentDate);

    while (cursor < effectiveEnd) {
      const cursorMonth = cursor.getUTCMonth() + 1;
      const cursorDay = cursor.getUTCDate();

      const dayRate = validRates
        .filter((r) => {
          if (!this.isDateInRateRange(cursorMonth, cursorDay, r.startMonth, r.startDay, r.endMonth, r.endDay)) return false;
          const unitMinutes = r.rateTypeMinutes || 1440;
          const bookedUnits = Math.ceil(totalBookingMinutes / unitMinutes);
          const minUnits = r.minDuration != null ? r.minDuration / unitMinutes : 0;
          const maxUnits = r.maxDuration != null ? r.maxDuration / unitMinutes : Infinity;
          return bookedUnits >= minUnits && bookedUnits <= maxUnits;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

      this.logger.debug(`getEffectiveRatesForBooking - cursor: ${cursor.toISOString()}, matched rate: ${dayRate ? `id=${dayRate.id} name=${dayRate.name} pricePerUnit=${dayRate.pricePerUnit}` : 'none'}`);

      if (!dayRate) {
        throw new ConflictException(
          `No rate covers ${cursor.toISOString().split('T')[0]}. Please ensure rates cover the entire booking period.`,
        );
      }

      const rateSeasonEnd = this.resolveRateEndDate(cursor, dayRate.startMonth, dayRate.endMonth, dayRate.endDay);
      const segEnd = new Date(Math.min(rateSeasonEnd.getTime(), effectiveEnd.getTime()));

      segments.push({ rate: { ...dayRate, source }, segmentStart: new Date(cursor), segmentEnd: segEnd });
      cursor = segEnd;
    }

    this.logger.debug(`getEffectiveRatesForBooking - returning ${segments.length} segment(s)`);
    return segments;
  }

  // ==============================
  // Public (subdomain-based) methods
  // ==============================

  async getRatesBySubdomain(subdomain: string, assetId?: string, assetTypeId?: number, page: number = 1, pageSize: number = 10) {
    const tenantId = await this.resolveTenantBySubdomain(subdomain);
    return this.getRates(tenantId, assetId, assetTypeId, page, pageSize);
  }

  async getRateBySubdomain(subdomain: string, id: number) {
    const tenantId = await this.resolveTenantBySubdomain(subdomain);
    return this.getRate(tenantId, id);
  }

  private async resolveTenantBySubdomain(subdomain: string): Promise<string> {
    const tenant = await this.repo.findTenantBySubdomain(subdomain);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant.id;
  }

  // ==============================
  // Date / overlap helpers
  // ==============================

  private monthDayToProxy(month: number, day: number): number {
    return month * 32 + day;
  }

  private isDateInRateRange(
    month: number, day: number,
    startMonth: number, startDay: number,
    endMonth: number, endDay: number,
  ): boolean {
    const cursor = this.monthDayToProxy(month, day);
    const start = this.monthDayToProxy(startMonth, startDay);
    const end = this.monthDayToProxy(endMonth, endDay);
    const yearCrossing = end < start;
    if (yearCrossing) return cursor >= start || cursor <= end;
    return cursor >= start && cursor <= end;
  }

  private resolveRateEndDate(cursor: Date, startMonth: number, endMonth: number, endDay: number): Date {
    const year = cursor.getUTCFullYear();
    const yearCrossing = endMonth < startMonth;
    const endYear = yearCrossing && cursor.getUTCMonth() + 1 >= startMonth ? year + 1 : year;
    return new Date(Date.UTC(endYear, endMonth - 1, endDay + 1));
  }

  private validateNoOverlap(
    existingRates: { startMonth: number; startDay: number; endMonth: number; endDay: number; minDuration: number | null; maxDuration: number | null }[],
    newStartMonth: number,
    newStartDay: number,
    newEndMonth: number,
    newEndDay: number,
    newMinDuration: number,
    newMaxDuration: number,
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

      let seasonOverlap: boolean;
      if (!newYearCrossing && !exYearCrossing) {
        seasonOverlap = newStart <= exEnd && newEnd >= exStart;
      } else if (newYearCrossing && !exYearCrossing) {
        seasonOverlap = exStart <= 1200 + newEnd || exEnd >= newStart;
      } else if (!newYearCrossing && exYearCrossing) {
        seasonOverlap = newStart <= 1200 + exEnd || newEnd >= exStart;
      } else {
        seasonOverlap = true;
      }

      if (seasonOverlap) {
        const durationOverlap = existingMin <= newMaxDuration && existingMax >= newMinDuration;
        if (durationOverlap) {
          throw new ConflictException(
            `Cannot save rate: overlapping min/max duration (${newMinDuration}-${newMaxDuration} min) ` +
            `with existing rate (${existingMin}-${existingMax} min) for overlapping seasonal range.`,
          );
        }
      }
    }
  }
}
