import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { EmailEvent } from 'src/email/events';
import { BookingRepository } from '../booking.repository';
import { generateTenantReminderEmail, generateCustomerReminderEmail } from '../booking.utils';


@Injectable()
export class BookingRemindersCron {
    private readonly logger = new Logger(BookingRemindersCron.name);

    constructor(private readonly repo: BookingRepository,
        private readonly eventEmitter: EventEmitter2,
    ) { }

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
            const upcomingBookings = await this.repo.findUpcomingConfirmedBookings(windowStart, windowEnd)

            this.logger.log(`Found ${upcomingBookings.length} bookings starting in 24 hours`);

            // Send emails for each booking
            for (const row of upcomingBookings) {
                const { booking, asset, customer } = row;

                if (!customer) continue;

                // Get tenant admin users
                const tenantAdmins = await this.repo.findTenantAdmins(row.asset.tenantId)

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

                this.logger.log(`Sent reminders for booking ${booking.id}`);
            }

            this.logger.log('Booking reminder job completed successfully');
        } catch (error: any) {
            this.logger.error(`Error in booking reminder job: ${error?.message}`, error?.stack);
        }
    }
}