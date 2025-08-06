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
      let bookingId: string = ''

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
      });

      return bookingId;

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

  async getBookings(tenantId?: string) {
    const bookings = await this.db
      .select()
      .from(schema.UserHasBookings)
      .innerJoin(schema.User, eq(schema.UserHasBookings.userId, schema.User.id))
      .innerJoin(schema.Booking, eq(schema.UserHasBookings.bookingId, schema.Booking.id))
      .innerJoin(schema.Asset, and(eq(schema.Booking.assetId, schema.Asset.id), tenantId ? eq(schema.Asset.tenantId, tenantId) : undefined))
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

  async updateBooking(updateData: UpdateBooking) {
    const available = await this.slotService.checkSlotsAvailabilityExcludingBooking(updateData.assetId, { startDate: new Date(updateData.startDate), endDate: new Date(updateData.endDate) }, updateData.id);
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
      throw new ConflictException('Error occurred while updating booking:' + e);
    }
  }

  async deleteBooking(bookingId: string) {
  const existingBooking = await this.getBooking(bookingId);
  if (!existingBooking) {
    throw new NotFoundException('Booking not found');
  }

  // Delete dependent user_has_bookings rows first
  await this.db.delete(schema.UserHasBookings)
    .where(eq(schema.UserHasBookings.bookingId, bookingId))
    .execute();

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

  async createBookingByTag(
    data: {
      tagId: number;
      startDate: string;
      endDate: string;
      customerIds: number[];
    },
    tenantId: string
  ) {
    const { tagId, startDate, endDate, customerIds } = data;

    // Step 1: Find all assets with this tag + tenant match
    const assets = await this.db
      .select({ id: schema.Asset.id })
      .from(schema.Asset)
      .innerJoin(schema.AssetHasTags, eq(schema.Asset.id, schema.AssetHasTags.assetId))
      .where(and(
        eq(schema.AssetHasTags.tagId, BigInt(tagId)),
        eq(schema.Asset.tenantId, tenantId)
      ));

    // Step 2: Loop through assets to find first available one
    for (const asset of assets) {
      const available = await this.slotService.checkSlotsAvailability(
        asset.id,
        new Date(startDate),
        new Date(endDate)
      );

      if (available) {
        // Step 3: Use existing booking logic
        const bookingId = await this.createBooking(
          {
            assetId: asset.id,
            startDate,
            endDate
          },
          customerIds
        );

        return {
          message: 'Booking created by tag',
          assetId: asset.id,
          bookingId: bookingId ?? ''
        };
      }
    }

    throw new ConflictException('No available assets found for the selected tag and date range');
  }

  async checkAvailabilityByTag({ tagId }: { tagId: number }) {
  // Step 1: Get all asset IDs for this tag
  const assets = await this.db
    .select({ id: schema.Asset.id })
    .from(schema.Asset)
    .innerJoin(schema.AssetHasTags, eq(schema.Asset.id, schema.AssetHasTags.assetId))
    .where(eq(schema.AssetHasTags.tagId, BigInt(tagId)));

  const assetIds = assets.map((a) => a.id);
  const totalAssets = assetIds.length;

  if (!totalAssets) return [];

  // Step 2: Get all bookings for these assets
  const bookings = await this.db
    .select({
      startDate: schema.Booking.startDate,
      endDate: schema.Booking.endDate,
    })
    .from(schema.Booking)
    .where(inArray(schema.Booking.assetId, assetIds));

  if (!bookings.length) return [];

  // Step 3: Map bookings to individual dates and count frequency
  const dateMap = new Map<string, number>(); // key: YYYY-MM-DD, value: count of booked assets

  for (const booking of bookings) {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().slice(0, 10);
      dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
    }
  }

  // Step 4: Find fully booked dates
  const fullyBookedDates = [...dateMap.entries()]
    .filter(([_, count]) => count >= totalAssets)
    .map(([date]) => date)
    .sort();

  if (!fullyBookedDates.length) return [];

  // Step 5: Group consecutive dates into ranges
  const ranges: { from: string; to: string }[] = [];

  let rangeStart = fullyBookedDates[0];
  let prev = new Date(rangeStart);

  for (let i = 1; i < fullyBookedDates.length; i++) {
    const current = new Date(fullyBookedDates[i]);
    const prevPlusOne = new Date(prev);
    prevPlusOne.setDate(prevPlusOne.getDate() + 1);

    if (current.toISOString().slice(0, 10) !== prevPlusOne.toISOString().slice(0, 10)) {
      // Range ends
      ranges.push({ from: rangeStart, to: prev.toISOString().slice(0, 10) });
      rangeStart = fullyBookedDates[i];
    }

    prev = current;
  }

  // Push the final range
  ranges.push({ from: rangeStart, to: prev.toISOString().slice(0, 10) });

  return ranges;
}


}
