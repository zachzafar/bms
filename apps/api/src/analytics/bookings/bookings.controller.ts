import { Controller, Headers, UseGuards } from '@nestjs/common';
import { BookingAnalyticsService } from './bookings.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
// import { RequireRead } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class BookingsAnalyticsController {
    constructor(private BookingsAnalyticsService: BookingAnalyticsService){}

    @TsRestHandler(contract.analytics.getBookingCount)
    @Roles(PermissionScope.ANALYTICS_ASSETS_READ)
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
    @Roles(PermissionScope.ANALYTICS_ASSETS_READ)
    async getBookingCountsByMonthPerYear(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.analytics.getBookingCountsByMonthPerYear, async ({query}) => {
            const tenantId = headers['x-tenant-id'];
            const result = await this.BookingsAnalyticsService.getBookingCountByMonth(tenantId,Number(query.year))
            const monthsAbbreviated = [
                "Jan", 
                "Feb", 
                "Mar", 
                "Apr", 
                "May", 
                "Jun", 
                "Jul", 
                "Aug", 
                "Sep", 
                "Oct", 
                "Nov", 
                "Dec"
              ];
            return {
                status: 200,
                body: {
                    total: result.reduce((acc, cur) => acc + cur.bookingCount, 0),
                    monthly: result.map((month) => {
                        return {
                            month: monthsAbbreviated[month.month - 1],
                            bookings: month.bookingCount
                        }
                    })
                }
            }
        })
    }
    
}
