import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, inArray, isNull, lte } from 'drizzle-orm';

// Helper function to convert to UTC DateTime
function toUTCDateTime(input: string | Date): Date {
  if (typeof input === 'string' && input.endsWith('Z')) {
    return new Date(input);
  }

  const [datePart, timePart] = (typeof input === 'string' ? input : input.toISOString()).split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart
    ? timePart.replace('Z', '').split(':').map(Number)
    : [0, 0, 0];

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds || 0));
}

@Injectable()
export class BlockedDatesService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async getBlockedDates(assetId?: string) {
    const blocked = await this.db.query.BlockedDate.findMany({
      where: assetId ? (b) => eq(b.assetId, assetId) : undefined,
    });

    return blocked.map(b => ({
      ...b,
      reason: b.reason ?? undefined,
    }));
  }

  async createBlockedDate(data: schema.InsertBlockedDate) {
    const { startDate, endDate, tenantId, assetId, reason, title } = data;

    const utcStart = toUTCDateTime(startDate);
    const utcEnd = toUTCDateTime(endDate);

    const conflicts = await this.db.query.BlockedDate.findMany({
      where: (bd, { and, eq, gte, lte, or }) =>
        and(
          eq(bd.assetId, assetId),
          or(
            and(gte(bd.startDate, utcStart), lte(bd.startDate, utcEnd)),
            and(gte(bd.endDate, utcStart), lte(bd.endDate, utcEnd))
          )
        ),
    });

    if (conflicts.length) {
      throw new ConflictException('Blocked date range overlaps with existing blocked dates');
    }

    const [{ id }] = await this.db
      .insert(schema.BlockedDate)
      .values({
        tenantId,
        assetId,
        startDate: utcStart,
        endDate: utcEnd,
        reason,
        title,
      })
      .$returningId();

    return { message: 'Blocked date created', blockedDateId: id };
  }

  async updateBlockedDate(id: number, data: schema.UpdateBlockedDate) {
    const existing = await this.db.query.BlockedDate.findFirst({
      where: (bd, { eq }) => eq(bd.id, id),
    });

    if (!existing) {
      throw new NotFoundException('Blocked date not found');
    }

    await this.db.update(schema.BlockedDate)
      .set({
        startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
        endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
        reason: data.reason ?? existing.reason,
        assetId: data.assetId ?? existing.assetId,
        tenantId: data.tenantId ?? existing.tenantId,
      })
      .where(eq(schema.BlockedDate.id, id))
      .execute();

    return { message: 'Blocked date updated' };
  }

  async deleteBlockedDate(id: number) {
    const existing = await this.db.query.BlockedDate.findFirst({
      where: (bd, { eq }) => eq(bd.id, id),
    });

    if (!existing) {
      throw new NotFoundException('Blocked date not found');
    }

    await this.db.delete(schema.BlockedDate)
      .where(eq(schema.BlockedDate.id, id))
      .execute();
  }

  /**
   * Get fully blocked days for an asset type (when all assets of that type are booked)
   */
  async getFullyBlockedDaysForAssetType(
    assetTypeId: number,
    from?: Date,
    to?: Date
  ): Promise<{ start: Date; end: Date }[]> {

    // 1. Get all assets of this type
    const assets = await this.db
      .select({ id: schema.Asset.id })
      .from(schema.Asset)
      .where(
        and(
          eq(schema.Asset.assetTypeId, assetTypeId),
          eq(schema.Asset.available, true),
          isNull(schema.Asset.deletedAt)
        )
      );

    if (assets.length === 0) return [];

    const assetIds = assets.map(a => a.id);

    // 2. Get all blocked ranges for those assets
    const whereConditions = [inArray(schema.BlockedDate.assetId, assetIds)];

    if (from && to) {
      whereConditions.push(
        lte(schema.BlockedDate.startDate, to),
        gte(schema.BlockedDate.endDate, from)
      );
    }

    const blockedRanges = await this.db
      .select({
        assetId: schema.BlockedDate.assetId,
        start: schema.BlockedDate.startDate,
        end: schema.BlockedDate.endDate,
      })
      .from(schema.BlockedDate)
      .where(and(...whereConditions));

    // If no date range specified, find the min/max dates from blocked ranges
    if (!from || !to) {
      if (blockedRanges.length === 0) return [];

      const minDate = new Date(Math.min(...blockedRanges.map(r => new Date(r.start).getTime())));
      const maxDate = new Date(Math.max(...blockedRanges.map(r => new Date(r.end).getTime())));

      from = minDate;
      to = maxDate;
    }

    // 3. Group ranges by asset
    const byAsset = new Map<string, { start: Date; end: Date }[]>();

    for (const r of blockedRanges) {
      if (!byAsset.has(r.assetId)) byAsset.set(r.assetId, []);
      byAsset.get(r.assetId)!.push({
        start: new Date(r.start),
        end: new Date(r.end),
      });
    }

    // 4. Helper — is a day blocked for an asset?
    const isBlocked = (
      day: Date,
      ranges: { start: Date; end: Date }[]
    ) => ranges.some(r => day >= r.start && day <= r.end);

    // 5. Walk days and build continuous ranges
    const fullyBlockedRanges: { start: Date; end: Date }[] = [];

    let currentStart: Date | null = null;

    for (
      let d = new Date(from);
      d <= to;
      d.setDate(d.getDate() + 1)
    ) {
      let blockedForAll = true;

      for (const assetId of assetIds) {
        const ranges = byAsset.get(assetId) || [];

        if (!isBlocked(d, ranges)) {
          blockedForAll = false;
          break;
        }
      }

      if (blockedForAll) {
        if (!currentStart) {
          currentStart = new Date(d);
        }
      } else {
        if (currentStart) {
          const end = new Date(d);
          end.setDate(end.getDate() - 1);

          fullyBlockedRanges.push({
            start: currentStart,
            end,
          });

          currentStart = null;
        }
      }
    }

    // If the last range runs until `to`
    if (currentStart) {
      fullyBlockedRanges.push({
        start: currentStart,
        end: new Date(to),
      });
    }

    return fullyBlockedRanges;
  }
}
