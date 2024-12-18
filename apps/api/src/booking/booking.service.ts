import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import type { InsertBooking, UpdateBooking, SelectBooking } from '@repo/api-contract';
import { eq } from 'drizzle-orm';

@Injectable()
export class BookingService {
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

    async createBooking(booking: InsertBooking) {
        const isAvailable = await this.checkAvailability(booking.assetId, booking.startDate, booking.endDate);
        if (!isAvailable) {
          throw new ConflictException('The asset is not available for the selected dates.');
        }
        const newBookingId = await this.db.insert(schema.Booking).values(booking).$returningId().execute();
        return await this.getBooking(newBookingId[0].id);
    }

    async getBooking(bookingId: number) {
        const booking = await this.db.query.Booking.findFirst({ where: (booking, { eq }) => eq(booking.id, bookingId) });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
    }

    async getBookingsByAssetId(assetId: number,period?: { startDate: Date, endDate: Date }) {
        
        return await this.db.query.Booking.findMany({ where: (booking, { eq, and, gte, lte,or }) => period ? and(eq(booking.assetId, assetId),or(gte(booking.startDate,period.endDate),lte(booking.endDate,period.endDate))) : eq(booking.assetId, assetId) });
    }

    async getBookings() {
        return await this.db.query.Booking.findMany();
    }

    async updateBooking(booking: UpdateBooking) {
        const existingBooking = await this.getBooking(booking.id);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }
    const isAvailable = await this.checkAvailability(existingBooking.assetId, booking.startDate, booking.endDate, booking.id);
    if (!isAvailable) {
      throw new ConflictException('The asset is not available for the selected dates.');
    }
    await this.db.update(schema.Booking).set(booking).where(eq(schema.Booking.id, booking.id)).execute();
    return  this.getBooking(booking.id);
    }

    async deleteBooking(bookingId: number) {
        const existingBooking = await this.getBooking(bookingId);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }
    await this.db.delete(schema.Booking).where(eq(schema.Booking.id, bookingId)).execute();
    }

    async checkAvailability(assetId: number,startDate: Date, endDate: Date, bookingId?: number): Promise<{ available: boolean, conflictingBookings:SelectBooking[] }> {

        const conflictingBookings = await this.db.query.Booking.findMany({
            where: (booking, { and, eq, not, or, lte, gte }) =>
                and(
                  eq(booking.assetId, assetId),
                  bookingId ? not(eq(booking.id, bookingId)) : undefined, // Exclude the current booking
                  and(
                    lte(booking.startDate, endDate),         // Booking starts before the current ends
                    gte(booking.endDate, startDate)          // Booking ends after the current starts
                  )
                )
        })


        if (conflictingBookings.length > 0) {
            return { available: false, conflictingBookings };
        }
        
        return { available: true, conflictingBookings: [] };
    }
}
