import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EmailEvent } from 'src/email/events';
import { BookingRepository } from '../booking.repository';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class BookingCreatedHandler {
    private readonly logger = new Logger(BookingCreatedHandler.name);
    constructor(private readonly repo: BookingRepository,
        private readonly eventEmitter: EventEmitter2,
        private readonly tenantService: TenantService
    ) { }

    @OnEvent('create-booking')
    async sendBookingConfirmation(bookingId: string) {
        try {
            // Fetch booking details with all related data
            const bookingData = await this.repo.findBookingWithTokenForEmail(bookingId);

            if (!bookingData) {
                throw new NotFoundException('Booking not found');
            }

            const { booking, assets: asset, customer_details: customer, booking_upate_token } = bookingData;

            // Get tenant details including subdomain
            const tenant = await this.tenantService.getTenantById(asset.tenantId);

            if (!tenant) {
                throw new NotFoundException('Tenant not found');
            }

            // Get tenant admins
            const tenantAdmins = await this.repo.findTenantAdmins(asset.tenantId);

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
        } catch (error: any) {
            this.logger.error(`Error sending booking confirmation: ${error?.message}`, error?.stack);
            // Don't throw - we don't want to fail the booking if email fails
        }
    }
}