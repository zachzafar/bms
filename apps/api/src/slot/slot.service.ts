import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, lte } from 'drizzle-orm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SlotService {
  private readonly logger = new Logger(SlotService.name);

  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  // Generate daily slots for an asset for a specified number of days ahead
  async generateSlotsForRangeAndPrice(assetId: string, startDate:Date,endDate:Date,price: string,isAvailable:boolean): Promise<void> {
        // Check if slots already exist for the specified date range
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
        // create slots for the specified date range
        const slotsToInsert: schema.InsertSlot[] = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const slotDate = new Date(currentDate);
          slotDate.setHours(0, 0, 0, 0); // Set time to midnight
          slotsToInsert.push({
            assetId,
            date: slotDate,
            startTime: '00:00:00',
            endTime: '23:59:59',
            status: isAvailable? 'available' : 'unavailable',
            price,
          })
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (slotsToInsert.length > 0) {
          await this.db.insert(schema.Slot).values(slotsToInsert).execute();
        }
  }

  // Daily cron job to generate slots for all assets
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async removeSlotsForAllAssets() {  
  //   try {
  //     await this.db.delete(schema.Slot)
  //       .where(
  //         and(
  //           lte(schema.Slot.date,new Date()),
  //         )
  //       )
  //       .execute();
        
  //     this.logger.log('Daily Slot Removal');
  //   } catch (error) {
  //     this.logger.error('Error in daily slot removal', error);
  //   }
  // }

  // Get available slots for an asset in a date range
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
        if (!slot.price) {
            throw new NotFoundException('Slot price not found');
        }
        return total + parseFloat(slot.price)
    },0);
  }

  // Book multiple slots for a booking
  async bookSlots(bookingId: string,assetId: string ,startDate: Date, endDate: Date) {
    // Verify all slots exist and are available
    const available = await this.checkSlotsAvailability(assetId, startDate, endDate);
    if (!available) {
      throw new ConflictException('One or more slots are unavailable or already booked');
    }
    // Book slots
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
  }

  async getBookingSlots(bookingId: string) {
    return this.db.query.Slot.findMany({
      where: (slot, { eq }) => eq(slot.bookingId, bookingId),
      orderBy: (slot, { asc }) => [asc(slot.date)],
    });
  }

  // Release slots from a booking
  async releaseSlots(bookingId: string) {
    await this.db.update(schema.Slot)
      .set({ 
        status: 'available',
        bookingId: null 
      })
      .where(eq(schema.Slot.bookingId, bookingId))
      .execute();
  }

  // Mark slots as unavailable (e.g., for maintenance)
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
  
  // Set price for a specific slot
  async setSlotPrice(slotId: number, price: string) {
    await this.db.update(schema.Slot)
      .set({ price })
      .where(eq(schema.Slot.id, slotId))
      .execute();
  }
  
  // Set price for multiple slots in a date range
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

  async checkSlotsAvailability(assetId: string, startDate: Date, endDate: Date): Promise<boolean>  {
    const slot = await this.db.query.Slot.findFirst({
      where: (slot, { eq, and, gte, lte,or }) =>
        and(
          eq(slot.assetId, assetId),
          or(eq(slot.status, 'booked'),eq(slot.status, 'unavailable')),
          gte(slot.date, startDate),
          lte(slot.date, endDate)
        ),
    });

    if (slot) {
        return false;
      }
    
      return true;

  }

  async checkSlotsAvailabilityExcludingBooking(
    assetId: string,
    dates: { startDate: Date, endDate: Date },
    excludeBookingId: string
  ): Promise<"Unavailable" | "Available" | "Booked"> {
    // Get all slots in the date range
    const slots = await this.db.query.Slot.findMany({
      where: (slot, { eq, and, gte, lte, or, isNull }) =>
        and(
          eq(slot.assetId, assetId),
          gte(slot.date, dates.startDate),
          lte(slot.date, dates.endDate),
          or(
            isNull(slot.bookingId),
            eq(slot.bookingId, excludeBookingId)
          )
        )
    });

    // Check if any slots are unavailable
    const unavailableSlots = slots.filter(slot => slot.status === 'unavailable');
    if (unavailableSlots.length > 0) {
      return "Unavailable";
    }

    // Check if any slots are booked by other bookings
    const bookedSlots = slots.filter(slot =>
      slot.status === 'booked' && slot.bookingId !== excludeBookingId
    );
    if (bookedSlots.length > 0) {
      return "Booked";
    }

    // Check if we have slots for all days in the range
    const dayCount = Math.ceil((dates.endDate.getTime() - dates.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (slots.length < dayCount) {
      return "Unavailable"; // Some days don't have slots
    }

    return "Available";
  }

  async checkAssetCurrentSatus(assetId: string): Promise<"Available" | "Booked" | "Unavailable"> {
    const currentDate = new Date();
    const currentTime = currentDate.toISOString().slice(0, 19).replace('T', ' ');
    const slot = await this.db.query.Slot.findFirst({
      where: (slot, { eq, and, gte, lte }) =>
        and(
          eq(slot.assetId, assetId),
          gte(slot.date, currentDate),
          lte(slot.date, currentDate),
          gte(slot.startTime, currentTime),
          lte(slot.endTime, currentTime)
        ),
    })
    if (slot) {
      if (slot.status === 'booked') {
        return "Booked";
      } else if (slot.status === 'unavailable') {
        return "Unavailable";
      } else {
        return "Available";
      }
    }
    return "Unavailable";
  }

  async getRangesForAssetByPriceAndAvailability(assetId: string) {
    const slots = await this.db.query.Slot.findMany({
      where: (slot, { eq }) => eq(slot.assetId, assetId),
      orderBy: (slot, { asc }) => [asc(slot.date)],
    });
    const ranges: { startDate: string ;endDate: string; price: string  ; available: boolean }[] = [];
    let currentRange: { startDate: string; endDate: string; price: string  ; available: boolean} | null = null;

    // assume slots are sorted by date and time in ascending order
    // iterate through the slots
    for (const slot of slots) {
      const isAvailable = slot.status === 'available' || slot.status === 'booked';
      
      if (!currentRange) {
        // if there's no current range, start a new one
        currentRange = {
          startDate: slot.date.toISOString(),
          endDate: slot.date.toISOString(),
          price: slot.price ?? '0',
          available: isAvailable,
        };
      } else {
        // Check if price or availability status has changed
        const samePrice = slot.price === currentRange.price;
        const sameAvailability = isAvailable === currentRange.available;
        
        // Check if date is consecutive (next day)
        const isConsecutive = slot.date.getTime() === new Date(currentRange.endDate).getTime() + 86400000;
        
        if (isConsecutive && samePrice && sameAvailability) {
          // If everything matches, extend the current range
          currentRange.endDate = slot.date.toISOString();
        } else {
          // If anything differs, end the current range and start a new one
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
    
    // Add the last range if it exists
    if (currentRange) {
      ranges.push(currentRange);
    }
    
    return ranges;
  }
  
}


