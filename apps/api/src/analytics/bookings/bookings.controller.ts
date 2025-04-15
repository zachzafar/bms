import { Controller, Headers } from '@nestjs/common';
import { BookingAnalyticsService } from './bookings.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';

@Controller('bookings')
export class BookingsAnalyticsController {
    constructor(private BookingsAnalyticsService: BookingAnalyticsService){}

    @TsRestHandler(contract.analytics.getBookingCount)
    async getBookingAnalytics(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.analytics.getBookingCount, async ({}) => {
            const tenantId = headers['x-tenant-id'];


            const result = await this.BookingsAnalyticsService.getBookingCount(tenantId);
            return {
                status: 200,
                body: {
                    totalBookings: result
                }
            }
        })
    }

    @TsRestHandler(contract.analytics.getBookingCountsByMonthPerYear)
    async getBookingCountsByMonthPerYear(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.analytics.getBookingCountsByMonthPerYear, async ({query}) => {
            const tenantId = headers['x-tenant-id'];
            const result = await this.BookingsAnalyticsService.getBookingCountByMonth(tenantId,query.year)
            return {
                status: 200,
                body: {
                    total: result.reduce((acc, cur) => acc + cur.bookingCount, 0),
                    monthly: result.map((month) => {
                        return {
                            month: month.month,
                            count: month.bookingCount
                        }
                    })
                }
            }
        })
    }
    
}
