import { Inject, Injectable, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { count,eq, inArray, and } from 'drizzle-orm';

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


}
