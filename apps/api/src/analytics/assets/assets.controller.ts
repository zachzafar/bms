import { Controller, Headers } from '@nestjs/common';
import { AssetAnalyticsService } from './assets.service';
import { contract } from '@repo/api-contract';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';

@Controller()
export class AssetsController {
    constructor(private assetAnalyticsService: AssetAnalyticsService){}

    @TsRestHandler(contract.analytics.getAssetCount)
    async getAssetAnalytics(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.analytics.getAssetCount, async ({query}) => {
            const tenantId = headers['x-tenant-id'];
            const result = await this.assetAnalyticsService.getAssetCount(tenantId,query.assetTypeId ?? []);
            return {
                status: 200,
                body: {
                    totalAssets: result.totalAssets,
                    byAssetType: result.byAssetType.map((assetType) => {
                        return {
                            assetTypeId: Number(assetType.assetTypeId),
                            count: assetType.count
                        }
                    })
                }
            }
        })
    }
}
