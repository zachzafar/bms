import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { ExtendedSelectBooking, InsertBooking } from '@repo/api-contract';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { EmailEvent } from 'src/email/events';
import { randomBytes } from 'crypto';
import { Cron } from '@nestjs/schedule';
import { generateCustomerReminderEmail, generateStatusUpdateEmailForCustomer, generateStatusUpdateEmailForTenant, generateTenantReminderEmail } from './booking.utils';
import { RatesService } from 'src/rates/rates.service';
import { AddonService } from 'src/addon/addon.service';
import { TaxFeeService } from 'src/tax-fee/tax-fee.service';


@Injectable()
export class BookingService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private readonly eventEmitter: EventEmitter2,
    private readonly ratesService: RatesService,
    private readonly addonService: AddonService,
    private readonly taxFeeService: TaxFeeService,
  ) { }

  async createBooking(
    booking: schema.InsertBooking,
    customerIds: number[],
    newCustomer?: { name: string; email: string; phone?: string; tenantId: string },
    formResponses?: Array<{ formFieldId: number; value: string }>,
    addons?: Array<{ addonItemId: number; quantity: number }>
  ): Promise<string | void> {
    const utcStart = new Date(booking.startDate);
    const utcEnd = new Date(booking.endDate);

    if (!customerIds.length && !newCustomer) {
      throw new ConflictException('No customers selected or provided');
    }

    await this.validateDatesNotBlocked(booking.assetId, booking.startDate, booking.endDate);

    const bookingId = await this.db.transaction(async (tx) => {
      // Resolve customer
      const customerId = await this.resolveCustomer(tx, customerIds, newCustomer);
      const customer = await tx.query.Customer.findFirst({
        where: (c, { eq }) => eq(c.id, customerId),
      });

      if (!customer) {
        throw new ConflictException('Customer not found');
      }

      // Get asset and tenant
      const asset = await tx.query.Asset.findFirst({
        where: (a, { eq }) => eq(a.id, booking.assetId),
      });
      if (!asset) {
        throw new ConflictException('Asset not found');
      }

      const tenant = await tx.query.Tenant.findFirst({
        where: (t, { eq }) => eq(t.id, asset.tenantId),
      });

      // Calculate price
      const { totalPrice: rateTotal, rateSegments } = await this.calculatePrice(
        booking.assetId,
        utcStart,
        utcEnd,
        booking.totalPrice,
        tenant?.booksByAssetType ?? false
      );

      // Process add-ons
      let addonsTotal = 0;
      const processedAddons: Array<{
        addonItemId: number;
        name: string;
        quantity: number;
        unitPrice: number;
        billingType: string;
        totalPrice: number;
      }> = [];

      if (addons?.length) {
        const addonItemIds = addons.map(a => a.addonItemId);
        const addonItems = await this.addonService.getAddonItemsByIds(addonItemIds, asset.tenantId);

        // Calculate total booking units from rate segments for per_unit add-ons
        const totalBookingUnits = rateSegments.reduce((sum, seg) => sum + seg.units, 0) || 1;

        for (const selection of addons) {
          const addonItem = addonItems.find(a => a.id === selection.addonItemId);
          if (!addonItem) continue;

          const unitPrice = parseFloat(addonItem.price);
          let addonTotal: number;

          if (addonItem.billingType === 'per_unit') {
            addonTotal = unitPrice * selection.quantity * totalBookingUnits;
          } else {
            addonTotal = unitPrice * selection.quantity;
          }

          addonsTotal += addonTotal;
          processedAddons.push({
            addonItemId: addonItem.id,
            name: addonItem.name,
            quantity: selection.quantity,
            unitPrice,
            billingType: addonItem.billingType,
            totalPrice: addonTotal,
          });
        }
      }

      const subtotal = rateTotal + addonsTotal;

      // Process taxes and fees
      const totalBookingUnits = rateSegments.reduce((sum, seg) => sum + seg.units, 0) || 1;
      const activeTaxFees = await this.taxFeeService.getActiveForTenant(asset.tenantId);
      const { items: taxFeeItems, totalTaxAmount } = this.taxFeeService.calculateTaxesAndFees(
        subtotal, totalBookingUnits, activeTaxFees as any
      );

      const totalPrice = subtotal + totalTaxAmount;

      // Create booking
      const [{ id }] = await tx.insert(schema.Booking).values({
        ...booking,
        customerId,
        startDate: utcStart,
        endDate: utcEnd,
        status: tenant?.enableAutomaticConfirmation ? 'Confirmed' : 'Pending',
        totalPrice: totalPrice.toString(),
      }).$returningId();

      // Insert booking add-on rows
      if (processedAddons.length > 0) {
        await tx.insert(schema.BookingAddon).values(
          processedAddons.map(a => ({
            bookingId: id,
            addonItemId: a.addonItemId,
            quantity: a.quantity,
            unitPrice: a.unitPrice.toFixed(2),
            billingType: a.billingType as 'per_unit' | 'flat',
            totalPrice: a.totalPrice.toFixed(2),
          }))
        );
      }

      // Insert booking tax/fee snapshot rows
      if (taxFeeItems.length > 0) {
        await tx.insert(schema.BookingTaxFee).values(
          taxFeeItems.map(tf => ({
            bookingId: id,
            taxFeeId: tf.taxFeeId,
            name: tf.name,
            type: tf.type as 'tax' | 'fee',
            calculationType: tf.calculationType as 'percentage' | 'fixed_per_unit' | 'fixed_flat',
            rate: parseFloat(tf.rate).toFixed(4),
            calculationBasis: tf.calculationBasis as 'net' | 'gross',
            calculatedAmount: tf.calculatedAmount.toFixed(2),
          }))
        );
      }

      // Create related records
      await this.createBlockedDateForBooking(tx, asset.tenantId, booking.assetId, utcStart, utcEnd, id);
      await this.createBookingUpdateToken(tx, id, customerId, booking.startDate);

      if (formResponses?.length) {
        await this.saveFormResponses(tx, id, formResponses);
      }

      await this.createBookingInvoice(tx, asset, id, customerId, utcStart, utcEnd, subtotal, totalTaxAmount, totalPrice, rateSegments, processedAddons, taxFeeItems);

      return id;
    });

    this.eventEmitter.emit('create-booking', bookingId);
    return bookingId;
  }

  // Helper: Validate dates are not blocked
  private async validateDatesNotBlocked(assetId: string, startDate: Date, endDate: Date) {
    const blockedDates = await this.db.query.BlockedDate.findMany({
      where: (bd, { and, eq, gte, lte, or }) =>
        and(
          eq(bd.assetId, assetId),
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
  }

  // Helper: Find or create customer
  private async resolveCustomer(
    tx: any,
    customerIds: number[],
    newCustomer?: { name: string; email: string; phone?: string; tenantId: string }
  ): Promise<number> {
    if (customerIds.length > 0) {
      return customerIds[0];
    }

    if (!newCustomer) {
      throw new ConflictException('No customer provided');
    }

    // Check for existing customer by email in this tenant
    const existingCustomer = await tx.query.Customer.findFirst({
      where: (c: any, { eq, and }: any) =>
        and(eq(c.email, newCustomer.email), eq(c.tenantId, newCustomer.tenantId)),
    });

    if (existingCustomer) {
      return existingCustomer.id;
    }

    // Create new customer directly (no User record needed)
    const [{ id: customerId }] = await tx.insert(schema.Customer).values({
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone ?? null,
      tenantId: newCustomer.tenantId,
    }).$returningId();

    return customerId;
  }

  // Helper: Calculate booking price using split rates
  private async calculatePrice(
    assetId: string,
    startDate: Date,
    endDate: Date,
    providedPrice?: string | number | null,
    booksByAssetType: boolean = false
  ): Promise<{ totalPrice: number; rateSegments: Array<{ rate: any; units: number; segmentStart: Date; segmentEnd: Date; segmentPrice: number }> }> {
    if (providedPrice && parseFloat(providedPrice.toString()) > 0) {
      return { totalPrice: parseFloat(providedPrice.toString()), rateSegments: [] };
    }

    const segments = await this.ratesService.getEffectiveRatesForBooking(
      assetId,
      startDate,
      endDate,
      booksByAssetType
    );

    if (segments.length === 0) {
      const rateType = booksByAssetType ? 'asset type' : 'asset';
      throw new ConflictException(
        `No active rate found for this ${rateType} during the selected booking period. Please contact the administrator to set up rates.`
      );
    }

    let totalPrice = 0;
    const rateSegments = segments.map(seg => {
      const pricePerUnit = seg.rate.pricePerUnit ? parseFloat(seg.rate.pricePerUnit.toString()) : 0;
      const unitMinutes = seg.rate.rateTypeMinutes || 1440;
      const segmentMinutes = (seg.segmentEnd.getTime() - seg.segmentStart.getTime()) / (1000 * 60);
      const units = Math.ceil(segmentMinutes / unitMinutes);
      const segmentPrice = units * pricePerUnit;
      totalPrice += segmentPrice;
      return { ...seg, units, segmentPrice };
    });

    return { totalPrice, rateSegments };
  }

  // Helper: Calculate duration in minutes
  private calculateDurationMinutes(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60));
  }

  // Helper: Calculate number of billing units based on rate type minutes
  private calculateDurationUnits(startDate: Date, endDate: Date, rateTypeMinutes?: number | null): number {
    const totalMinutes = this.calculateDurationMinutes(startDate, endDate);
    const unitMinutes = rateTypeMinutes || 1440; // default to daily (1440 min) if no rate type
    return Math.ceil(totalMinutes / unitMinutes);
  }

  // Helper: Create blocked date for booking
  private async createBlockedDateForBooking(
    tx: any,
    tenantId: string,
    assetId: string,
    startDate: Date,
    endDate: Date,
    bookingId: string
  ) {
    await tx.insert(schema.BlockedDate).values({
      tenantId,
      assetId,
      startDate,
      endDate,
      title: `Booking ${bookingId.slice(0, 8)}`,
      reason: 'Customer booking',
      bookingId,
    });
  }

  private async createBlockedDate(
    tx: any,
    tenantId: string,
    assetId: string,
    startDate: Date,
    endDate: Date,
    bookingId: string
  ) {
    await this.db.insert(schema.BlockedDate).values({
      tenantId,
      assetId,
      startDate,
      endDate,
      title: `Booking ${bookingId.slice(0, 8)}`,
      reason: 'Customer booking',
      bookingId,
    });
  }



  // Helper: Create booking update token
  private async createBookingUpdateToken(tx: any, bookingId: string, customerId: number, expiresAt: Date | string) {
    const token = `uptk_${randomBytes(32).toString('hex')}`;
    await tx.insert(schema.BookingUpdateToken).values({
      bookingId,
      customerId,
      token,
      expiresAt,
    });
  }

  // Helper: Save form responses
  private async saveFormResponses(tx: any, bookingId: string, formResponses: Array<{ formFieldId: number; value: string }>) {
    await tx.insert(schema.BookingFormFieldValue).values(
      formResponses.map((response) => ({
        bookingId,
        formFieldId: response.formFieldId,
        value: response.value,
      }))
    );
  }

  // Helper: Create invoice for booking (supports split-rate segments, add-ons, and taxes/fees)
  private async createBookingInvoice(
    tx: any,
    asset: { id: string; name: string; tenantId: string },
    bookingId: string,
    customerId: number,
    startDate: Date,
    endDate: Date,
    subtotal: number,
    taxAmount: number,
    totalAmount: number,
    rateSegments: Array<{ rate: any; units: number; segmentStart: Date; segmentEnd: Date; segmentPrice: number }>,
    processedAddons: Array<{ addonItemId: number; name: string; quantity: number; unitPrice: number; billingType: string; totalPrice: number }> = [],
    processedTaxFees: Array<{ taxFeeId: number; name: string; type: string; calculationType: string; rate: string; calculationBasis: string; calculatedAmount: number }> = []
  ) {
    const invoiceNumber = `INV-${Date.now()}-${bookingId.slice(0, 8).toUpperCase()}`;

    const [{ id: invoiceId }] = await tx.insert(schema.Invoice).values({
      tenantId: asset.tenantId,
      invoiceNumber,
      status: 'draft',
      issueDate: new Date(),
      dueDate: startDate,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      notes: `Invoice for booking ${bookingId}`,
      customerId,
      bookingId,
    }).$returningId();

    if (rateSegments.length > 0) {
      for (const seg of rateSegments) {
        const unitLabel = seg.rate.rateTypeName || 'unit';
        const pricePerUnit = seg.rate.pricePerUnit ? parseFloat(seg.rate.pricePerUnit.toString()) : 0;
        const segStart = seg.segmentStart.toLocaleDateString();
        const segEnd = seg.segmentEnd.toLocaleDateString();

        await tx.insert(schema.InvoiceItem).values({
          invoiceId,
          description: `${asset.name} - ${seg.units} ${unitLabel}${seg.units > 1 ? 's' : ''} @ $${pricePerUnit}/${unitLabel} (${segStart} - ${segEnd})`,
          quantity: seg.units,
          unitPrice: pricePerUnit.toFixed(2),
          totalPrice: seg.segmentPrice.toFixed(2),
        });
      }
    } else {
      // Fallback: single line item (e.g. when price was provided manually)
      const ratePortion = subtotal - processedAddons.reduce((sum, a) => sum + a.totalPrice, 0);
      const durationUnits = this.calculateDurationUnits(startDate, endDate);
      const pricePerUnit = durationUnits > 0 ? ratePortion / durationUnits : ratePortion;
      await tx.insert(schema.InvoiceItem).values({
        invoiceId,
        description: `${asset.name} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
        quantity: durationUnits || 1,
        unitPrice: pricePerUnit.toFixed(2),
        totalPrice: ratePortion.toFixed(2),
      });
    }

    // Add-on invoice items
    for (const addon of processedAddons) {
      const billingLabel = addon.billingType === 'per_unit' ? 'per unit' : 'flat';
      await tx.insert(schema.InvoiceItem).values({
        invoiceId,
        description: `Add-on: ${addon.name} (x${addon.quantity}, ${billingLabel})`,
        quantity: addon.quantity,
        unitPrice: addon.unitPrice.toFixed(2),
        totalPrice: addon.totalPrice.toFixed(2),
      });
    }

    // Tax/fee invoice items
    for (const tf of processedTaxFees) {
      let description = tf.name;
      if (tf.calculationType === 'percentage') {
        description = `${tf.name} (${parseFloat(tf.rate)}%)`;
      } else if (tf.calculationType === 'fixed_per_unit') {
        description = `${tf.name} ($${parseFloat(tf.rate)}/unit)`;
      }
      await tx.insert(schema.InvoiceItem).values({
        invoiceId,
        description,
        quantity: 1,
        unitPrice: tf.calculatedAmount.toFixed(2),
        totalPrice: tf.calculatedAmount.toFixed(2),
      });
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
        .innerJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
        .innerJoin(schema.BookingUpdateToken, eq(schema.Booking.id, schema.BookingUpdateToken.bookingId))
        .where(eq(schema.Booking.id, bookingId))
        .execute()
        .then((rows) => rows[0]);

      if (!bookingData) {
        throw new NotFoundException('Booking not found');
      }

      const { booking, assets: asset, customer_details: customer, booking_upate_token } = bookingData;

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
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.AssetType, eq(schema.AssetType.id, schema.Asset.assetTypeId))
      .leftJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
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

    // Fetch add-ons for this booking
    const bookingAddons = await this.db
      .select({
        id: schema.BookingAddon.id,
        addonItemId: schema.BookingAddon.addonItemId,
        name: schema.AddonItem.name,
        quantity: schema.BookingAddon.quantity,
        unitPrice: schema.BookingAddon.unitPrice,
        billingType: schema.BookingAddon.billingType,
        totalPrice: schema.BookingAddon.totalPrice,
      })
      .from(schema.BookingAddon)
      .innerJoin(schema.AddonItem, eq(schema.BookingAddon.addonItemId, schema.AddonItem.id))
      .where(eq(schema.BookingAddon.bookingId, bookingId))
      .execute();

    // Fetch taxes/fees for this booking
    const bookingTaxFees = await this.db
      .select({
        id: schema.BookingTaxFee.id,
        taxFeeId: schema.BookingTaxFee.taxFeeId,
        name: schema.BookingTaxFee.name,
        type: schema.BookingTaxFee.type,
        calculationType: schema.BookingTaxFee.calculationType,
        rate: schema.BookingTaxFee.rate,
        calculationBasis: schema.BookingTaxFee.calculationBasis,
        calculatedAmount: schema.BookingTaxFee.calculatedAmount,
      })
      .from(schema.BookingTaxFee)
      .where(eq(schema.BookingTaxFee.bookingId, bookingId))
      .execute();

    return {
      ...booking.booking,
      startDate: booking.booking.startDate,
      endDate: booking.booking.endDate,
      customer: booking.customer_details,
      asset: booking.assets,
      assetType: booking.asset_type,
      formResponses: formFieldValues,
      addons: bookingAddons,
      taxesFees: bookingTaxFees,
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
      .innerJoin(schema.AssetType, eq(schema.AssetType.id, schema.Asset.assetTypeId))
      .leftJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
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
      customer: row.customer_details,
      assetType: row.asset_type
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

        // Get tenant settings
        const tenant = await tx.query.Tenant.findFirst({
          where: (t, { eq }) => eq(t.id, asset.tenantId),
        });

        // Always recalculate price from rate based on the updated dates
        let totalPrice = 0;
        const bookingStartDate = new Date(startDate);
        const bookingEndDate = new Date(endDate);

        try {
          const { totalPrice: calculatedPrice } = await this.calculatePrice(
            updateData.assetId,
            bookingStartDate,
            bookingEndDate,
            null,
            tenant?.booksByAssetType ?? false
          );
          totalPrice = calculatedPrice;
        } catch {
          // Fall back to the provided price if no rate is configured
          if (updateData.totalPrice) {
            totalPrice = parseFloat(updateData.totalPrice.toString());
          }
        }

        // Update booking dates, price, and asset
        await tx.update(schema.Booking)
          .set({
            startDate,
            endDate,
            totalPrice: totalPrice.toString(),
            assetId: updateData.assetId,
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

    const previousStatus = existingBooking.status;

    // Update the booking status
    await this.db.update(schema.Booking)
      .set({ status })
      .where(eq(schema.Booking.id, bookingId))
      .execute();

    // Handle blocked dates based on status change
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      // Delete blocked dates when booking is cancelled
      await this.db.delete(schema.BlockedDate)
        .where(eq(schema.BlockedDate.bookingId, bookingId))
        .execute();
    } else if (previousStatus === 'Cancelled' && (status === 'Pending' || status === 'Confirmed')) {
      // Re-create blocked dates when booking is un-cancelled
      await this.db.insert(schema.BlockedDate)
        .values({
          startDate: existingBooking.startDate,
          endDate: existingBooking.endDate,
          title: `Booking ${bookingId}`,
          reason: `Booking restored to ${status}`,
          bookingId: bookingId,
          tenantId: existingBooking.asset.tenantId,
          assetId: existingBooking.assetId,
        })
        .execute();
    }

    // Send email notifications for Confirmed or Cancelled status
    if (status === 'Confirmed' || status === 'Cancelled') {
      try {
        // Get full booking details with relations
        const bookingDetails = await this.db
          .select({
            booking: schema.Booking,
            asset: schema.Asset,
            customer: schema.Customer,
          })
          .from(schema.Booking)
          .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
          .innerJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
          .where(eq(schema.Booking.id, bookingId))
          .execute()
          .then((rows) => rows[0]);

        if (bookingDetails) {
          const { booking, asset, customer } = bookingDetails;

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
              const tenantEmailContent = generateStatusUpdateEmailForTenant({
                tenantName: admin.name,
                bookingId: booking.id,
                assetName: asset.name,
                customerName: customer.name,
                formattedStartDate,
                formattedEndDate,
                status: 'Confirmed'
              });

              this.eventEmitter.emit(
                'send-email',
                new EmailEvent(
                  admin.email,
                  `Booking Confirmed: ${asset.name} - ${customer.name}`,
                  tenantEmailContent
                )
              );
            }

            // Send email to customer
            const customerEmailContent = generateStatusUpdateEmailForCustomer({
              customerName: customer.name,
              bookingId: booking.id,
              assetName: asset.name,
              formattedStartDate,
              formattedEndDate,
              status: 'Confirmed'
            });

            this.eventEmitter.emit(
              'send-email',
              new EmailEvent(
                customer.email,
                `Booking Confirmed: ${asset.name}`,
                customerEmailContent
              )
            );
          } else if (status === 'Cancelled') {
            // Send cancellation emails
            for (const admin of tenantAdmins) {
              const tenantEmailContent = generateStatusUpdateEmailForTenant({
                tenantName: admin.name,
                bookingId: booking.id,
                assetName: asset.name,
                customerName: customer.name,
                formattedStartDate,
                formattedEndDate,
                status: 'Cancelled'
              });

              this.eventEmitter.emit(
                'send-email',
                new EmailEvent(
                  admin.email,
                  `Booking Cancelled: ${asset.name} - ${customer.name}`,
                  tenantEmailContent
                )
              );
            }

            // Send email to customer
            const customerEmailContent = generateStatusUpdateEmailForCustomer({
              customerName: customer.name,
              bookingId: booking.id,
              assetName: asset.name,
              formattedStartDate,
              formattedEndDate,
              status: 'Cancelled'
            });

            this.eventEmitter.emit(
              'send-email',
              new EmailEvent(
                customer.email,
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

    // Check if booking is cancelled before allowing deletion
    if (existingBooking.status !== 'Cancelled') {
      throw new ConflictException('Booking must be cancelled before it can be deleted. Please cancel the booking first.');
    }

    // Soft delete: set deletedAt timestamp
    await this.db.update(schema.Booking)
      .set({ deletedAt: new Date() })
      .where(eq(schema.Booking.id, bookingId))
      .execute();

    // Also delete the blocked date entry since booking is cancelled
    await this.db.delete(schema.BlockedDate)
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
          customer: schema.Customer,
        })
        .from(schema.Booking)
        .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
        .innerJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
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
        const { booking, asset, customer } = row;

        if (!customer) continue;

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
          const tenantEmailContent = generateTenantReminderEmail({
            tenantName: admin.name,
            bookingId: booking.id,
            assetName: asset.name,
            customerName: customer.name,
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
        const customerEmailContent = generateCustomerReminderEmail({
          customerName: customer.name,
          bookingId: booking.id,
          assetName: asset.name,
          formattedStartDate,
          formattedEndDate
        });

        this.eventEmitter.emit(
          'send-email',
          new EmailEvent(
            customer.email,
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
      .innerJoin(schema.AssetType, eq(schema.Asset.assetTypeId, schema.AssetType.id))
      .leftJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
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
      customer: row.customer_details,
      assetType: row.asset_type
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
        customer: true,
      }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify owner owns the asset
    if (!ownerAssets.includes(booking.assetId)) {
      throw new NotFoundException('Booking not found or you do not have access to it');
    }

    return {
      ...booking,
      customer: booking.customer,
    };
  }

  // -----------------------------
  // Asset Type Booking Methods
  // -----------------------------

  /**
   * Find an available asset of a given asset type for the specified date range
   */
  private async findAvailableAssetOfType(
    assetTypeId: number,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<{ id: string; name: string } | null> {
    // Get all assets of this type
    const assets = await this.db
      .select({ id: schema.Asset.id, name: schema.Asset.name })
      .from(schema.Asset)
      .where(
        and(
          eq(schema.Asset.assetTypeId, assetTypeId),
          eq(schema.Asset.tenantId, tenantId),
          eq(schema.Asset.available, true),
          isNull(schema.Asset.deletedAt)
        )
      );

    // Check each asset for availability
    for (const asset of assets) {
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

      if (blockedDates.length === 0) {
        return asset;
      }
    }

    return null;
  }

  /**
   * Create a booking by asset type - automatically assigns an available asset
   */
  async createBookingByAssetType(
    data: {
      assetTypeId: number;
      startDate: Date;
      endDate: Date;
      customerIds: number[];
    },
    tenantId: string
  ): Promise<{ message: string; assetId: string; bookingId: string }> {
    const { assetTypeId, startDate, endDate, customerIds } = data;

    // Find available asset of this type
    const availableAsset = await this.findAvailableAssetOfType(
      assetTypeId,
      startDate,
      endDate,
      tenantId
    );

    if (!availableAsset) {
      throw new ConflictException('No available assets of this type for the selected dates');
    }

    // Create booking with the found asset
    const bookingId = await this.createBooking(
      {
        assetId: availableAsset.id,
        startDate,
        endDate,
      },
      customerIds
    );

    return {
      message: 'Booking created by asset type',
      assetId: availableAsset.id,
      bookingId: bookingId ?? ''
    };
  }

  /**
   * Customer creates booking by asset type (public endpoint)
   */
  async customerCreateBookingByAssetType(
    data: {
      assetTypeId: number;
      startDate: Date;
      endDate: Date;
      customer: { name: string; email: string; phone?: string };
      formResponses?: Array<{ formFieldId: number; value: string }>;
      addons?: Array<{ addonItemId: number; quantity: number }>;
    },
    tenantId: string
  ): Promise<{ message: string; assetName: string }> {
    const { assetTypeId, startDate, endDate, customer, formResponses, addons } = data;

    // Find available asset of this type
    const availableAsset = await this.findAvailableAssetOfType(
      assetTypeId,
      startDate,
      endDate,
      tenantId
    );

    if (!availableAsset) {
      throw new ConflictException('No available assets of this type for the selected dates');
    }

    // Create booking with the found asset
    const bookingId = await this.createBooking(
      {
        assetId: availableAsset.id,
        startDate,
        endDate,
      },
      [], // No existing customer IDs
      { ...customer, tenantId }, // New customer info
      formResponses,
      addons
    );

    return {
      message: 'Booking created successfully',
      assetName: availableAsset.name,
    };
  }

}
