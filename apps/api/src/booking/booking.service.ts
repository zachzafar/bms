import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { type InsertBooking, type UpdateBooking, type SelectBooking, Availability, InsertAvailability } from '@repo/api-contract';
import { and, between, eq, sql, sum } from 'drizzle-orm';
import { MaintenanceService } from 'src/maintenance/maintenance.service';
import { ExtendedSelectBooking } from '@repo/api-contract/src/api-contract/booking';

@Injectable()
export class BookingService {
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
        @Inject(forwardRef(() => MaintenanceService)) private readonly maintenanceService: MaintenanceService,
    ) {}




    async createBooking(booking: InsertBooking) {
        const   available  = await this.checkAvailability(booking.assetId, booking.startDate, booking.endDate);
       
        
        
        if (!available) {
          throw new ConflictException('The asset is not available for the selected dates.');
        }


        const newBookingId = await this.db.insert(schema.Booking).values(booking).$returningId().execute();
        return await this.getBooking(newBookingId[0].id);
    }

    async getBooking(bookingId: number): Promise<ExtendedSelectBooking> {
      const booking = await this.db
      .select()
      .from(schema.Booking)
      .innerJoin(schema.Asset, eq(schema.Booking.assetId,schema.Asset.id))
      .innerJoin(schema.Customer, eq(schema.Booking.customerId,schema.Customer.id))
      .where(eq(schema.Booking.id,bookingId))
      .execute()
      .then(rows => rows[0]);
       // const booking = await this.db.query.Booking.findFirst({ where: (booking, { eq }) => eq(booking.id, bookingId)})
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return {
      ...booking.booking,
      asset: booking.assets,
      customer: booking.customers
    }
    }

    async getBookingsByAssetId(assetId: bigint,period?: { startDate: Date, endDate: Date }) {
        
        return await this.db.query.Booking.findMany({ where: (booking, { eq, and, gte, lte,or }) => period ? and(eq(booking.assetId, assetId),or(gte(booking.startDate,period.endDate),lte(booking.endDate,period.endDate))) : eq(booking.assetId, assetId) });
    }

    async getBookings() {
         const bookings = await this.db
        .select()
        .from(schema.Booking)
        .innerJoin(schema.Asset, eq(schema.Booking.assetId,schema.Asset.id))
        .innerJoin(schema.Customer, eq(schema.Booking.customerId,schema.Customer.id))
        .execute()
        

        return bookings.map(booking => ({
            ...booking.booking,
            asset: booking.assets,
            customer: booking.customers
          }));
    }

    async updateBooking(booking: UpdateBooking) {
        const existingBooking = await this.getBooking(booking.id);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }
    const isAvailable = await this.checkAvailability(existingBooking.assetId, booking.startDate, booking.endDate);
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

    // async checkAvailability(assetId: bigint,startDate: Date, endDate: Date, bookingId?: number): Promise<{ available: boolean, conflictingBookings:SelectBooking[] }> {

    //     const conflictingBookings = await this.db.query.Booking.findMany({
    //         where: (booking, { and, eq, not, or, lte, gte }) =>
    //             and(
    //               eq(booking.assetId, assetId),
    //               bookingId ? not(eq(booking.id, bookingId)) : undefined, // Exclude the current booking
    //               and(
    //                 lte(booking.startDate, endDate),         // Booking starts before the current ends
    //                 gte(booking.endDate, startDate)          // Booking ends after the current starts
    //               )
    //             )
    //     })


    //     if (conflictingBookings.length > 0) {
    //         return { available: false, conflictingBookings };
    //     }
        
    //     return { available: true, conflictingBookings: [] };
    // }

    async  calculatePrice(assetId: bigint, startDate: string, endDate: string): Promise<number> {
      const result = await this.db
  .select({ total: sum(schema.Availability.price) })
  .from(schema.Availability)
  .where(
    and(
      eq(schema.Availability.assetId, assetId),
      between(sql`${startDate}`, schema.Availability.startDate, schema.Availability.endDate)
    )
  );

      return Number(result[0]?.total) ?? 0;
    }

    async checkAvailability(assetId: bigint, startDate: Date, endDate: Date): Promise<boolean> {
      const result = await this.db.select({ exists: sql`1` })
        .from(schema.Availability)
        .where(
          and(
            eq(schema.Availability.assetId, assetId),
            eq(schema.Availability.available, false),
            sql`(start_date, end_date) OVERLAPS (${startDate}, ${endDate})`
          )
        );
    
      return result.length === 0; // Returns TRUE if the asset is available
    }

     async addAvailabilityException(assetId: bigint, startDate: Date, endDate:Date , isAvailable: boolean,price: string) {
      const availabilityException: InsertAvailability = {
        startDate,
        endDate,
        price,
        available: isAvailable,
        assetId,
      }
      await this.db.insert(schema.Availability).values(availabilityException);
    }


}
