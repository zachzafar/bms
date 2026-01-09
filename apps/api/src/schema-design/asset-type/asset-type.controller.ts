import { Controller, Logger, Headers } from '@nestjs/common';
import { AssetTypeService } from './asset-type.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from "@repo/api-contract"

@Controller()
export class AssetTypeController {
    private readonly logger = new Logger(AssetTypeController.name);
    constructor(private assetTypeService: AssetTypeService, private TenantService: TenantService) {}

    @TsRestHandler(contract.settings.assetType.getAssetTypes)
    async getAssetTypes(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.getAssetTypes, async ({ query }) => {
            const tenantId = headers['x-tenant-id']
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;

            const assetTypes = await this.assetTypeService.getAssetTypes(tenantId, page, pageSize);
            return { status: 200, body: assetTypes };
        });
    }

    @TsRestHandler(contract.settings.assetType.createAssetType)
    async createAssetType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.createAssetType, async ({ body }) => {
            const tenantId = headers['x-tenant-id']
            const id = await this.assetTypeService.createAssetType({...body.assetType, tenantId},body.properties);
            this.logger.log(`Created asset type with id ${id}`);
            return { status: 201, body: { id } };
        });
    }

    @TsRestHandler(contract.settings.assetType.getAssetType)
    async getAssetType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.getAssetType, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.AssetType, params.id)
            const assetType = await this.assetTypeService.getAssetType((params.id));
            
            if (!assetType) {
                return {
                    status: 404 as const,
                    body: { message: 'Asset type not found' }
                };
            }
            
            const { properties, ...assetTypeData } = assetType;
            return {
                status: 200 as const,
                body: { assetType: assetTypeData, properties }
            };
        });
    }

    @TsRestHandler(contract.settings.assetType.updateAssetType)
    async updateAssetType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.updateAssetType, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.AssetType, params.id)
            const assetType = await this.assetTypeService.updateAssetType((params.id), body.assetType);
             await this.assetTypeService.updateAssetTypeProperties((params.id), body.properties);
            if (!assetType) {
                return { 
                    status: 500 as const, 
                    body: { assetType: null, properties: [], message: 'Error updating asset type' }
                };
            }
            
            const { properties, ...assetTypeData } = assetType;
            return { 
                status: 200 as const, 
                body: null
            };
        });
    }

    @TsRestHandler(contract.settings.assetType.deleteAssetType)
    async deleteAssetType(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.deleteAssetType, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.AssetType, params.id)
            await this.assetTypeService.deleteAssetType(params.id);
            return { 
                status: 204 as const, 
                body: undefined 
            };
        });
    }

}
