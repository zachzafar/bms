import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, inArray, lte, or } from 'drizzle-orm';
import { ExtendedSelectBooking } from '@repo/api-contract';
import { SlotService } from '../slot/slot.service';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { EmailEvent } from 'src/email/events';
import { randomBytes } from 'crypto';

// --- top of file or bottom (outside the class) ---
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
export class BookingService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private readonly slotService: SlotService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async createBooking(booking: schema.InsertBooking, customerIds: number[]): Promise<string | void> {
    const startDate = booking.startDate;
    const endDate = booking.endDate;

    const utcStart = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
    const utcEnd = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);

    if (!customerIds.length) {
      throw new ConflictException('No customers selected');
    }

    const customers = await this.db.query.Customer.findMany({
      where: (customer, { inArray }) => inArray(customer.id, customerIds),
    });

    if (!customers.length) {
      throw new ConflictException('No customers found');
    }

    const available = await this.slotService.checkSlotsAvailability(booking.assetId, startDate, endDate);
    if (!available) {
      throw new ConflictException('One or more slots are unavailable or already booked');
    }

    try {
      let bookingId: string = '';

      await this.db.transaction(async (tx) => {
        // Calculate total price for the slot range
        const totalPrice = await this.slotService.getTotalPriceForSlots(booking.assetId, startDate, endDate);

        // Insert booking with Date objects
        const [{ id }] = await tx.insert(schema.Booking).values({
          ...booking,
          startDate: utcStart, // ✅ real Date object, UTC normalized
          endDate: utcEnd,
          totalPrice: totalPrice.toString(),
        }).$returningId();

        bookingId = id;

        // Book slots by date (status and bookingId)
        await tx.update(schema.Slot)
          .set({ status: 'booked', bookingId })
          .where(
            and(
              eq(schema.Slot.assetId, booking.assetId),
              eq(schema.Slot.status, 'available'),
              gte(schema.Slot.date, startDate),
              lte(schema.Slot.date, endDate),
            )
          )
          .execute();

        // Associate customers with booking
        await tx.insert(schema.UserHasBookings).values(
          customers.map((customer) => ({ bookingId, userId: customer.userId }))
        );

        const updateBookingToken = `uptk_${randomBytes(32).toString('hex')}`

        await tx.insert(schema.BookingUpdateToken).values({
          bookingId: bookingId,
          customerId: customers[0].id,
          token: updateBookingToken,
          expiresAt: startDate
        })

      });

      this.eventEmitter.emit('create-booking', bookingId)

      return bookingId;
    } catch (e) {
      throw new ConflictException('Error occurred while creating booking: ' + e);
    }
  }

  @OnEvent('create-booking')
  async sendBookingConfirmation(bookingId: string) {
    try {
      // Fetch booking details with all related data
      const bookingData = await this.db
        .select()
        .from(schema.Booking)
        .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
        .innerJoin(schema.UserHasBookings, eq(schema.UserHasBookings.bookingId, schema.Booking.id))
        .innerJoin(schema.User, eq(schema.UserHasBookings.userId, schema.User.id))
        .innerJoin(schema.Customer, eq(schema.Customer.userId, schema.User.id))
        .innerJoin(schema.BookingUpdateToken, eq(schema.Booking.id, schema.BookingUpdateToken.bookingId))
        .where(eq(schema.Booking.id, bookingId))
        .execute()
        .then((rows) => rows[0]);

      if (!bookingData) {
        throw new NotFoundException('Booking not found');
      }

      const { booking, assets: asset, users: customer, customer_details, booking_upate_token } = bookingData;

      // Get tenant admins
      const tenantAdmins = await this.db
        .select({
          email: schema.User.email,
          name: schema.User.name,
        })
        .from(schema.TenantHasUsers)
        .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
        .where(
          and(
            eq(schema.TenantHasUsers.tenantId, asset.tenantId),
            eq(schema.TenantHasUsers.isAdmin, true)
          )
        )
        .execute();

      // Format dates for display
      const startDate = new Date(booking.startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const endDate = new Date(booking.endDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Create email HTML template for customer
      const updateUrl = `${process.env.FRONTEND_URL}/booking/update-booking-by-token/${booking_upate_token.token}`;
      // const cancelUrl = `${process.env.FRONTEND_URL}/booking/cancel-booking-by-token/${booking_upate_token.token}`;

      const customerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .actions { text-align: center; margin: 25px 0; }
            .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px; }
            .btn-primary { background-color: #2196F3; color: white; }
            .btn-danger { background-color: #f44336; color: white; }
            .btn:hover { opacity: 0.9; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmation</h1>
            </div>
            <div class="content">
              <p>Dear ${customer.name},</p>
              <p>Your booking has been confirmed! Here are the details:</p>

              <div class="booking-details">
                <div class="detail-row">
                  <span class="label">Booking ID:</span> ${booking.id}
                </div>
                <div class="detail-row">
                  <span class="label">Asset:</span> ${asset.name}
                </div>
                <div class="detail-row">
                  <span class="label">Start Date:</span> ${startDate}
                </div>
                <div class="detail-row">
                  <span class="label">End Date:</span> ${endDate}
                </div>
                <div class="detail-row">
                  <span class="label">Total Price:</span> $${booking.totalPrice}
                </div>
              </div>

              <div class="actions">
                <a href="${updateUrl}" class="btn btn-primary">Update Booking</a>
              </div>

              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Thank you for your booking!</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create email HTML template for tenant admin
      const adminEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Booking Received</h1>
            </div>
            <div class="content">
              <p>A new booking has been created in your system.</p>

              <div class="booking-details">
                <div class="detail-row">
                  <span class="label">Booking ID:</span> ${booking.id}
                </div>
                <div class="detail-row">
                  <span class="label">Customer:</span> ${customer.name} (${customer.email})
                </div>
                <div class="detail-row">
                  <span class="label">Asset:</span> ${asset.name}
                </div>
                <div class="detail-row">
                  <span class="label">Start Date:</span> ${startDate}
                </div>
                <div class="detail-row">
                  <span class="label">End Date:</span> ${endDate}
                </div>
                <div class="detail-row">
                  <span class="label">Total Price:</span> $${booking.totalPrice}
                </div>
              </div>

              <p>Please log in to your admin panel to view more details.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from your booking system.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email to customer
      this.eventEmitter.emit(
        'send-email',
        new EmailEvent(
          customer.email,
          'Booking Confirmation - Your reservation is confirmed!',
          customerEmailContent
        )
      );

      // Send emails to all tenant admins
      for (const admin of tenantAdmins) {
        this.eventEmitter.emit(
          'send-email',
          new EmailEvent(
            admin.email,
            `New Booking: ${asset.name} - ${customer.name}`,
            adminEmailContent
          )
        );
      }
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      // Don't throw - we don't want to fail the booking if email fails
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
      .then((rows) => rows[0]);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      ...booking.booking,
      startDate: booking.booking.startDate,
      endDate: booking.booking.endDate,
      user: booking.users,
      customer: booking.customer_details,
      asset: booking.assets,
    };
  }

  async getBookingsByAssetId(assetId: string, period?: { startDate: Date; endDate: Date }) {
    return this.db.query.Booking.findMany({
      where: (booking, { eq, and, gte, lte, or }) =>
        period
          ? and(
            eq(booking.assetId, assetId),
            or(gte(booking.startDate, period.startDate), lte(booking.endDate, period.endDate))
          )
          : eq(booking.assetId, assetId),
    });
  }

  async getBookings(tenantId?: string, assetId?: string) {
    const filters: any[] = [];

    if (tenantId) {
      filters.push(eq(schema.Asset.tenantId, tenantId));
    }

    if (assetId) {
      filters.push(eq(schema.Booking.assetId, assetId));
    }

    const bookings = await this.db
      .select()
      .from(schema.UserHasBookings)
      .innerJoin(schema.User, eq(schema.UserHasBookings.userId, schema.User.id))
      .innerJoin(schema.Booking, eq(schema.UserHasBookings.bookingId, schema.Booking.id))
      .innerJoin(
        schema.Asset,
        eq(schema.Booking.assetId, schema.Asset.id) // always required join
      )
      .where(filters.length ? and(...filters) : undefined) // <-- optional filters moved to .where()
      .innerJoin(schema.Customer, eq(schema.Customer.userId, schema.User.id))
      .execute();

    return bookings.map((booking) => ({
      ...booking.booking,
      startDate: booking.booking.startDate,
      endDate: booking.booking.endDate,
      customer: booking.customer_details,
      asset: booking.assets,
      user: booking.users,
    }));
  }



  async updateBooking(updateData: schema.UpdateBooking) {
    const startDate = new Date(updateData.startDate);
    const endDate = new Date(updateData.endDate);

    const availabilityStatus = await this.slotService.checkSlotsAvailabilityExcludingBooking(
      updateData.assetId,
      { startDate, endDate },
      updateData.id
    );

    if (availabilityStatus !== 'Available') {
      throw new ConflictException('One or more slots are unavailable or already booked');
    }

    const totalPrice = await this.slotService.getTotalPriceForSlots(updateData.assetId, startDate, endDate);

    try {
      await this.db.transaction(async (tx) => {
        // Update booking dates and price
        await tx.update(schema.Booking)
          .set({
            startDate,
            endDate,
            totalPrice: totalPrice.toString(),
          })
          .where(eq(schema.Booking.id, updateData.id))
          .execute();

        // Release existing slots
        await tx.update(schema.Slot)
          .set({
            status: 'available',
            bookingId: null,
          })
          .where(eq(schema.Slot.bookingId, updateData.id))
          .execute();

        // Book new slots
        await tx.update(schema.Slot)
          .set({ status: 'booked', bookingId: updateData.id })
          .where(
            and(
              eq(schema.Slot.assetId, updateData.assetId),
              eq(schema.Slot.status, 'available'),
              gte(schema.Slot.date, startDate),
              lte(schema.Slot.date, endDate)
            )
          )
          .execute();
      });
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
    await this.db.delete(schema.UserHasBookings).where(eq(schema.UserHasBookings.bookingId, bookingId)).execute();

    // Release slots associated with this booking
    await this.db.update(schema.Slot)
      .set({ status: 'available', bookingId: null })
      .where(eq(schema.Slot.bookingId, bookingId))
      .execute();

    // Delete the booking
    await this.db.delete(schema.Booking).where(eq(schema.Booking.id, bookingId)).execute();
  }

  async validateUpdateToken(token: string, bookingId: string) {
    const row = await this.db.query.BookingUpdateToken.findFirst({
      where: (but, { eq, and }) => and(eq(but.token, token), eq(but.bookingId, bookingId))
    })

    if (!row) {
      return false
    }
    if (row.expiresAt < new Date()) {
      return false
    }

    return true
  }


  // Check availability excluding a specific booking

  async createBookingByTag(
    data: {
      tagId: number;
      startDate: Date;
      endDate: Date;
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
        eq(schema.AssetHasTags.tagId, tagId),
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
      .where(eq(schema.AssetHasTags.tagId, (tagId)));

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
    const dateMap = new Map<Date, number>(); // key: YYYY-MM-DD, value: count of booked assets

    for (const booking of bookings) {
      const start = booking.startDate;
      const end = booking.endDate;
      for (
        let d = start;
        d <= end;
        d.setDate(d.getDate() + 1)
      ) {
        dateMap.set(d, (dateMap.get(d) ?? 0) + 1);
      }
    }

    // Step 4: Find fully booked dates
    const fullyBookedDates = [...dateMap.entries()]
      .filter(([_, count]) => count >= totalAssets)
      .map(([date]) => date)
      .sort();

    if (!fullyBookedDates.length) return [];

    // Step 5: Group consecutive dates into ranges
    const ranges: { from: Date; to: Date }[] = [];

    let rangeStart = fullyBookedDates[0];
    let prev = new Date(rangeStart);

    for (let i = 1; i < fullyBookedDates.length; i++) {
      const current = new Date(fullyBookedDates[i]);
      const prevPlusOne = new Date(prev);
      prevPlusOne.setDate(prevPlusOne.getDate() + 1);

      if (current.getTime() !== prevPlusOne.getTime()) {
        // Range ends
        ranges.push({ from: rangeStart, to: prev });
        rangeStart = fullyBookedDates[i];
      }

      prev = current;
    }

    // Push the final range
    ranges.push({ from: rangeStart, to: prev });

    return ranges;
  }

  // -----------------------------
  // Blocked Dates Methods
  // -----------------------------



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
        startDate: utcStart, // ✅ Always UTC
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

}
