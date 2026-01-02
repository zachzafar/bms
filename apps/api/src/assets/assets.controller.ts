import { BadRequestException, Controller, Headers, Logger, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from "@repo/api-contract"
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorators/public.decorator';
// import { RequireRead, RequireWrite, RequireDelete, RequirePermissionsDecorator } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class AssetsController {
    private readonly logger = new Logger(AssetsController.name);
    constructor(private assetService: AssetsService, private tenantService: TenantService) {

    }

    @TsRestHandler(contract.assets.getAssets)
    @Roles(PermissionScope.ASSETS_READ)
    async getAssets(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAssets, async ({ query }) => {
            this.logger.log('Get assets for tenant: ', headers['x-tenant-id'] || 'no tenant');
            const tenantId = headers['x-tenant-id'];

            const assets = await this.assetService.getAssets(query, tenantId);

            return { status: 200, body: assets };
        });
    }

    @TsRestHandler(contract.assets.getAsset)
    @Roles(PermissionScope.ASSETS_READ)
    async getAssetById(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAsset, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id);
            const asset = await this.assetService.getAssetById(params.id);

            if (!asset) {
                return { status: 404, message: 'Asset not found' };
            }

            return { status: 200, body: asset };
        });
    }

    @TsRestHandler(contract.assets.createAsset)
    @Roles(PermissionScope.ASSETS_WRITE)
    async createAsset(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.createAsset, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            this.logger.log(`Creating a new asset for tenant:${tenantId}`);

            const id = await this.assetService.createAsset(
                { ...body.asset, tenantId },
                body.tagIds // pass tags here
            );

            this.logger.log(`Created asset with id: ${id}`);
            return { status: 201, body: { id } };
        });
    }

    @TsRestHandler(contract.assets.updateAsset)
    @Roles(PermissionScope.ASSETS_WRITE)
    async updateAsset(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.updateAsset, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id)
            const asset = await this.assetService.updateAsset(params.id, body);

            if (!asset) {
                return { status: 500, body: { message: 'Error updating asset' } };
            }

            return { status: 200, body: asset };
        });
    }

    @TsRestHandler(contract.assets.deleteAsset)
    @Roles(PermissionScope.ASSETS_DELETE)
    async deleteAsset(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.deleteAsset, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id)
            const result = await this.assetService.deleteAsset(params.id);

            // if (!result) {
            //     return { status: 500, body: { message: 'Error deleting asset' } };
            // }

            return { status: 204, body: undefined };
        });
    }

    @TsRestHandler(contract.assets.addAssetProperties)
    @Roles(PermissionScope.ASSETS_PROPERTIES_MANAGE)
    async addAssetProperties(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.addAssetProperties, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id)
            const [{ id }] = await this.assetService.addPropertyValues(params.id, body.properties);

            if (id) {
                return { status: 200, body: { message: "sucessfully added properties" } };
            }

            return { status: 500, body: { message: 'Error adding properties to asset' } };

        })
    }

    @TsRestHandler(contract.assets.getAssetProperties)
    @Roles(PermissionScope.ASSETS_PROPERTIES_MANAGE)
    async getAssetProperties(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAssetProperties, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id)
            const properties = await this.assetService.getPropertyValues(params.id)

            if (!properties) {
                return { status: 500, body: { message: 'Error getting properties for asset' } };
            }

            return {
                status: 200,
                body: properties.map((property) => ({
                    ...property,
                    assetPropertyId: property.assetPropertyId,
                    assetId: property.assetId.toString() // Convert assetId to string to match expected type
                }))
            };
        });
    }

    @UseInterceptors(FileFieldsInterceptor([
        { name: 'images', maxCount: 10 }
    ]))
    @TsRestHandler(contract.assets.uploadAssetImages)
    @Roles(PermissionScope.ASSETS_PROPERTIES_MANAGE)
    async uploadAssetImages(
        @Headers() headers: any,
        @UploadedFiles() files: { images?: Express.Multer.File[] }
    ): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.uploadAssetImages, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id);

            if (!files.images || files.images.length === 0) {
                return { status: 400, body: { message: 'No images uploaded' } };
            }
            this.logger.log(`Uploading images for asset: ${params.id}`);
            // Convert the uploaded files to buffers
            const imageBuffers = files.images.map(file => file.buffer);

            await this.assetService.uploadAssetImages(tenantId, params.id, imageBuffers);

            return { status: 200, body: { message: 'Successfully uploaded images' } };
        });
    }

    @Public()
    @TsRestHandler(contract.assets.getAssetsWithDetails)
    @Roles(PermissionScope.ASSETS_READ)
    async getAssetsWithDetails(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAssetsWithDetails, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const assets = await this.assetService.getAssetsWithDetails(tenantId, query.assetTypes);

            const assetsReshaped = assets.map((asset) => {
                return {
                    id: asset.id,
                    name: asset.name,
                    description: asset.description ?? undefined,
                    images: asset.assetImages.map((image) => image.filePath),
                    properties: asset.propertyValues.map((property) => ({
                        id: property.assetProperty.id,
                        name: property.assetProperty.name,
                        value: property.value,
                    })),
                    tags: asset.tags?.map((tag) => ({
                        id: tag.id,
                        name: tag.name,
                    })) ?? [],
                };
            });

            return { status: 200, body: assetsReshaped };
        });
    }


    @TsRestHandler(contract.assets.deleteAssetImages)
    @Roles(PermissionScope.ASSETS_DELETE)
    async deleteAssetImage(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.deleteAssetImages, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id)
            const unsuccessfulDeletes = await this.assetService.deleteAssetImages(body.images, params.id);
            if (unsuccessfulDeletes.length > 0) {
                return { status: 200, body: { message: 'Error deleting some images', failedIds: unsuccessfulDeletes } };
            }
            return { status: 204, body: undefined };
        });
    }

    @TsRestHandler(contract.assets.getAssetImages)
    @Roles(PermissionScope.ASSETS_READ)
    async getAssetImages(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAssetImages, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id)
            const images = await this.assetService.getAssetImages(params.id);
            return { status: 200, body: images };
        });
    }

    @TsRestHandler(contract.assets.getAvailableAssets)
    @Roles(PermissionScope.ASSETS_READ)
    async getAvailableAssets(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        const tenantId = headers['x-tenant-id'];

        if (!tenantId) {
            throw new BadRequestException('Tenant ID is required');  
        }

        console.log('Tenant ID from authentication context:', tenantId);  // For debugging

        return tsRestHandler(contract.assets.getAvailableAssets, async ({ query }) => {
            const availableAssets = await this.assetService.getAvailableAssets(query.startDate, query.endDate, tenantId);

            console.log('Available Assets:', availableAssets);  // For debugging

            return { status: 200, body: availableAssets };
        });
    }



}
