import { Controller, Headers, UseGuards } from '@nestjs/common';
import { AssetAnalyticsService } from './assets.service';
import { contract } from '@repo/api-contract';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
// import { RequireRead } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class AssetsController {
    constructor(private assetAnalyticsService: AssetAnalyticsService){}

    @TsRestHandler(contract.analytics.getAssetCount)
    @Roles(PermissionScope.ANALYTICS_ASSETS_READ)
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

    @TsRestHandler(contract.analytics.getAssetUtilization)
    @Roles(PermissionScope.ANALYTICS_ASSETS_READ)
    async getAssetUtilization(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.analytics.getAssetUtilization, async ({query}) => {
            const tenantId = headers['x-tenant-id'];
            const result = await this.assetAnalyticsService.getAssetUtilization(tenantId,Number(query.period));
            const resultList = Object.entries(result);
            return {
                status: 200,
                body: resultList.map((result) => {
                        return {
                            assetType: result[1].assetType,
                            utilizationRate: (result[1].bookedSlots/result[1].totalSlots),
                            booked: result[1].bookedSlots,
                            total: result[1].totalSlots
                        }
                    })
            }
        })
    }

    @TsRestHandler(contract.analytics.getMaintenanceCostByAssetTypePerMonth)
    @Roles(PermissionScope.ANALYTICS_ASSETS_READ)
    async getMaintenanceCostByAssetTypePerMonth(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.analytics.getMaintenanceCostByAssetTypePerMonth, async ({query}) => {
            const tenantId = headers['x-tenant-id'];
            const result = await this.assetAnalyticsService.getMaintenanceCostByAssetTypePerMonth(tenantId,Number(query.period));
            return {
                status: 200,
                body: result
            }
        })
    }

    @TsRestHandler(contract.analytics.getRevenueByAssetTypePerYear)
    @Roles(PermissionScope.ANALYTICS_ASSETS_READ)
    async getRevenueByAssetTypePerYear(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.analytics.getRevenueByAssetTypePerYear, async ({query}) => {
            const tenantId = headers['x-tenant-id'];
            const result = await this.assetAnalyticsService.getRevenueByAssetType(tenantId,Number(query.period));
            return {
                status: 200,
                body: result
            }
        })
    }
}
