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




    async createBooking(booking: InsertBooking,customers: number[]) {
      if (!customers.length) {
        throw new ConflictException('No customers selected');
      }
      
      const status  = await this.checkAvailability(booking.assetId,{ startDate: new Date(booking.startDate), endDate: new Date(booking.endDate)});
       
        if (status !== 'Available') {
          throw new ConflictException('The asset is not available for the selected dates.');
        }

        const users = (await this.db.query.Customer.findMany({where: (user, {inArray}) => inArray(user.id, customers),with: { user: true}})).map(({user}) => user);

       try{
        await this.db.transaction(async (tx) => {
            const bookingId = await tx.insert(schema.Booking).values({...booking, startDate: new Date(booking.startDate), endDate: new Date(booking.endDate)}).$returningId();
            await tx.insert(schema.UserHasBookings).values(users.map(user => ({bookingId: bookingId[0].id, userId: user.id})));
        })

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
      startDate: booking.booking.startDate.toISOString(),
      endDate: booking.booking.endDate.toISOString(),
      user: booking.users,
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
            startDate: booking.booking.startDate.toISOString(),
            endDate: booking.booking.endDate.toISOString(),
            customer: booking.customer_details,
            asset: booking.assets,
            user: booking.users
          }));
    }

    async updateBooking(id: string) {
        const existingBooking = await this.getBooking(id);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }
    const status = await this.checkAvailability(existingBooking.assetId, { startDate: new Date(existingBooking.startDate), endDate: new Date(existingBooking.endDate)});
    if (status !== 'Available') {
      throw new ConflictException('The asset is not available for the selected dates.');
    }
    await this.db.update(schema.Booking).set({...existingBooking,startDate: new Date(existingBooking.startDate), endDate: new Date(existingBooking.endDate) }).where(eq(schema.Booking.id, existingBooking.id)).execute();
    return  this.getBooking(existingBooking.id);
    }

    async deleteBooking(bookingId: string) {
        const existingBooking = await this.getBooking(bookingId);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }
    await this.db.delete(schema.Booking).where(eq(schema.Booking.id, bookingId)).execute();
    }

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
      return await this.db.insert(schema.Availability).values({...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate)}).$returningId().execute();
    }

    async getAvailabilityExceptions(assetId: string,) {
      return await this.db.query.Availability.findMany({ where: (availability, { eq }) => eq(availability.assetId, assetId) })
    }

}
