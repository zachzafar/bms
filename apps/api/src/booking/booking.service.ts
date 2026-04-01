import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as schema from '@repo/api-contract';
import { ExtendedSelectBooking, InsertBooking } from '@repo/api-contract';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { EmailEvent } from 'src/email/events';
import { randomBytes } from 'crypto';
import { Cron } from '@nestjs/schedule';
import { generateCustomerReminderEmail, generateStatusUpdateEmailForCustomer, generateStatusUpdateEmailForTenant, generateTenantReminderEmail } from './booking.utils';
import { RatesService } from 'src/rates/rates.service';
import { AddonService } from 'src/addon/addon.service';
import { TaxFeeService } from 'src/tax-fee/tax-fee.service';
import { TenantService } from 'src/tenant/tenant.service';
import { BookingRepository } from './booking.repository';


@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly repo: BookingRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly ratesService: RatesService,
    private readonly addonService: AddonService,
    private readonly taxFeeService: TaxFeeService,
    private readonly tenantService: TenantService,
  ) { }

  async createBooking(
    booking: schema.InsertBooking,
    customerIds: number[],
    newCustomer?: { name: string; email: string; phone?: string; tenantId: string },
    formResponses?: Array<{ formFieldId: number; value: string }>,
    addons?: Array<{ addonItemId: number; quantity: number }>
  ): Promise<string | void> {
    this.logger.log(`Creating booking for asset ${booking.assetId} with ${customerIds.length} customer(s)`);
    this.logger.debug(`Booking input: ${JSON.stringify({ ...booking, customerIds })}`);
    const utcStart = new Date(booking.startDate);
    const utcEnd = new Date(booking.endDate);

    if (!customerIds.length && !newCustomer) {
      throw new ConflictException('No customers selected or provided');
    }

    await this.validateDatesNotBlocked(booking.assetId, booking.startDate, booking.endDate);

    const bookingId = await this.repo.transaction(async (tx) => {
      // Resolve customer
      const customerId = await this.resolveCustomer(tx, customerIds, newCustomer);
      this.logger.debug(`Resolved customerId: ${customerId}`);
      const customer = await this.repo.findCustomerById(customerId, tx);

      if (!customer) {
        throw new ConflictException('Customer not found');
      }

      // Get asset and tenant
      const asset = await this.repo.findAssetById(booking.assetId, tx);
      if (!asset) {
        throw new ConflictException('Asset not found');
      }

      const tenant = await this.repo.findTenantById(asset.tenantId, tx);

      // Calculate price
      const { totalPrice: rateTotal, rateSegments } = await this.calculatePrice(
        booking.assetId,
        utcStart,
        utcEnd,
        booking.totalPrice,
        tenant?.booksByAssetType ?? false
      );
      this.logger.debug(`Price calculation - rateTotal: ${rateTotal}, segments: ${JSON.stringify(rateSegments)}`);

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
        this.logger.debug(`Addons - total: ${addonsTotal}, processed: ${JSON.stringify(processedAddons)}`);
      }

      const subtotal = rateTotal + addonsTotal;
      this.logger.debug(`Subtotal: ${subtotal} (rateTotal: ${rateTotal} + addonsTotal: ${addonsTotal})`);

      // Process taxes and fees
      const totalBookingUnits = rateSegments.reduce((sum, seg) => sum + seg.units, 0) || 1;
      const activeTaxFees = await this.taxFeeService.getActiveForTenant(asset.tenantId);
      const { items: taxFeeItems, totalTaxAmount } = this.taxFeeService.calculateTaxesAndFees(
        subtotal, totalBookingUnits, activeTaxFees as any
      );
      this.logger.debug(`Tax/fees - totalTaxAmount: ${totalTaxAmount}, items: ${JSON.stringify(taxFeeItems)}`);

      const totalPrice = subtotal + totalTaxAmount;
      this.logger.debug(`Final totalPrice: ${totalPrice}`);

      // Create booking
      const id = await this.repo.insertBooking({
        ...booking,
        customerId,
        startDate: utcStart,
        endDate: utcEnd,
        status: tenant?.enableAutomaticConfirmation ? 'Confirmed' : 'Pending',
        totalPrice: totalPrice.toString(),
      }, tx);
      this.logger.log(`Booking record created with id: ${id}`);

      await this.repo.insertBookingAddons(
        processedAddons.map(a => ({
          bookingId: id,
          addonItemId: a.addonItemId,
          quantity: a.quantity,
          unitPrice: a.unitPrice.toFixed(2),
          billingType: a.billingType as 'per_unit' | 'flat',
          totalPrice: a.totalPrice.toFixed(2),
        })),
        tx,
      );

      await this.repo.insertBookingTaxFees(
        taxFeeItems.map(tf => ({
          bookingId: id,
          taxFeeId: tf.taxFeeId,
          name: tf.name,
          type: tf.type as 'tax' | 'fee',
          calculationType: tf.calculationType as 'percentage' | 'fixed_per_unit' | 'fixed_flat',
          rate: parseFloat(tf.rate).toFixed(4),
          calculationBasis: tf.calculationBasis as 'net' | 'gross',
          calculatedAmount: tf.calculatedAmount.toFixed(2),
        })),
        tx,
      );

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
    const blockedDates = await this.repo.findBlockedDates(assetId, startDate, endDate);
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
    if (customerIds.length > 0) return customerIds[0];

    if (!newCustomer) throw new ConflictException('No customer provided');

    const existing = await this.repo.findCustomerByEmail(newCustomer.email, newCustomer.tenantId, tx);
    if (existing) return existing.id;

    return this.repo.insertCustomer({
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone ?? null,
      tenantId: newCustomer.tenantId,
    }, tx);
  }

  // Helper: Calculate booking price using split rates
  private async calculatePrice(
    assetId: string,
    startDate: Date,
    endDate: Date,
    providedPrice?: string | number | null,
    booksByAssetType: boolean = false
  ): Promise<{ totalPrice: number; rateSegments: Array<{ rate: any; units: number; segmentStart: Date; segmentEnd: Date; segmentPrice: number }> }> {
    this.logger.debug(`calculatePrice - assetId: ${assetId}, start: ${startDate.toISOString()}, end: ${endDate.toISOString()}, providedPrice: ${providedPrice}, booksByAssetType: ${booksByAssetType}`);

    if (providedPrice && parseFloat(providedPrice.toString()) > 0) {
      this.logger.debug(`calculatePrice - using providedPrice: ${providedPrice}`);
      return { totalPrice: parseFloat(providedPrice.toString()), rateSegments: [] };
    }

    const segments = await this.ratesService.getEffectiveRatesForBooking(
      assetId,
      startDate,
      endDate,
      booksByAssetType
    );
    this.logger.debug(`calculatePrice - found ${segments.length} rate segment(s): ${JSON.stringify(segments)}`);

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
      this.logger.debug(`calculatePrice - segment: pricePerUnit=${pricePerUnit}, unitMinutes=${unitMinutes}, segmentMinutes=${segmentMinutes}, units=${units}, segmentPrice=${segmentPrice}`);
      return { ...seg, units, segmentPrice };
    });

    this.logger.debug(`calculatePrice - totalPrice: ${totalPrice}`);
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
    bookingId: string,
  ) {
    await this.repo.insertBlockedDate(
      { tenantId, assetId, startDate, endDate, title: `Booking ${bookingId.slice(0, 8)}`, reason: 'Customer booking', bookingId },
      tx,
    );
  }



  // Helper: Create booking update token
  private async createBookingUpdateToken(tx: any, bookingId: string, customerId: number, expiresAt: Date) {
    const token = `uptk_${randomBytes(32).toString('hex')}`;
    await this.repo.insertBookingUpdateToken({ bookingId, customerId, token, expiresAt }, tx);
  }

  // Helper: Save form responses
  private async saveFormResponses(tx: any, bookingId: string, formResponses: Array<{ formFieldId: number; value: string }>) {
    await this.repo.insertFormResponses(
      formResponses.map((r) => ({ bookingId, formFieldId: r.formFieldId, value: r.value })),
      tx,
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

    const invoiceId = await this.repo.insertInvoice({
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
    }, tx);

    if (rateSegments.length > 0) {
      for (const seg of rateSegments) {
        const unitLabel = seg.rate.rateTypeName || 'unit';
        const pricePerUnit = seg.rate.pricePerUnit ? parseFloat(seg.rate.pricePerUnit.toString()) : 0;
        const segStart = seg.segmentStart.toLocaleDateString();
        const segEnd = seg.segmentEnd.toLocaleDateString();
        await this.repo.insertInvoiceItem({
          invoiceId,
          description: `${asset.name} - ${seg.units} ${unitLabel}${seg.units > 1 ? 's' : ''} @ $${pricePerUnit}/${unitLabel} (${segStart} - ${segEnd})`,
          quantity: seg.units,
          unitPrice: pricePerUnit.toFixed(2),
          totalPrice: seg.segmentPrice.toFixed(2),
        }, tx);
      }
    } else {
      const ratePortion = subtotal - processedAddons.reduce((sum, a) => sum + a.totalPrice, 0);
      const durationUnits = this.calculateDurationUnits(startDate, endDate);
      const pricePerUnit = durationUnits > 0 ? ratePortion / durationUnits : ratePortion;
      await this.repo.insertInvoiceItem({
        invoiceId,
        description: `${asset.name} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
        quantity: durationUnits || 1,
        unitPrice: pricePerUnit.toFixed(2),
        totalPrice: ratePortion.toFixed(2),
      }, tx);
    }

    for (const addon of processedAddons) {
      const billingLabel = addon.billingType === 'per_unit' ? 'per unit' : 'flat';
      await this.repo.insertInvoiceItem({
        invoiceId,
        description: `Add-on: ${addon.name} (x${addon.quantity}, ${billingLabel})`,
        quantity: addon.quantity,
        unitPrice: addon.unitPrice.toFixed(2),
        totalPrice: addon.totalPrice.toFixed(2),
      }, tx);
    }

    for (const tf of processedTaxFees) {
      let description = tf.name;
      if (tf.calculationType === 'percentage') description = `${tf.name} (${parseFloat(tf.rate)}%)`;
      else if (tf.calculationType === 'fixed_per_unit') description = `${tf.name} ($${parseFloat(tf.rate)}/unit)`;
      await this.repo.insertInvoiceItem({
        invoiceId,
        description,
        quantity: 1,
        unitPrice: tf.calculatedAmount.toFixed(2),
        totalPrice: tf.calculatedAmount.toFixed(2),
      }, tx);
    }
  }


  async getBooking(bookingId: string): Promise<ExtendedSelectBooking> {
    const booking = await this.repo.findBookingById(bookingId)

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Fetch form field values for this booking
    const formFieldValues = await this.repo.findBookingFormResponses(bookingId)

    // Fetch add-ons for this booking
    const bookingAddons = await this.repo.findBookingAddons(bookingId)

    // Fetch taxes/fees for this booking
    const bookingTaxFees = await this.repo.findBookingTaxFees(bookingId)

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
    return await this.repo.findBookingsByAssetId(assetId, period, page, pageSize)
  }

  async getBookings(tenantId?: string, assetId?: string, page: number = 1, pageSize: number = 10) {
    return await this.repo.findBookings(tenantId, assetId, page, pageSize)
  }



  async updateBooking(updateData: schema.UpdateBooking) {
    this.logger.log(`Updating booking ${updateData.id}`);
    const startDate = new Date(updateData.startDate);
    const endDate = new Date(updateData.endDate);

    // Check if dates are blocked (excluding the current booking's block)
    const blockedDates = await this.repo.findBlockedDatesExcludingBooking(updateData.assetId, startDate, endDate, updateData.id)

    if (blockedDates.length > 0) {
      throw new ConflictException('One or more dates are unavailable or already booked');
    }

    try {
      await this.repo.transaction(async (tx) => {
        const asset = await this.repo.findAssetById(updateData.assetId, tx);

        if (!asset) {
          throw new ConflictException('Asset not found');
        }

        const tenant = await this.repo.findTenantById(asset.tenantId, tx);

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

        await this.repo.updateBookingDatesAndPrice(updateData.id, {
          startDate,
          endDate,
          totalPrice: totalPrice.toString(),
          assetId: updateData.assetId,
        }, tx);

        await this.repo.updateBookingUpdateTokenExpiry(updateData.id, startDate, tx);

        await this.repo.deleteBlockedDatesByBookingId(updateData.id, tx);

        await this.repo.insertBlockedDate({
          tenantId: asset.tenantId,
          assetId: updateData.assetId,
          startDate,
          endDate,
          title: `Booking ${updateData.id.slice(0, 8)}`,
          reason: 'Customer booking',
          bookingId: updateData.id,
        }, tx);
      });
    } catch (e) {
      throw new ConflictException('Error occurred while updating booking:' + e);
    }
  }

  async updateBookingStatus(bookingId: string, status: 'Pending' | 'Confirmed' | 'Cancelled') {
    this.logger.log(`Updating booking ${bookingId} status to ${status}`);
    const existingBooking = await this.getBooking(bookingId);
    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    const previousStatus = existingBooking.status;

    await this.repo.updateBookingStatus(bookingId, status);

    // Handle blocked dates based on status change
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      await this.repo.deleteBlockedDatesByBookingId(bookingId);
    } else if (previousStatus === 'Cancelled' && (status === 'Pending' || status === 'Confirmed')) {
      await this.repo.insertBlockedDateDirect({
        startDate: existingBooking.startDate,
        endDate: existingBooking.endDate,
        title: `Booking ${bookingId}`,
        reason: `Booking restored to ${status}`,
        bookingId: bookingId,
        tenantId: existingBooking.asset.tenantId,
        assetId: existingBooking.assetId,
      });
    }

    // Send email notifications for Confirmed or Cancelled status
    if (status === 'Confirmed' || status === 'Cancelled') {
      try {
        const bookingDetails = await this.repo.findBookingWithRelationsForEmail(bookingId);

        if (bookingDetails) {
          const { booking, asset, customer } = bookingDetails;

          const tenantAdmins = await this.repo.findTenantAdmins(asset.tenantId);

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
      } catch (error: any) {
        this.logger.error(`Error sending booking status update emails: ${error?.message}`, error?.stack);
        // Don't throw - we don't want to fail the status update if email fails
      }
    }

    return { message: `Booking status updated to ${status}` };
  }

  async deleteBooking(bookingId: string) {
    this.logger.log(`Deleting booking ${bookingId}`);
    const existingBooking = await this.repo.findBookingById(bookingId);

    if (!existingBooking) {
      throw new NotFoundException('Booking not found or already deleted');
    }

    if (existingBooking.booking.status !== 'Cancelled') {
      throw new ConflictException('Booking must be cancelled before it can be deleted. Please cancel the booking first.');
    }

    await this.repo.softDeleteBooking(bookingId);

    await this.repo.deleteBlockedDatesByBookingId(bookingId);
  }

  async validateUpdateToken(token: string, bookingId: string) {
    const row = await this.repo.findUpdateToken(token, bookingId);

    if (!row) {
      return false
    }
    if (row.expiresAt < new Date()) {
      return false
    }

    return true
  }

  // -----------------------------
  // Owner-specific Methods
  // -----------------------------

  async getOwnerBookings(ownerId: string, ownerAssets: string[], assetId?: string, page: number = 1, pageSize: number = 10) {
    return await this.repo.findOwnerBookings(ownerAssets, assetId, page, pageSize)
  }

  async getOwnerBooking(ownerId: string, ownerAssets: string[], bookingId: string) {
    const booking = await this.repo.findBookingById(bookingId)

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify owner owns the asset
    if (!ownerAssets.includes(booking.assets.id)) {
      throw new NotFoundException('Booking not found or you do not have access to it');
    }

    return {
      ...booking,
      customer: booking.customer_details,
    };
  }

  // -----------------------------
  // Asset Type Booking Methods
  // -----------------------------

  /**
   * Find an available asset of a given asset type for the specified date range.
   * Checks both BlockedDate entries and existing Bookings for conflicts.
   * Throws NotFoundException if asset type has no assets for this tenant.
   * Returns null if all assets are occupied for the requested range.
   */


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
    const availableAsset = await this.repo.findAvailableAssetOfType(
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
   * Resolves a tenant ID from either a UUID or a subdomain slug.
   * Tries UUID lookup first; if no tenant found, falls back to subdomain lookup.
   */
  private async resolveTenantId(idOrSubdomain: string): Promise<string> {
    const byId = await this.tenantService.getTenantById(idOrSubdomain);
    if (byId) {
      return byId.id;
    }
    const bySubdomain = await this.tenantService.getTenantBySubdomain(idOrSubdomain);
    return bySubdomain.id;
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
    tenantIdOrSubdomain: string
  ): Promise<{ message: string; assetName: string }> {
    const { assetTypeId, startDate, endDate, customer, formResponses, addons } = data;

    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    this.logger.log(`[customerCreateBookingByAssetType] resolved tenantIdOrSubdomain="${tenantIdOrSubdomain}" → tenantId=${tenantId}`);
    this.logger.log(`[customerCreateBookingByAssetType] tenantId=${tenantId} assetTypeId=${assetTypeId} startDate=${startDate} endDate=${endDate} customer=${customer.email}`);

    // Find available asset of this type
    const availableAsset = await this.repo.findAvailableAssetOfType(
      assetTypeId,
      startDate,
      endDate,
      tenantId
    );

    if (!availableAsset) {
      this.logger.warn(`[customerCreateBookingByAssetType] no available asset found`);
      throw new ConflictException('No available assets for the selected dates');
    }

    this.logger.log(`[customerCreateBookingByAssetType] creating booking for asset "${availableAsset.name}" (${availableAsset.id})`);

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

    this.logger.log(`[customerCreateBookingByAssetType] booking created successfully bookingId=${bookingId}`);

    return {
      message: 'Booking created successfully',
      assetName: availableAsset.name,
    };
  }

  /**
   * Returns a full price breakdown for a public booking quote without creating a booking.
   */
  async getPriceQuote(
    subdomain: string,
    assetTypeId: number,
    startDate: Date,
    endDate: Date,
    addons?: Array<{ addonItemId: number; quantity: number }>,
  ) {
    const tenantId = await this.resolveTenantId(subdomain);

    // Find any asset of this type to resolve rates (rates are per asset type)
    const asset = await this.repo.findAnyAssetOfType(assetTypeId, tenantId)

    if (!asset) {
      throw new NotFoundException(`No assets found for asset type ${assetTypeId}`);
    }

    const tenant = await this.tenantService.getTenantById(tenantId);
    const booksByAssetType = tenant?.booksByAssetType ?? false;

    const { totalPrice: rateTotal, rateSegments } = await this.calculatePrice(
      asset.id,
      startDate,
      endDate,
      undefined,
      booksByAssetType,
    );

    const totalBookingUnits = rateSegments.reduce((sum, seg) => sum + seg.units, 0) || 1;

    // Process add-ons
    let addonsTotal = 0;
    const addonLines: Array<{ name: string; quantity: number; unitPrice: number; billingType: string; total: number }> = [];

    if (addons?.length) {
      const addonItems = await this.addonService.getAddonItemsByIds(addons.map(a => a.addonItemId), tenantId);
      for (const selection of addons) {
        const item = addonItems.find(a => a.id === selection.addonItemId);
        if (!item) continue;
        const unitPrice = parseFloat(item.price);
        const total = item.billingType === 'per_unit'
          ? unitPrice * selection.quantity * totalBookingUnits
          : unitPrice * selection.quantity;
        addonsTotal += total;
        addonLines.push({ name: item.name, quantity: selection.quantity, unitPrice, billingType: item.billingType, total });
      }
    }

    const subtotal = rateTotal + addonsTotal;
    const activeTaxFees = await this.taxFeeService.getActiveForTenant(tenantId);
    const { items: taxFeeItems, totalTaxAmount } = this.taxFeeService.calculateTaxesAndFees(
      subtotal, totalBookingUnits, activeTaxFees as any,
    );

    return {
      rateSegments: rateSegments.map(seg => ({
        rateName: seg.rate?.name ?? 'Rate',
        pricePerUnit: parseFloat(seg.rate?.pricePerUnit ?? '0'),
        units: seg.units,
        subtotal: seg.segmentPrice,
      })),
      rateTotal,
      addonLines,
      addonsTotal,
      taxLines: taxFeeItems.map(tf => ({
        name: tf.name,
        type: tf.type,
        calculationType: tf.calculationType,
        rate: tf.rate,
        amount: tf.calculatedAmount,
      })),
      taxTotal: totalTaxAmount,
      grandTotal: subtotal + totalTaxAmount,
    };
  }

}
