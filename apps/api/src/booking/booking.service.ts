import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { ExtendedSelectBooking, InsertBooking } from '@repo/api-contract';
import { SlotService } from '../slot/slot.service';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { EmailEvent } from 'src/email/events';
import { randomBytes } from 'crypto';
import { Cron } from '@nestjs/schedule';

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

  async createBooking(
    booking: schema.InsertBooking,
    customerIds: number[],
    newCustomer?: { name: string; email: string; phone?: string; tenantId: string },
    formResponses?: Array<{ formFieldId: number; value: string }>
  ): Promise<string | void> {
    const startDate = booking.startDate;
    const endDate = booking.endDate;

    const utcStart = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
    const utcEnd = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);

    if (!customerIds.length && !newCustomer) {
      throw new ConflictException('No customers selected or provided');
    }

    // Check if dates are blocked (either by booking or admin block)
    const blockedDates = await this.db.query.BlockedDate.findMany({
      where: (bd, { and, eq, gte, lte, or }) =>
        and(
          eq(bd.assetId, booking.assetId),
          or(
            and(gte(bd.startDate, startDate), lte(bd.startDate, endDate)),
            and(gte(bd.endDate, startDate), lte(bd.endDate, endDate)),
            and(lte(bd.startDate, startDate), gte(bd.endDate, endDate))
          )
        ),
    });

    if (blockedDates.length > 0) {
      throw new ConflictException('One or more dates are unavailable or already booked');
    }

    try {
      let bookingId: string = '';

      await this.db.transaction(async (tx) => {
        let customerIdsToUse = [...customerIds];

        // Create new customer if provided or find existing customer by email
        if (newCustomer) {
          // Check if user with this email already exists
          const existingUser = await tx.query.User.findFirst({
            where: (user, { eq }) => eq(user.email, newCustomer.email),
          });

          let userId: string;

          if (existingUser) {
            // User exists, check if they have a customer profile for this tenant
            const existingCustomer = await tx.query.Customer.findFirst({
              where: (customer, { eq, and }) =>
                and(
                  eq(customer.userId, existingUser.id),
                  eq(customer.tenantId, newCustomer.tenantId)
                ),
            });

            if (existingCustomer) {
              // Customer profile exists for this tenant, use it
              customerIdsToUse.push(existingCustomer.id);
            } else {
              // User exists but no customer profile for this tenant, create one
              const [{ id: customerId }] = await tx.insert(schema.Customer).values({
                userId: existingUser.id,
                phone: newCustomer.phone,
                tenantId: newCustomer.tenantId,
              }).$returningId();

              customerIdsToUse.push(customerId);
            }
          } else {
            // User doesn't exist, create new user and customer
            const [{ id: newUserId }] = await tx.insert(schema.User).values({
              name: newCustomer.name,
              email: newCustomer.email,
              password: randomBytes(32).toString('hex'), // Random password for public customers
              userType: 'customer',
            }).$returningId();

            userId = newUserId;

            const [{id: tenant_has_use_id}] = await tx.insert(schema.TenantHasUsers).values({
                tenantId: newCustomer.tenantId,
                userId,
            }).$returningId();

            // Create customer details
            const [{ id: customerId }] = await tx.insert(schema.Customer).values({
              userId,
              phone: newCustomer.phone,
              tenantId: newCustomer.tenantId,
            }).$returningId();

            customerIdsToUse.push(customerId);
          }
        }

        // Fetch existing customers
        const customers = await tx.query.Customer.findMany({
          where: (customer, { inArray }) => inArray(customer.id, customerIdsToUse),
        });

        if (!customers.length) {
          throw new ConflictException('No customers found');
        }

        // Get asset to find tenantId
        const asset = await tx.query.Asset.findFirst({
          where: (a, { eq }) => eq(a.id, booking.assetId),
        });

        if (!asset) {
          throw new ConflictException('Asset not found');
        }

        // Get tenant settings to check enableAutomaticConfirmation
        const tenant = await tx.query.Tenant.findFirst({
          where: (t, { eq }) => eq(t.id, asset.tenantId),
        });

        // Determine booking status based on tenant settings
        const bookingStatus = tenant?.enableAutomaticConfirmation ? 'Confirmed' : 'Pending';

        // Calculate total price based on asset's rate
        let totalPrice = booking.totalPrice ? parseFloat(booking.totalPrice.toString()) : 0;

        // If no price provided, calculate from asset's rate
        if (!booking.totalPrice || totalPrice === 0) {
          // Get the applicable rate for this asset
          const assetRates = await tx
            .select({
              rateId: schema.AssetHasRates.rateId,
              pricePerNight: schema.Rate.pricePerNight,
              startDate: schema.Rate.startDate,
              endDate: schema.Rate.endDate,
              priority: schema.Rate.priority,
            })
            .from(schema.AssetHasRates)
            .innerJoin(schema.Rate, eq(schema.AssetHasRates.rateId, schema.Rate.id))
            .where(eq(schema.AssetHasRates.assetId, booking.assetId));

          // Find the best matching rate based on booking dates and priority
          // Filter rates that overlap with the booking period, then sort by priority
          const bookingStartDate = new Date(utcStart);
          const bookingEndDate = new Date(utcEnd);

          const applicableRates = assetRates.filter((rate) => {
            if (!rate.startDate || !rate.endDate) return false;
            const rateStart = new Date(rate.startDate);
            const rateEnd = new Date(rate.endDate);
            // Rate is applicable if it overlaps with the booking period
            return rateStart <= bookingEndDate && rateEnd >= bookingStartDate;
          });

          // Sort by priority (lower = higher priority) and get the best rate
          applicableRates.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
          const bestRate = applicableRates[0];

          if (bestRate && bestRate.pricePerNight) {
            // Calculate number of nights
            const timeDiff = bookingEndDate.getTime() - bookingStartDate.getTime();
            const numberOfNights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            const pricePerNight = parseFloat(bestRate.pricePerNight.toString());
            totalPrice = numberOfNights * pricePerNight;
          }
        }

        // Insert booking with Date objects
        const [{ id }] = await tx.insert(schema.Booking).values({
          ...booking,
          userId: customers[0].userId, // Set userId directly on booking
          startDate: utcStart, // ✅ real Date object, UTC normalized
          endDate: utcEnd,
          status: bookingStatus,
          totalPrice: totalPrice.toString(),
        }).$returningId();

        bookingId = id;

        // Create blocked date entry for this booking
        await tx.insert(schema.BlockedDate).values({
          tenantId: asset.tenantId,
          assetId: booking.assetId,
          startDate: utcStart,
          endDate: utcEnd,
          title: `Booking ${bookingId.slice(0, 8)}`,
          reason: 'Customer booking',
          bookingId: bookingId,
        });

        const updateBookingToken = `uptk_${randomBytes(32).toString('hex')}`

        await tx.insert(schema.BookingUpdateToken).values({
          bookingId: bookingId,
          customerId: customers[0].id,
          token: updateBookingToken,
          expiresAt: startDate
        })

        // Save form responses if provided
        if (formResponses && formResponses.length > 0) {
          await tx.insert(schema.BookingFormFieldValue).values(
            formResponses.map((response) => ({
              bookingId: bookingId,
              formFieldId: response.formFieldId,
              value: response.value
            }))
          );
        }

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
        .innerJoin(schema.User, eq(schema.Booking.userId, schema.User.id))
        .innerJoin(schema.Customer,
          and(
            eq(schema.Customer.userId, schema.User.id),
            eq(schema.Customer.tenantId, schema.Asset.tenantId)
          )
        )
        .innerJoin(schema.BookingUpdateToken, eq(schema.Booking.id, schema.BookingUpdateToken.bookingId))
        .where(eq(schema.Booking.id, bookingId))
        .execute()
        .then((rows) => rows[0]);

      if (!bookingData) {
        throw new NotFoundException('Booking not found');
      }

      const { booking, assets: asset, users: customer, customer_details, booking_upate_token } = bookingData;

      // Get tenant details including subdomain
      const tenant = await this.db.query.Tenant.findFirst({
        where: (t, { eq }) => eq(t.id, asset.tenantId),
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

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

      const updateUrl = `${process.env.FRONTEND_URL}/customer/${tenant.subdomain}/booking/${booking.id}/${booking_upate_token.token}`;
      const isPending = booking.status === 'Pending';
      const headerColor = isPending ? '#FF9800' : '#4CAF50';
      const title = isPending ? 'Booking Received - Awaiting Confirmation' : 'Booking Confirmation';
      const message = isPending
        ? 'Your booking has been received and is awaiting confirmation from our team. Here are the details:'
        : 'Your booking has been confirmed! Here are the details:';

      const customerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${headerColor}; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid ${headerColor}; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .status-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
            .status-pending { background-color: #FFF3E0; color: #F57C00; }
            .status-confirmed { background-color: #E8F5E9; color: #2E7D32; }
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
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>Dear ${customer.name},</p>
              <p>${message}</p>

              <div class="booking-details">
                <div class="detail-row">
                  <span class="label">Booking ID:</span> ${booking.id}
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span> <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
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
                <a href="${updateUrl}" class="btn btn-primary">View & Update Booking</a>
              </div>

              ${isPending ? '<p><strong>Note:</strong> Your booking is pending and will be confirmed by our team shortly. You will receive another email once it has been confirmed.</p>' : ''}
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
      const adminTitle = isPending ? 'New Booking - Requires Confirmation' : 'New Booking Received';
      const adminMessage = isPending
        ? 'A new booking has been created and is awaiting your confirmation.'
        : 'A new booking has been automatically confirmed in your system.';

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
            .status-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
            .status-pending { background-color: #FFF3E0; color: #F57C00; }
            .status-confirmed { background-color: #E8F5E9; color: #2E7D32; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${adminTitle}</h1>
            </div>
            <div class="content">
              <p>${adminMessage}</p>

              <div class="booking-details">
                <div class="detail-row">
                  <span class="label">Booking ID:</span> ${booking.id}
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span> <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
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

              ${isPending ? '<p><strong>Action Required:</strong> Please log in to your admin panel to confirm or cancel this booking.</p>' : ''}
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
      const customerSubject = isPending
        ? 'Booking Received - Awaiting Confirmation'
        : 'Booking Confirmation - Your reservation is confirmed!';

      this.eventEmitter.emit(
        'send-email',
        new EmailEvent(
          customer.email,
          customerSubject,
          customerEmailContent
        )
      );

      // Send emails to all tenant admins
      const adminSubject = isPending
        ? `New Booking - Requires Confirmation: ${asset.name} - ${customer.name}`
        : `New Booking: ${asset.name} - ${customer.name}`;

      for (const admin of tenantAdmins) {
        this.eventEmitter.emit(
          'send-email',
          new EmailEvent(
            admin.email,
            adminSubject,
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
      .from(schema.Booking)
      .innerJoin(schema.User, eq(schema.Booking.userId, schema.User.id))
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.Customer,
        and(
          eq(schema.Customer.userId, schema.User.id),
          eq(schema.Customer.tenantId, schema.Asset.tenantId)
        )
      )
      .where(
        and(
          eq(schema.Booking.id, bookingId),
          isNull(schema.Booking.deletedAt)
        )
      )
      .execute()
      .then((rows) => rows[0]);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Fetch form field values for this booking
    const formFieldValues = await this.db
      .select({
        id: schema.BookingFormFieldValue.id,
        formFieldId: schema.BookingFormFieldValue.formFieldId,
        value: schema.BookingFormFieldValue.value,
        fieldName: schema.BookingFormField.name,
        fieldType: schema.BookingFormField.type,
      })
      .from(schema.BookingFormFieldValue)
      .innerJoin(
        schema.BookingFormField,
        eq(schema.BookingFormFieldValue.formFieldId, schema.BookingFormField.id)
      )
      .where(eq(schema.BookingFormFieldValue.bookingId, bookingId))
      .execute();

    return {
      ...booking.booking,
      startDate: booking.booking.startDate,
      endDate: booking.booking.endDate,
      user: booking.users,
      customer: booking.customer_details,
      asset: booking.assets,
      formResponses: formFieldValues,
    };
  }

  async getBookingsByAssetId(assetId: string, period?: { startDate: Date; endDate: Date }, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions: any[] = [eq(schema.Booking.assetId, assetId)];
    if (period) {
      conditions.push(
        or(
          gte(schema.Booking.startDate, period.startDate),
          lte(schema.Booking.endDate, period.endDate)
        )
      );
    }

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Booking)
      .where(and(...conditions))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated bookings
    const bookings = await this.db.query.Booking.findMany({
      where: (booking, { eq, and, gte, lte, or }) =>
        period
          ? and(
            eq(booking.assetId, assetId),
            or(gte(booking.startDate, period.startDate), lte(booking.endDate, period.endDate))
          )
          : eq(booking.assetId, assetId),
      limit: pageSize,
      offset: offset,
    });

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: bookings,
      pagination: paginationData,
    };
  }

  async getBookings(tenantId?: string, assetId?: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;
    const filters: any[] = [];

    if (assetId) {
      filters.push(eq(schema.Booking.assetId, assetId));
    }

    if (tenantId) {
      filters.push(eq(schema.Asset.tenantId, tenantId));
    }

    // Get total count (exclude soft-deleted)
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Booking)
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .where(
        filters.length
          ? and(...filters, isNull(schema.Booking.deletedAt))
          : isNull(schema.Booking.deletedAt)
      )
      .execute();

    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated bookings with all related data (exclude soft-deleted)
    const bookings = await this.db
      .select()
      .from(schema.Booking)
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.User, eq(schema.Booking.userId, schema.User.id))
      .innerJoin(schema.Customer,
        and(
          eq(schema.Customer.userId, schema.User.id),
          eq(schema.Customer.tenantId, schema.Asset.tenantId)
        )
      )
      .where(
        filters.length
          ? and(...filters, isNull(schema.Booking.deletedAt))
          : isNull(schema.Booking.deletedAt)
      )
      .limit(pageSize)
      .offset(offset)
      .execute();

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    const bookingData = bookings.map((row) => ({
      ...row.booking,
      asset: row.assets,
      user: row.users,
      customer: row.customer_details,
    }));

    return {
      data: bookingData,
      pagination: paginationData,
    };
  }



  async updateBooking(updateData: schema.UpdateBooking) {
    const startDate = new Date(updateData.startDate);
    const endDate = new Date(updateData.endDate);

    // Check if dates are blocked (excluding the current booking's block)
    const blockedDates = await this.db.query.BlockedDate.findMany({
      where: (bd, { and, eq, gte, lte, or, ne, isNull }) =>
        and(
          eq(bd.assetId, updateData.assetId),
          or(
            and(gte(bd.startDate, startDate), lte(bd.startDate, endDate)),
            and(gte(bd.endDate, startDate), lte(bd.endDate, endDate)),
            and(lte(bd.startDate, startDate), gte(bd.endDate, endDate))
          ),
          // Exclude the current booking's blocked date entry
          or(
            isNull(bd.bookingId),
            ne(bd.bookingId, updateData.id)
          )
        ),
    });

    if (blockedDates.length > 0) {
      throw new ConflictException('One or more dates are unavailable or already booked');
    }

    try {
      await this.db.transaction(async (tx) => {
        // Get asset to find tenantId
        const asset = await tx.query.Asset.findFirst({
          where: (a, { eq }) => eq(a.id, updateData.assetId),
        });

        if (!asset) {
          throw new ConflictException('Asset not found');
        }

        // Calculate total price based on asset's rate
        let totalPrice = updateData.totalPrice ? parseFloat(updateData.totalPrice.toString()) : 0;

        // If no price provided or price is 0, calculate from asset's rate
        if (!updateData.totalPrice || totalPrice === 0) {
          // Get the applicable rate for this asset
          const assetRates = await tx
            .select({
              rateId: schema.AssetHasRates.rateId,
              pricePerNight: schema.Rate.pricePerNight,
              startDate: schema.Rate.startDate,
              endDate: schema.Rate.endDate,
              priority: schema.Rate.priority,
            })
            .from(schema.AssetHasRates)
            .innerJoin(schema.Rate, eq(schema.AssetHasRates.rateId, schema.Rate.id))
            .where(eq(schema.AssetHasRates.assetId, updateData.assetId));

          // Find the best matching rate based on booking dates and priority
          const bookingStartDate = new Date(startDate);
          const bookingEndDate = new Date(endDate);

          const applicableRates = assetRates.filter((rate) => {
            if (!rate.startDate || !rate.endDate) return false;
            const rateStart = new Date(rate.startDate);
            const rateEnd = new Date(rate.endDate);
            // Rate is applicable if it overlaps with the booking period
            return rateStart <= bookingEndDate && rateEnd >= bookingStartDate;
          });

          // Sort by priority (lower = higher priority) and get the best rate
          applicableRates.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
          const bestRate = applicableRates[0];

          if (bestRate && bestRate.pricePerNight) {
            // Calculate number of nights
            const timeDiff = bookingEndDate.getTime() - bookingStartDate.getTime();
            const numberOfNights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            const pricePerNight = parseFloat(bestRate.pricePerNight.toString());
            totalPrice = numberOfNights * pricePerNight;
          }
        }

        // Update booking dates and price
        await tx.update(schema.Booking)
          .set({
            startDate,
            endDate,
            totalPrice: totalPrice.toString(),
          })
          .where(eq(schema.Booking.id, updateData.id))
          .execute();

        // Update the booking update token expiration date
        await tx.update(schema.BookingUpdateToken)
          .set({
            expiresAt: startDate
          })
          .where(eq(schema.BookingUpdateToken.bookingId, updateData.id))
          .execute();

        // Delete existing blocked date entry for this booking
        await tx.delete(schema.BlockedDate)
          .where(eq(schema.BlockedDate.bookingId, updateData.id))
          .execute();

        // Create new blocked date entry with updated dates
        await tx.insert(schema.BlockedDate).values({
          tenantId: asset.tenantId,
          assetId: updateData.assetId,
          startDate,
          endDate,
          title: `Booking ${updateData.id.slice(0, 8)}`,
          reason: 'Customer booking',
          bookingId: updateData.id,
        });
      });
    } catch (e) {
      throw new ConflictException('Error occurred while updating booking:' + e);
    }
  }

  async updateBookingStatus(bookingId: string, status: 'Pending' | 'Confirmed' | 'Cancelled') {
    const existingBooking = await this.getBooking(bookingId);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    // Update the booking status
    await this.db.update(schema.Booking)
      .set({ status })
      .where(eq(schema.Booking.id, bookingId))
      .execute();

    // Send email notifications for Confirmed or Cancelled status
    if (status === 'Confirmed' || status === 'Cancelled') {
      try {
        // Get full booking details with relations
        const bookingDetails = await this.db
          .select({
            booking: schema.Booking,
            asset: schema.Asset,
            user: schema.User,
            customer: schema.Customer,
          })
          .from(schema.Booking)
          .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
          .innerJoin(schema.User, eq(schema.Booking.userId, schema.User.id))
          .innerJoin(schema.Customer,
            and(
              eq(schema.Customer.userId, schema.User.id),
              eq(schema.Customer.tenantId, schema.Asset.tenantId)
            )
          )
          .where(eq(schema.Booking.id, bookingId))
          .execute()
          .then((rows) => rows[0]);

        if (bookingDetails) {
          const { booking, asset, user } = bookingDetails;

          // Get tenant admin users
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

          // Format dates
          const formattedStartDate = booking.startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          const formattedEndDate = booking.endDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          if (status === 'Confirmed') {
            // Send confirmation emails
            for (const admin of tenantAdmins) {
              const tenantEmailContent = this.generateStatusUpdateEmailForTenant({
                tenantName: admin.name,
                bookingId: booking.id,
                assetName: asset.name,
                customerName: user.name,
                formattedStartDate,
                formattedEndDate,
                status: 'Confirmed'
              });

              this.eventEmitter.emit(
                'send-email',
                new EmailEvent(
                  admin.email,
                  `Booking Confirmed: ${asset.name} - ${user.name}`,
                  tenantEmailContent
                )
              );
            }

            // Send email to customer
            const customerEmailContent = this.generateStatusUpdateEmailForCustomer({
              customerName: user.name,
              bookingId: booking.id,
              assetName: asset.name,
              formattedStartDate,
              formattedEndDate,
              status: 'Confirmed'
            });

            this.eventEmitter.emit(
              'send-email',
              new EmailEvent(
                user.email,
                `Booking Confirmed: ${asset.name}`,
                customerEmailContent
              )
            );
          } else if (status === 'Cancelled') {
            // Send cancellation emails
            for (const admin of tenantAdmins) {
              const tenantEmailContent = this.generateStatusUpdateEmailForTenant({
                tenantName: admin.name,
                bookingId: booking.id,
                assetName: asset.name,
                customerName: user.name,
                formattedStartDate,
                formattedEndDate,
                status: 'Cancelled'
              });

              this.eventEmitter.emit(
                'send-email',
                new EmailEvent(
                  admin.email,
                  `Booking Cancelled: ${asset.name} - ${user.name}`,
                  tenantEmailContent
                )
              );
            }

            // Send email to customer
            const customerEmailContent = this.generateStatusUpdateEmailForCustomer({
              customerName: user.name,
              bookingId: booking.id,
              assetName: asset.name,
              formattedStartDate,
              formattedEndDate,
              status: 'Cancelled'
            });

            this.eventEmitter.emit(
              'send-email',
              new EmailEvent(
                user.email,
                `Booking Cancelled: ${asset.name}`,
                customerEmailContent
              )
            );
          }
        }
      } catch (error) {
        console.error('Error sending booking status update emails:', error);
        // Don't throw - we don't want to fail the status update if email fails
      }
    }

    return { message: `Booking status updated to ${status}` };
  }

  async deleteBooking(bookingId: string) {
    const existingBooking = await this.db.query.Booking.findFirst({
      where: (b, { eq, and, isNull }) => and(
        eq(b.id, bookingId),
        isNull(b.deletedAt)
      ),
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found or already deleted');
    }

    // Soft delete: set deletedAt timestamp
    await this.db.update(schema.Booking)
      .set({ deletedAt: new Date() })
      .where(eq(schema.Booking.id, bookingId))
      .execute();

    // Also soft delete the blocked date entry if it exists
    await this.db.update(schema.BlockedDate)
      .set({ updatedAt: new Date() })
      .where(eq(schema.BlockedDate.bookingId, bookingId))
      .execute();
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
      // Check if dates are blocked (either by booking or admin block)
    const blockedDates = await this.db.query.BlockedDate.findMany({
      where: (bd, { and, eq, gte, lte, or }) =>
        and(
          eq(bd.assetId, asset.id),
          or(
            and(gte(bd.startDate, startDate), lte(bd.startDate, endDate)),
            and(gte(bd.endDate, startDate), lte(bd.endDate, endDate)),
            and(lte(bd.startDate, startDate), gte(bd.endDate, endDate))
          )
        ),
    });

    if (blockedDates.length > 0) {
      continue
    }


        // Step 3: Get userId from first customer
        const firstCustomer = await this.db.query.Customer.findFirst({
          where: (c, { eq }) => eq(c.id, customerIds[0]),
        });

        if (!firstCustomer) {
          throw new ConflictException('Customer not found');
        }

        // Step 4: Use existing booking logic
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

    throw new ConflictException('No available assets found for the selected tag and date range');
  }

  async customerCreateBookingByTag(
    data: {
      tagId: number;
      startDate: Date;
      endDate: Date;
      customer: { name: string; email: string; phone?: string };
      formResponses?: Array<{ formFieldId: number; value: string }>;
    },
    tenantId: string
  ): Promise<{ message: string; assetName: string }> {
    const { tagId, startDate, endDate, customer, formResponses } = data;

    // Step 1: Find all assets with this tag + tenant match
    const assets = await this.db
      .select({ id: schema.Asset.id, name: schema.Asset.name })
      .from(schema.Asset)
      .innerJoin(schema.AssetHasTags, eq(schema.Asset.id, schema.AssetHasTags.assetId))
      .where(and(
        eq(schema.AssetHasTags.tagId, tagId),
        eq(schema.Asset.tenantId, tenantId)
      ));

    if (assets.length === 0) {
      throw new NotFoundException('No assets found with the selected category');
    }

    // Step 2: Loop through assets to find first available one
    for (const asset of assets) {
      // Check if dates are blocked (either by booking or admin block)
      const blockedDates = await this.db.query.BlockedDate.findMany({
        where: (bd, { and, eq, gte, lte, or }) =>
          and(
            eq(bd.assetId, asset.id),
            or(
              and(gte(bd.startDate, startDate), lte(bd.startDate, endDate)),
              and(gte(bd.endDate, startDate), lte(bd.endDate, endDate)),
              and(lte(bd.startDate, startDate), gte(bd.endDate, endDate))
            )
          ),
      });

      if (blockedDates.length > 0) {
        continue;
      }

      // Found an available asset - create booking with new customer
      await this.createBooking(
        {
          assetId: asset.id,
          startDate,
          endDate,
        },
        [], // No existing customer IDs
        { ...customer, tenantId }, // New customer info
        formResponses
      );

      return {
        message: 'Booking created successfully',
        assetName: asset.name,
      };
    }

    throw new ConflictException('No available assets found for the selected category and date range');
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

  // Booking reminder methods
  @Cron('0 8 * * *') // Runs at 8 AM every day
  async sendBookingReminders() {
    // Calculate time window: 24 hours from now (±1 hour for flexibility)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(now.getHours() + 24);

    const windowStart = new Date(tomorrow);
    windowStart.setHours(tomorrow.getHours() - 1);

    const windowEnd = new Date(tomorrow);
    windowEnd.setHours(tomorrow.getHours() + 1);

    try {
      // Query bookings starting in ~24 hours using raw SQL joins
      const upcomingBookings = await this.db
        .select({
          booking: schema.Booking,
          asset: schema.Asset,
          user: schema.User,
          customer: schema.Customer,
        })
        .from(schema.Booking)
        .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
        .innerJoin(schema.User, eq(schema.Booking.userId, schema.User.id))
        .innerJoin(schema.Customer,
          and(
            eq(schema.Customer.userId, schema.User.id),
            eq(schema.Customer.tenantId, schema.Asset.tenantId)
          )
        )
        .where(
          and(
            gte(schema.Booking.startDate, windowStart),
            lte(schema.Booking.startDate, windowEnd),
            eq(schema.Booking.status, 'Confirmed')
          )
        )
        .execute();

      console.log(`Found ${upcomingBookings.length} bookings starting in 24 hours`);

      // Send emails for each booking
      for (const row of upcomingBookings) {
        const { booking, asset, user } = row;

        // Get tenant admin users
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

        // Format dates
        const formattedStartDate = booking.startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const formattedEndDate = booking.endDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Send email to each tenant admin
        for (const admin of tenantAdmins) {
          const tenantEmailContent = this.generateTenantReminderEmail({
            tenantName: admin.name,
            bookingId: booking.id,
            assetName: asset.name,
            customerName: user.name,
            formattedStartDate,
            formattedEndDate
          });

          this.eventEmitter.emit(
            'send-email',
            new EmailEvent(
              admin.email,
              `Booking Reminder: ${asset.name} - Starting Tomorrow`,
              tenantEmailContent
            )
          );
        }

        // Send email to customer
        const customerEmailContent = this.generateCustomerReminderEmail({
          customerName: user.name,
          bookingId: booking.id,
          assetName: asset.name,
          formattedStartDate,
          formattedEndDate
        });

        this.eventEmitter.emit(
          'send-email',
          new EmailEvent(
            user.email,
            `Reminder: Your ${asset.name} Booking Starts Tomorrow`,
            customerEmailContent
          )
        );

        console.log(`Sent reminders for booking ${booking.id}`);
      }

      console.log('Booking reminder job completed successfully');
    } catch (error) {
      console.error('Error in booking reminder job:', error);
    }
  }

  private generateTenantReminderEmail(data: {
    tenantName: string;
    bookingId: string;
    assetName: string;
    customerName: string;
    formattedStartDate: string;
    formattedEndDate: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Reminder</h1>
          </div>
          <div class="content">
            <p>Hello ${data.tenantName},</p>
            <p>This is a reminder that you have an upcoming booking starting tomorrow.</p>

            <div class="booking-details">
              <h2 style="color: #2563eb; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${data.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${data.assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer:</span> ${data.customerName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span> ${data.formattedStartDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span> ${data.formattedEndDate}
              </div>
            </div>

            <p>Please ensure that <strong>${data.assetName}</strong> is ready for the customer.</p>

            <div class="footer">
              <p>This is an automated reminder from your booking management system.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateCustomerReminderEmail(data: {
    customerName: string;
    bookingId: string;
    assetName: string;
    formattedStartDate: string;
    formattedEndDate: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
          .highlight { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Booking is Tomorrow!</h1>
          </div>
          <div class="content">
            <p>Hello ${data.customerName},</p>
            <p>This is a friendly reminder that your booking starts tomorrow.</p>

            <div class="booking-details">
              <h2 style="color: #2563eb; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${data.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${data.assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span> ${data.formattedStartDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span> ${data.formattedEndDate}
              </div>
            </div>

            <div class="highlight">
              <strong>Important:</strong> Please be prepared to pick up <strong>${data.assetName}</strong> on ${data.formattedStartDate}.
            </div>

            <p>If you have any questions or need to make changes to your booking, please contact us as soon as possible.</p>

            <p>We look forward to serving you!</p>

            <div class="footer">
              <p>This is an automated reminder from your booking management system.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateStatusUpdateEmailForTenant(data: {
    tenantName: string;
    bookingId: string;
    assetName: string;
    customerName: string;
    formattedStartDate: string;
    formattedEndDate: string;
    status: 'Confirmed' | 'Cancelled';
  }): string {
    const isConfirmed = data.status === 'Confirmed';
    const headerColor = isConfirmed ? '#2563eb' : '#dc2626';
    const headerText = isConfirmed ? 'Booking Confirmed' : 'Booking Cancelled';
    const statusBgColor = isConfirmed ? '#dbeafe' : '#fee2e2';
    const statusTextColor = isConfirmed ? '#1e40af' : '#991b1b';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .status-badge { background-color: ${statusBgColor}; color: ${statusTextColor}; padding: 8px 16px; border-radius: 6px; display: inline-block; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${headerText}</h1>
          </div>
          <div class="content">
            <p>Hello ${data.tenantName},</p>
            <p>A booking has been <strong>${data.status.toLowerCase()}</strong>.</p>

            <div style="text-align: center; margin: 20px 0;">
              <span class="status-badge">${data.status.toUpperCase()}</span>
            </div>

            <div class="booking-details">
              <h2 style="color: ${headerColor}; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${data.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${data.assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer:</span> ${data.customerName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span> ${data.formattedStartDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span> ${data.formattedEndDate}
              </div>
            </div>

            ${isConfirmed
              ? `<p>Please ensure that <strong>${data.assetName}</strong> is ready for the customer on ${data.formattedStartDate}.</p>`
              : `<p>The booking for <strong>${data.assetName}</strong> has been cancelled and the asset is now available for other bookings.</p>`
            }

            <div class="footer">
              <p>This is an automated notification from your booking management system.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateStatusUpdateEmailForCustomer(data: {
    customerName: string;
    bookingId: string;
    assetName: string;
    formattedStartDate: string;
    formattedEndDate: string;
    status: 'Confirmed' | 'Cancelled';
  }): string {
    const isConfirmed = data.status === 'Confirmed';
    const headerColor = isConfirmed ? '#2563eb' : '#dc2626';
    const headerText = isConfirmed ? 'Your Booking is Confirmed!' : 'Your Booking Has Been Cancelled';
    const statusBgColor = isConfirmed ? '#dbeafe' : '#fee2e2';
    const statusTextColor = isConfirmed ? '#1e40af' : '#991b1b';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .status-badge { background-color: ${statusBgColor}; color: ${statusTextColor}; padding: 8px 16px; border-radius: 6px; display: inline-block; font-weight: bold; }
          .highlight { background-color: ${isConfirmed ? '#fef3c7' : '#fee2e2'}; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${headerText}</h1>
          </div>
          <div class="content">
            <p>Hello ${data.customerName},</p>
            <p>${isConfirmed
              ? 'Great news! Your booking has been confirmed.'
              : 'This email confirms that your booking has been cancelled.'
            }</p>

            <div style="text-align: center; margin: 20px 0;">
              <span class="status-badge">${data.status.toUpperCase()}</span>
            </div>

            <div class="booking-details">
              <h2 style="color: ${headerColor}; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${data.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${data.assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span> ${data.formattedStartDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span> ${data.formattedEndDate}
              </div>
            </div>

            <div class="highlight">
              <strong>${isConfirmed ? 'Important:' : 'Note:'}</strong> ${isConfirmed
                ? `Please be prepared to pick up <strong>${data.assetName}</strong> on ${data.formattedStartDate}.`
                : 'If you cancelled by mistake or would like to create a new booking, please contact us.'
              }
            </div>

            ${isConfirmed
              ? '<p>If you have any questions or need to make changes, please contact us as soon as possible.</p>'
              : '<p>Thank you for letting us know. We hope to serve you again in the future.</p>'
            }

            <p>We ${isConfirmed ? 'look forward to serving you' : 'appreciate your understanding'}!</p>

            <div class="footer">
              <p>This is an automated notification from your booking management system.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // -----------------------------
  // Owner-specific Methods
  // -----------------------------

  async getOwnerBookings(ownerId: string, ownerAssets: string[], assetId?: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;
    const filters: any[] = [
      inArray(schema.Booking.assetId, ownerAssets),
      isNull(schema.Booking.deletedAt)
    ];

    if (assetId) {
      // Verify owner owns this specific asset
      if (!ownerAssets.includes(assetId)) {
        throw new NotFoundException('Asset not found or you do not have access to it');
      }
      filters.push(eq(schema.Booking.assetId, assetId));
    }

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Booking)
      .where(and(...filters))
      .execute();

    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated bookings with all related data
    const bookings = await this.db
      .select()
      .from(schema.Booking)
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.User, eq(schema.Booking.userId, schema.User.id))
      .innerJoin(schema.Customer,
        and(
          eq(schema.Customer.userId, schema.User.id),
          eq(schema.Customer.tenantId, schema.Asset.tenantId)
        )
      )
      .where(and(...filters))
      .limit(pageSize)
      .offset(offset)
      .execute();

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    const bookingData = bookings.map((row) => ({
      ...row.booking,
      asset: row.assets,
      user: row.users,
      customer: row.customer_details,
    }));

    return {
      data: bookingData,
      pagination: paginationData,
    };
  }

  async getOwnerBooking(ownerId: string, ownerAssets: string[], bookingId: string) {
    const booking = await this.db.query.Booking.findFirst({
      where: (b, { eq, and, isNull }) => and(
        eq(b.id, bookingId),
        isNull(b.deletedAt)
      ),
      with: {
        asset: true,
        user: true,
      }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify owner owns the asset
    if (!ownerAssets.includes(booking.assetId)) {
      throw new NotFoundException('Booking not found or you do not have access to it');
    }

    // Get customer details
    const customer = await this.db.query.Customer.findFirst({
      where: (c, { eq, and }) => and(
        eq(c.userId, booking.userId),
        eq(c.tenantId, booking.asset.tenantId)
      ),
    });

    return {
      ...booking,
      customer,
    };
  }

}
