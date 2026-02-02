import { Controller, Logger, Headers, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AssetTypeService } from './asset-type.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from "@repo/api-contract"
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorators/public.decorator';

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
            const id = await this.assetTypeService.createAssetType({...body.assetType, tenantId}, body.properties, body.forms, body.tagIds);
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

            const { properties, forms, tags, ...assetTypeData } = assetType;
            return {
                status: 200 as const,
                body: { assetType: assetTypeData, properties, forms, tags }
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
            await this.assetTypeService.updateAssetTypeForms((params.id), body.forms);
            await this.assetTypeService.updateAssetTypeTags((params.id), body.tagIds || []);
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
                status: 200 as const,
                body: { message: 'Asset type deleted successfully' }
            };
        });
    }

    @UseInterceptors(FileInterceptor('image'))
    @TsRestHandler(contract.settings.assetType.uploadAssetTypeImage)
    async uploadAssetTypeImage(
        @Headers() headers: any,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.uploadAssetTypeImage, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            const assetType = await this.assetTypeService.getAssetType(params.id);

            // Validate tenant access before uploading
            await this.TenantService.validateTenantAccess(tenantId, schema.AssetType, assetType.id);

            if (!file) {
                return { status: 404, body: { message: 'No image provided' } };
            }

            const imagePath = await this.assetTypeService.uploadsetTypeImage(tenantId, params.id, file.buffer);
            return { status: 200, body: { message: 'Image uploaded successfully', imagePath } };
        });
    }

    @Public()
    @TsRestHandler(contract.settings.assetType.customerGetAssetTypes)
    async customerGetAssetTypes(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.customerGetAssetTypes, async ({ params, query }) => {
            const tenant = await this.TenantService.getTenantBySubdomain(params.subdomain);
            if (!tenant) {
                return {
                    status: 200,
                    body: { data: [], pagination: { page: 1, pageSize: 12, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }
                };
            }

            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 12;

            const assetTypes = await this.assetTypeService.getAssetTypesForCustomer(tenant.id, page, pageSize);
            return { status: 200, body: assetTypes };
        });
    }

    @Public()
    @TsRestHandler(contract.settings.assetType.customerGetAssetType)
    async customerGetAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.customerGetAssetType, async ({ params }) => {
            const tenant = await this.TenantService.getTenantBySubdomain(params.subdomain);
            if (!tenant) {
                return {
                    status: 200,
                    body: { id: 0, name: '', image: '', description: '' }
                };
            }

            const assetType = await this.assetTypeService.getAssetTypeForCustomer(tenant.id, params.id);
            if (!assetType) {
                return {
                    status: 200,
                    body: { id: 0, name: '', image: '', description: '' }
                };
            }

            return { status: 200, body: assetType };
        });
    }

}
