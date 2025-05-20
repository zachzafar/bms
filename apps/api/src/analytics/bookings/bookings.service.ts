import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract'
import { count, eq, lte ,gte, and, sql } from 'drizzle-orm';

@Injectable()
export class BookingAnalyticsService {
    private logger = new Logger(BookingAnalyticsService.name)

    constructor (
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ) {}

    async getBookingCount(tenantId: string, year?: number) {
        try {
            this.logger.log("Getting booking count for tenant: ", tenantId)
            
            let results = await this.db.select({
                bookingCount: count()
            }).from(schema.Booking)
              .leftJoin(schema.Asset, eq(schema.Asset.id, schema.Booking.assetId))
              .where(eq(schema.Asset.tenantId, tenantId));
              
            return results[0].bookingCount;
        } catch (error) {
            this.logger.error("Error getting booking count for tenant: ", tenantId, error)
            throw new InternalServerErrorException("Error getting booking count for tenant: " + tenantId)
        }
    }

    async getBookingCountByMonth(tenantId: string, year?: number) {
        try {
            this.logger.log(`Getting booking count by month for tenant:${tenantId} for ${year}`)
            
            // Build the query conditions
            const conditions = [eq(schema.Asset.tenantId, tenantId)];
            
            // Add year filter if provided
            if (year !== undefined) {
                // Extract year from booking date and compare
                const startDate = new Date(year, 0, 1); // January 1st of the year
                const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st of the year
                
                conditions.push(
                    gte(schema.Booking.startDate, startDate),
                    lte(schema.Booking.startDate, endDate)
                );
            }
            
            // Use SQL function to extract month from startDate
            const results = await this.db.select({
                month: sql`MONTH(${schema.Booking.startDate})`,
                bookingCount: count()
            }).from(schema.Booking)
              .leftJoin(schema.Asset, eq(schema.Asset.id, schema.Booking.assetId))
              .where(and(...conditions))
              .groupBy(sql`MONTH(${schema.Booking.startDate})`)
              .orderBy(sql`MONTH(${schema.Booking.startDate})`);
              
            console.log(results)
            // Format the results as an array with all months (1-12)
            const monthlyData = Array(12).fill(0).map((_, index) => ({
                month: index + 1,
                bookingCount: 0
            }));
            
            // Fill in the actual counts from the query results
            results.forEach(result => {
                const monthIndex = Number(result.month) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    monthlyData[monthIndex].bookingCount = Number(result.bookingCount);
                }
            });
            
            return monthlyData;
        } catch (error) {
            this.logger.error("Error getting booking count by month for tenant: ", tenantId, error);
            throw new InternalServerErrorException("Error getting booking count by month for tenant: " + tenantId);
        }
    }
}
