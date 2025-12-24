import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from 'src/database-schema';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, lte, or, isNull } from 'drizzle-orm';

@Injectable()
export class SlotService {
  private readonly logger = new Logger(SlotService.name);

  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async generateSlotsForRangeAndPrice(
    assetId: string,
    startDate: Date,
    endDate: Date,
    price: string,
    isAvailable: boolean
  ): Promise<void> {
    const existingSlots = await this.db.query.Slot.findMany({
      where: (slot, { eq, and, gte, lte }) =>
        and(
          eq(slot.assetId, assetId),
          gte(slot.date, startDate),
          lte(slot.date, endDate)
        ),
    });

    if (existingSlots.length > 0) {
      throw new ConflictException('Slots already exist for the specified date range');
    }

    const slotsToInsert: schema.InsertSlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateOnly = new Date(currentDate);
      dateOnly.setHours(0, 0, 0, 0);

      const startTime = new Date(dateOnly);
      startTime.setHours(0, 0, 0, 0);

      const endTime = new Date(dateOnly);
      endTime.setHours(23, 59, 59, 999);

      slotsToInsert.push({
        assetId,
        date: dateOnly,
        startTime,
        endTime,
        status: isAvailable ? 'available' : 'unavailable',
        price,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (slotsToInsert.length > 0) {
      await this.db.insert(schema.Slot).values(slotsToInsert).execute();
    }
  }

  async getAvailableSlots(assetId: string, startDate: Date, endDate: Date) {
    return this.db.query.Slot.findMany({
      where: (slot, { eq, and, gte, lte }) =>
        and(
          eq(slot.assetId, assetId),
          eq(slot.status, 'available'),
          gte(slot.date, startDate),
          lte(slot.date, endDate)
        ),
      orderBy: (slot, { asc }) => [asc(slot.date)],
    });
  }

  async getTotalPriceForSlots(assetId: string, startDate: Date, endDate: Date) {
    const result = await this.getAvailableSlots(assetId, startDate, endDate);
    return result.reduce((total, slot) => {
      if (!slot.price) throw new NotFoundException('Slot price not found');
      return total + parseFloat(slot.price);
    }, 0);
  }

  async bookSlots(bookingId: string, assetId: string, startDate: Date, endDate: Date) {
    const available = await this.checkSlotsAvailability(assetId, startDate, endDate);
    if (!available) throw new ConflictException('One or more slots are unavailable or already booked');

    await this.db.update(schema.Slot)
      .set({ status: 'booked', bookingId })
      .where(
        and(
          eq(schema.Slot.assetId, assetId),
          eq(schema.Slot.status, 'available'),
          gte(schema.Slot.date, startDate),
          lte(schema.Slot.date, endDate)
        )
      )
      .execute();
  }

  async getBookingSlots(bookingId: string) {
    return this.db.query.Slot.findMany({
      where: (slot, { eq }) => eq(slot.bookingId, bookingId),
      orderBy: (slot, { asc }) => [asc(slot.date)],
    });
  }

  async releaseSlots(bookingId: string) {
    await this.db.update(schema.Slot)
      .set({ status: 'available', bookingId: null })
      .where(eq(schema.Slot.bookingId, bookingId))
      .execute();
  }

  async markSlotsUnavailable(assetId: string, startDate: Date, endDate: Date) {
    await this.db.update(schema.Slot)
      .set({ status: 'unavailable' })
      .where(
        and(
          eq(schema.Slot.assetId, assetId),
          eq(schema.Slot.status, 'available'),
          gte(schema.Slot.date, startDate),
          lte(schema.Slot.date, endDate)
        )
      )
      .execute();
  }

  async setSlotPrice(slotId: number, price: string) {
    await this.db.update(schema.Slot)
      .set({ price })
      .where(eq(schema.Slot.id, slotId))
      .execute();
  }

  async setSlotPricesInRange(assetId: string, startDate: Date, endDate: Date, price: string) {
    await this.db.update(schema.Slot)
      .set({ price })
      .where(
        and(
          eq(schema.Slot.assetId, assetId),
          gte(schema.Slot.date, startDate),
          lte(schema.Slot.date, endDate)
        )
      )
      .execute();
  }

  async checkSlotsAvailability(assetId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const slot = await this.db.query.Slot.findFirst({
      where: (slot, { eq, and, gte, lte, or }) =>
        and(
          eq(slot.assetId, assetId),
          or(eq(slot.status, 'booked'), eq(slot.status, 'unavailable')),
          gte(slot.date, startDate),
          lte(slot.date, endDate)
        ),
    });

    return !slot;
  }

  async checkSlotsAvailabilityExcludingBooking(
    assetId: string,
    dates: { startDate: Date, endDate: Date },
    excludeBookingId: string
  ): Promise<'Unavailable' | 'Available' | 'Booked'> {
    const slots = await this.db.query.Slot.findMany({
      where: (slot, { eq, and, gte, lte, or, isNull }) =>
        and(
          eq(slot.assetId, assetId),
          gte(slot.date, dates.startDate),
          lte(slot.date, dates.endDate),
          or(isNull(slot.bookingId), eq(slot.bookingId, excludeBookingId))
        )
    });

    const unavailableSlots = slots.filter(slot => slot.status === 'unavailable');
    if (unavailableSlots.length > 0) return 'Unavailable';

    const bookedSlots = slots.filter(slot =>
      slot.status === 'booked' && slot.bookingId !== excludeBookingId
    );
    if (bookedSlots.length > 0) return 'Booked';

    const dayCount = Math.ceil((dates.endDate.getTime() - dates.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (slots.length < dayCount) return 'Unavailable';

    return 'Available';
  }

  async checkAssetCurrentSatus(assetId: string): Promise<'Available' | 'Booked' | 'Unavailable'> {
    const now = new Date();
    const slot = await this.db.query.Slot.findFirst({
      where: (slot, { eq, and, gte, lte }) =>
        and(
          eq(slot.assetId, assetId),
          eq(slot.date, new Date(now.toDateString())),
          gte(slot.startTime, now),
          lte(slot.endTime, now)
        ),
    });

    if (slot) {
      if (slot.status === 'booked') return 'Booked';
      if (slot.status === 'unavailable') return 'Unavailable';
      return 'Available';
    }

    return 'Unavailable';
  }

  async getRangesForAssetByPriceAndAvailability(assetId: string) {
    const slots = await this.db.query.Slot.findMany({
      where: (slot, { eq }) => eq(slot.assetId, assetId),
      orderBy: (slot, { asc }) => [asc(slot.date)],
    });

    const ranges: { startDate: string; endDate: string; price: string; available: boolean }[] = [];
    let currentRange: { startDate: string; endDate: string; price: string; available: boolean } | null = null;

    for (const slot of slots) {
      const isAvailable = slot.status === 'available' || slot.status === 'booked';

      if (!currentRange) {
        currentRange = {
          startDate: slot.date.toISOString(),
          endDate: slot.date.toISOString(),
          price: slot.price ?? '0',
          available: isAvailable,
        };
      } else {
        const samePrice = slot.price === currentRange.price;
        const sameAvailability = isAvailable === currentRange.available;
        const isConsecutive = slot.date.getTime() === new Date(currentRange.endDate).getTime() + 86400000;

        if (isConsecutive && samePrice && sameAvailability) {
          currentRange.endDate = slot.date.toISOString();
        } else {
          ranges.push(currentRange);
          currentRange = {
            startDate: slot.date.toISOString(),
            endDate: slot.date.toISOString(),
            price: slot.price ?? '0',
            available: isAvailable,
          };
        }
      }
    }

    if (currentRange) {
      ranges.push(currentRange);
    }

    return ranges;
  }
}
