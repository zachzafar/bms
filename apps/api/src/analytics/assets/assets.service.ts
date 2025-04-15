import { Inject, Injectable, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { count,eq, inArray, and,sql } from 'drizzle-orm';

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
                assetTypeIds.length > 0 ? inArray(schema.Asset.assetTypeId, assetTypeIds.map(id => BigInt(id))) : undefined
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

    

    getAssetUtilization(tenantId:string,assetTypeIds:string[],assetId?: string,) {

        return {
            utilization: 0.5
        }
    }

    async getMaintenanceCostByAssetTypePerMonth(tenantId: string, assetTypeIds: string[], year?: number) {
        try {
            this.logger.log(`Getting maintenance cost by asset type per month for tenant: ${tenantId}`);
            
            // Build query conditions
            const conditions = [eq(schema.Asset.tenantId, tenantId)];
            
            // Add asset type filter if provided
            if (assetTypeIds && assetTypeIds.length > 0) {
                conditions.push(inArray(schema.Asset.assetTypeId, assetTypeIds.map(id => BigInt(id))));
            }
            
            // Add year filter if provided
            let startDate, endDate;
            if (year !== undefined) {
                startDate = new Date(year, 0, 1); // January 1st of the year
                endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st of the year
                conditions.push(
                    sql`${schema.MaintenanceTask.createdAt} >= ${startDate}`,
                    sql`${schema.MaintenanceTask.createdAt} <= ${endDate}`
                );
            }
            
            // Execute the query
            const results = await this.db.select({
                assetTypeId: schema.Asset.assetTypeId,
                month: sql`MONTH(${schema.MaintenanceTask.createdAt})`,
                totalCost: sql`SUM(${schema.MaintenanceTask.cost})`
            })
            .from(schema.MaintenanceTask)
            .innerJoin(schema.Asset, eq(schema.MaintenanceTask.assetId, schema.Asset.id))
            .where(and(...conditions))
            .groupBy(schema.Asset.assetTypeId, sql`MONTH(${schema.MaintenanceTask.createdAt})`)
            .orderBy(schema.Asset.assetTypeId, sql`MONTH(${schema.MaintenanceTask.createdAt})`);
            
            // Process results to ensure all months are represented
            const processedResults = {};
            
            // Initialize data structure for all asset types and months
            const uniqueAssetTypes = [...new Set(results.map(r => r.assetTypeId ? r.assetTypeId.toString() : 'unknown'))];
            
            uniqueAssetTypes.forEach(assetTypeId => {
                processedResults[assetTypeId] = Array(12).fill(0).map((_, index) => ({
                    month: index + 1,
                    cost: 0
                }));
            });
            
            // Fill in actual data
            results.forEach(result => {
                const assetTypeId = result.assetTypeId ? result.assetTypeId.toString() : 'unknown';
                const monthIndex = Number(result.month) - 1;
                if (monthIndex >= 0 && monthIndex < 12 && processedResults[assetTypeId]) {
                    processedResults[assetTypeId][monthIndex].cost = Number(result.totalCost) || 0;
                }
            });
            
            return {
                byAssetType: processedResults
            };
        } catch (error) {
            this.logger.error(`Error getting maintenance cost for tenant: ${tenantId}`, error);
            throw error;
        }
    }

    async getRevenueByAssetType() {
        
    }
}
