import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { type InsertBooking, type UpdateBooking } from '@repo/api-contract';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { ExtendedSelectBooking } from '@repo/api-contract/src/api-contract/booking';
import { SlotService } from '../slot/slot.service';

@Injectable()
export class BookingService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private readonly slotService: SlotService,
  ) { }

  async createBooking(booking: InsertBooking, customerIds: number[]): Promise<string | void> {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    if (!customerIds.length) {
      throw new ConflictException('No customers selected');
    }

    const customers = await this.db.query.Customer.findMany({
      where: (customer, { inArray }) => inArray(customer.id, customerIds),
    })

    if (!customers.length) {
      throw new ConflictException('No customers found');
    }

    const available = this.slotService.checkSlotsAvailability(booking.assetId, startDate, endDate);
    if (!available) {
      throw new ConflictException('One or more slots are unavailable or already booked');
    }


    try {
      let bookingId: string;

      await this.db.transaction(async (tx) => {
        // Create the booking
        const totalPrice = await this.slotService.getTotalPriceForSlots(booking.assetId, startDate, endDate);
        const [{ id }] = await tx.insert(schema.Booking).values({
          ...booking,
          startDate,
          endDate,
          totalPrice: totalPrice.toString()
        }).$returningId();

        bookingId = id;

        await tx.update(schema.Slot)
          .set({ status: 'booked', bookingId })
          .where(
            and(
              eq(schema.Slot.assetId, booking.assetId),
              eq(schema.Slot.status, 'available'),
              gte(schema.Slot.date, startDate),
              lte(schema.Slot.date, endDate)
            )
          )

        // Associate users with the booking
        await tx.insert(schema.UserHasBookings).values(
          customers.map(customer => ({ bookingId, userId: customer.userId }))
        );

        return (await this.getBooking(bookingId)).id
      });
      
    } catch (e) {
      throw new ConflictException('Error occurred while creating booking: ' + e);
    }
  }

  async getBooking(bookingId: string): Promise<ExtendedSelectBooking> {
    const booking = await this.db
      .select()
      .from(schema.UserHasBookings)
      .innerJoin(schema.User, eq(schema.UserHasBookings.userId, schema.User.id))
      .innerJoin(schema.Booking, eq(schema.UserHasBookings.bookingId, schema.Booking.id))
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.Customer, eq(schema.Customer.userId, schema.User.id))
      .where(eq(schema.Booking.id, bookingId))
      .execute()
      .then(rows => rows[0]);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      ...booking.booking,
      startDate: booking.booking.startDate.toISOString(),
      endDate: booking.booking.endDate.toISOString(),
      user: booking.users,
      customer: booking.customer_details,
      asset: { ...booking.assets, assetTypeId: booking.assets.assetTypeId ? Number(booking.assets.assetTypeId) : undefined },
    }
  }

  async getBookingsByAssetId(assetId: string, period?: { startDate: Date, endDate: Date }) {
    return await this.db.query.Booking.findMany({
      where: (booking, { eq, and, gte, lte, or }) =>
        period
          ? and(
            eq(booking.assetId, assetId),
            or(
              gte(booking.startDate, period.startDate),
              lte(booking.endDate, period.endDate)
            )
          )
          : eq(booking.assetId, assetId)
    });
  }

  async getBookings() {
    const bookings = await this.db
      .select()
      .from(schema.UserHasBookings)
      .innerJoin(schema.User, eq(schema.UserHasBookings.userId, schema.User.id))
      .innerJoin(schema.Booking, eq(schema.UserHasBookings.bookingId, schema.Booking.id))
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.Customer, eq(schema.Customer.userId, schema.User.id))
      .execute();

    return bookings.map(booking => ({
      ...booking.booking,
      startDate: booking.booking.startDate.toISOString(),
      endDate: booking.booking.endDate.toISOString(),
      customer: booking.customer_details,
      asset: booking.assets,
      user: booking.users
    }));
  }

  async updateBooking( updateData: UpdateBooking) {
      const available = await this.slotService.checkSlotsAvailabilityExcludingBooking(updateData.assetId,{ startDate: new Date(updateData.startDate), endDate: new Date(updateData.endDate)}, updateData.id);
      if (available !== 'Available') {
        throw new ConflictException('One or more slots are unavailable or already booked');
      }
      const totalPrice = await this.slotService.getTotalPriceForSlots(updateData.assetId, new Date(updateData.startDate), new Date(updateData.endDate));
      
      try {
        await this.db.transaction(async (tx) => {
          // Update the booking
          await tx.update(schema.Booking)
           .set({
              startDate: new Date(updateData.startDate),
              endDate: new Date(updateData.endDate),
              totalPrice: totalPrice.toString()
            })
           .where(eq(schema.Booking.id, updateData.id))

          // Release slots
          await tx.update(schema.Slot)
          .set({ 
            status: 'available',
            bookingId: null 
          })
          .where(eq(schema.Slot.bookingId, updateData.id))

          // Book slots
          await tx.update(schema.Slot)
         .set({ status: 'booked', bookingId: updateData.id })
         .where(
            and(
              eq(schema.Slot.assetId, updateData.assetId),
              eq(schema.Slot.status, 'available'),
              gte(schema.Slot.date, new Date(updateData.startDate)),
              lte(schema.Slot.date, new Date(updateData.endDate))
            )
         )
        }) 
      } catch (e) {
        throw new ConflictException('Error occurred while updating booking:'+ e);
      }
    }

  async deleteBooking(bookingId: string) {
    const existingBooking = await this.getBooking(bookingId);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    // Release slots associated with this booking
    await this.db.update(schema.Slot)
      .set({
        status: 'available',
        bookingId: null
      })
      .where(eq(schema.Slot.bookingId, bookingId))
      .execute();

    // Delete the booking
    await this.db.delete(schema.Booking)
      .where(eq(schema.Booking.id, bookingId))
      .execute();
  }

  // Check availability excluding a specific booking
  
  
}
