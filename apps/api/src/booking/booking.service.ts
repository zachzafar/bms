import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { type InsertBooking, type UpdateBooking, type SelectBooking, Availability, InsertAvailability } from '@repo/api-contract';
import { and, between, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { MaintenanceService } from 'src/maintenance/maintenance.service';
import { ExtendedSelectBooking } from '@repo/api-contract/src/api-contract/booking';

@Injectable()
export class BookingService {
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
        @Inject(forwardRef(() => MaintenanceService)) private readonly maintenanceService: MaintenanceService,
    ) {}




    async createBooking(booking: InsertBooking) {
        const status  = await this.checkAvailability(booking.assetId,{ startDate: booking.startDate, endDate: booking.endDate});
       
        
        
        if (status !== 'Available') {
          throw new ConflictException('The asset is not available for the selected dates.');
        }


       try{
        const result = await this.db.insert(schema.Booking).values(booking).$returningId()

        return result[0].id
       } catch (e) {
        throw new ConflictException('Error occured while creating booking');
       }
    }

    async getBooking(bookingId: string): Promise<ExtendedSelectBooking> {
      const booking = await this.db
      .select()
      .from(schema.UserHasBookings)
      .innerJoin(schema.User, eq(schema.UserHasBookings.userId,schema.User.id))
      .innerJoin(schema.Booking, eq(schema.UserHasBookings.bookingId,schema.Booking.id))
      .innerJoin(schema.Asset, eq(schema.Booking.assetId,schema.Asset.id))
      .innerJoin(schema.Customer, eq(schema.Customer.userId,schema.User.id))
      .where(eq(schema.Booking.id,bookingId))
      .execute()
      .then(rows => rows[0]);
       // const booking = await this.db.query.Booking.findFirst({ where: (booking, { eq }) => eq(booking.id, bookingId)})
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return {
      ...booking.booking,
      customer: booking.customer_details,
      asset: {...booking.assets, assetTypeId: booking.assets.assetTypeId ? Number(booking.assets.assetTypeId) : undefined},
    }
    }

    async getBookingsByAssetId(assetId: string,period?: { startDate: Date, endDate: Date }) {
        
        return await this.db.query.Booking.findMany({ where: (booking, { eq, and, gte, lte,or }) => period ? and(eq(booking.assetId, assetId),or(gte(booking.startDate,period.endDate),lte(booking.endDate,period.endDate))) : eq(booking.assetId, assetId) });
    }

    async getBookings() {
         const bookings = await this.db
         .select()
         .from(schema.UserHasBookings)
         .innerJoin(schema.User, eq(schema.UserHasBookings.userId,schema.User.id))
         .innerJoin(schema.Booking, eq(schema.UserHasBookings.bookingId,schema.Booking.id))
         .innerJoin(schema.Asset, eq(schema.Booking.assetId,schema.Asset.id))
         .innerJoin(schema.Customer, eq(schema.Customer.userId,schema.User.id))
         .execute()
        

        return bookings.map(booking => ({
            ...booking.booking,
            customer: booking.customer_details,
            asset: booking.assets,
          }));
    }

    async updateBooking(booking: UpdateBooking) {
        const existingBooking = await this.getBooking(booking.id);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }
    const status = await this.checkAvailability(existingBooking.assetId, { startDate:booking.startDate, endDate:booking.endDate});
    if (status !== 'Available') {
      throw new ConflictException('The asset is not available for the selected dates.');
    }
    await this.db.update(schema.Booking).set(booking).where(eq(schema.Booking.id, booking.id)).execute();
    return  this.getBooking(booking.id);
    }

    async deleteBooking(bookingId: string) {
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

    async  calculatePrice(assetId: string, startDate: string, endDate: string): Promise<number> {
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

    async checkAvailability(assetId: string, dates?: {startDate: Date, endDate: Date}): Promise<"Unavailable"| "Available" | "Booked"> {
      type STATUS = "Unavailable" | "Available" | "Booked"; 
      
      // If no dates provided, check current availability
      const currentDate = new Date();
      const startDate = dates?.startDate || currentDate;
      const endDate = dates?.endDate || currentDate;

      // Check for unavailable periods (maintenance, etc.)
      const unavailablePeriods = await this.db.select()
        .from(schema.Availability)
        .where(
          and( 
            eq(schema.Availability.assetId, assetId),
            eq(schema.Availability.available, false),
            lte(schema.Availability.startDate, endDate),
            gte(schema.Availability.endDate, startDate)
          )
        );

      // Check for existing bookings
      const existingBookings = await this.db.select()
        .from(schema.Booking)
        .where(
          and(
            eq(schema.Booking.assetId, assetId),
            lte(schema.Booking.startDate, endDate),
            gte(schema.Booking.endDate, startDate)
          )
        );

      // Determine status
      if (unavailablePeriods.length > 0) {
        return "Unavailable";
      }
      
      if (existingBookings.length > 0) {
        return "Booked";
      }

      return "Available";
    }

     async addAvailabilityException(data: InsertAvailability) {
      return await this.db.insert(schema.Availability).values(data).$returningId().execute();
    }

    async getAvailabilityExceptions(assetId: string,) {
      return await this.db.query.Availability.findMany({ where: (availability, { eq }) => eq(availability.assetId, assetId) })
    }

}
