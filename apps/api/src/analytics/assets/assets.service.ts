import { Inject, Injectable, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { count,eq, inArray, and,sql, gte, lte } from 'drizzle-orm';

@Injectable()
export class AssetAnalyticsService {
    private logger = new Logger(AssetAnalyticsService.name);

    constructor(
        @Inject(DrizzleAsyncProvider) private db : MySql2Database<typeof schema>,
    ){}

    async getAssetCount(tenantId: string,assetTypeIds: number[]) {
        try {
            this.logger.log("Getting asset count for tenant: ", tenantId);

            let results = await this.db.select({
                assetTypeId: schema.Asset.assetTypeId,
                count: count()
            })
            .from(schema.Asset)
            .where(
                and(
                eq(schema.Asset.tenantId,tenantId),
                assetTypeIds.length > 0 ? inArray(schema.Asset.assetTypeId, assetTypeIds.map(id => (id))) : undefined
                )
            )
            .groupBy(schema.Asset.assetTypeId)
            let totalCount = 0;
            results.forEach(result => {
                totalCount += result.count;
            })

            return {
                totalAssets: totalCount,
                byAssetType: results
            }

        }
        catch (e) {
            this.logger.error("Error getting asset count for tenant: ", tenantId);
            throw e;
        }
    }

    

    async getAssetUtilization(tenantId: string, year: number) {
        try {

            const assetTypes = await this.db.query.AssetType.findMany({
                where: (assetType,{ eq }) => eq(assetType.tenantId, tenantId),
            });

            const assetTypeMap: Record<number, string> = {};
            assetTypes.forEach(assetType => {
                assetTypeMap[assetType.id] = assetType.name;
            });

            const slots = await this.db.select({
                assetTypeId: schema.Asset.assetTypeId,
                totalSlots: count()
            }).from(schema.Slot)
            .innerJoin(schema.Asset, and(eq(schema.Slot.assetId, schema.Asset.id)))
            .where(
                and(
                    gte(schema.Slot.date, new Date(year, 0, 1)),
                    lte(schema.Slot.date, new Date(year, 11, 31)),
                    inArray(schema.Asset.assetTypeId, assetTypes.map(assetType => (assetType.id))),
                     sql`${schema.Asset.assetTypeId} IS NOT NULL`
                )
            )
           .groupBy(schema.Asset.assetTypeId)



           const bookedslots = await this.db.select({
            assetTypeId: schema.Asset.assetTypeId,
            totalSlots: count()
        }).from(schema.Slot)
        .innerJoin(schema.Asset, and(eq(schema.Slot.assetId, schema.Asset.id),inArray(schema.Asset.assetTypeId, assetTypes.map(assetType => (assetType.id)))))
        .where(
            and(
                gte(schema.Slot.date, new Date(year, 0, 1)),
                lte(schema.Slot.date, new Date(year, 11, 31)),
                eq(schema.Slot.status, "booked"),
                sql`${schema.Asset.assetTypeId} IS NOT NULL`
            )
        )
       .groupBy(schema.Asset.assetTypeId)

            type AssetUtilizationResult = {
                assetType: string;
                totalSlots: number;
                bookedSlots: number;
            }; 
       
        const processedResults: Record<number,AssetUtilizationResult> = {};
        slots.forEach(slot => {
            const assetTypeId = Number(slot.assetTypeId);
            processedResults[assetTypeId] = {
                assetType: assetTypeMap[assetTypeId],
                totalSlots: slot.totalSlots,
                bookedSlots: 0
            };
            
        })
        
        bookedslots.forEach(slot => {
            const assetTypeId = Number(slot.assetTypeId);
            if(processedResults[assetTypeId]) {
                processedResults[assetTypeId].bookedSlots = slot.totalSlots;
            }
        })
            
        return processedResults;

        } catch (error) {
            this.logger.error(`Error getting asset utilization for tenant: ${tenantId}`, error);
            throw error;
        }
    }

    async getMaintenanceCostByAssetTypePerMonth(tenantId: string,  year: number) {
        try {
            this.logger.log(`Getting maintenance cost by asset type per month for tenant: ${tenantId}`);
            
            // Build query conditions
            const assetTypes = await this.db.query.AssetType.findMany({
                where: (assetType,{ eq }) => eq(assetType.tenantId, tenantId),
            });

            const assetTypeMap: Record<number, string> = {};
            assetTypes.forEach(assetType => {
                assetTypeMap[assetType.id] = assetType.name;
            });

            const maintenanceCost = await this.db.select({
                assetTypeId: schema.Asset.assetTypeId,
                month: sql`MONTH(${schema.MaintenanceTask.createdAt})`,
                totalCost: sql`SUM(${schema.MaintenanceTask.cost})`
            }).from(schema.MaintenanceTask).innerJoin(schema.Asset, eq(schema.MaintenanceTask.assetId, schema.Asset.id)).where(and(
                eq(schema.Asset.tenantId, tenantId),
                gte(schema.MaintenanceTask.createdAt, new Date(year, 0, 1)),
                lte(schema.MaintenanceTask.createdAt, new Date(year, 11, 31)),
                inArray(schema.Asset.assetTypeId, assetTypes.map(assetType => (assetType.id))),
            ))
            .groupBy(schema.Asset.assetTypeId, sql`MONTH(${schema.MaintenanceTask.createdAt})`)
            .execute();

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


            type MaintenanceCostResult = {
                assetType: string;
                month: string
                totalCost: number;
            }

            const maintenance: MaintenanceCostResult[] = []
            maintenanceCost.forEach(cost => {
                 maintenance.push(
                    {
                        assetType:assetTypeMap[Number(cost.assetTypeId)],
                        month: monthsAbbreviated[cost.month as number - 1],
                        totalCost: Number(cost.totalCost)
                    }
                )

            })

            return maintenance
        } catch (error) {
            this.logger.error(`Error getting maintenance cost for tenant: ${tenantId}`, error);
            throw error;
        }
    }

    async getRevenueByAssetType(tenantId: string, year: number) {
        try {
            this.logger.log(`Getting revenue by asset type for tenant: ${tenantId}`);
            const assetTypes = await this.db.query.AssetType.findMany({
                where: (assetType,{ eq }) => eq(assetType.tenantId, tenantId),
            });

            const assetTypeMap: Record<number, string> = {};
            assetTypes.forEach(assetType => {
                assetTypeMap[assetType.id] = assetType.name;
            });


            const bookings = await this.db.select({
                assetTypeId: schema.Asset.assetTypeId,
                totalRevenue: sql`SUM(${schema.Booking.totalPrice})`
            }).from(schema.Booking).innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id)).where(and(
                eq(schema.Asset.tenantId, tenantId),
                 gte(schema.Booking.createdAt, new Date(year, 0, 1)),
                lte(schema.Booking.createdAt, new Date(year, 11, 31)),
                inArray(schema.Asset.assetTypeId, assetTypes.map(assetType => (assetType.id))),
            )).groupBy(schema.Asset.assetTypeId).execute();
            type RevenueResult = {
                assetType: string;
                revenue: number;
            }
            const revenue: RevenueResult[] = []
            bookings.forEach(booking => {
                revenue.push(
                    {
                        assetType:assetTypeMap[Number(booking.assetTypeId)],
                        revenue: Number(booking.totalRevenue)
                    }
                )
            })

            return revenue

        
        } catch (error) {
            this.logger.error(`Error getting revenue by asset type for tenant: ${tenantId}`, error);
            throw error;
        }
    }
}
