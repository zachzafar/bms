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

            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;

            const assets = await this.assetService.getAssets(tenantId,query, page, pageSize);

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
                return { status: 404, body: undefined };
            }

            const { bookingForms, ...assetData } = asset;

            return {
                status: 200,
                body: {
                    ...assetData,
                    bookingForms: bookingForms?.map((bf) => ({
                        id: bf.bookingForm.id,
                        name: bf.bookingForm.name,
                    })) ?? []
                }
            };
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
                body.formIds // pass forms here
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
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.id);

            try {
                await this.assetService.deleteAsset(params.id);
                return { status: 204, body: undefined };
            } catch (error: any) {
                if (error instanceof BadRequestException) {
                    return { status: 400, body: { message: error.message } };
                }
                throw error;
            }
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
            const { data, pagination} = await this.assetService.getAssetsWithDetails(tenantId, query.assetTypes);

            const assets = data.map((asset) => {
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
                    tags: [],
                };
            });

            return { status: 200, body: {data: assets, pagination} };
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

    @Public()
    @TsRestHandler(contract.assets.getAssetsBySubdomain)
    async getAssetsBySubdomain(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAssetsBySubdomain, async ({ params, query }) => {
            const { subdomain } = params;
            const { page = 1, pageSize = 10 } = query;
            const assets = await this.assetService.getAssetsBySubdomain(subdomain, page, pageSize);

            return { status: 200, body: assets };
        });
    }

    @Public()
    @TsRestHandler(contract.assets.getAssetDetailsBySubdomain)
    async getAssetDetailsBySubdomain(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAssetDetailsBySubdomain, async ({ params }) => {
            const { subdomain, slug } = params;
            const asset = await this.assetService.getAssetDetailsBySubdomain(subdomain, slug);

            if (!asset) {
                return { status: 404, body: undefined };
            }

            return { status: 200, body: asset };
        });
    }

    @TsRestHandler(contract.assets.updateAssetIsAvailable)
    async updateAssetIsAvailable(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.updateAssetIsAvailable, async ({ params, body }) => {
            const { id } = params
            const { available } = body
            const message = await this.assetService.updateAssetIsAvailable(available,id)
            return { status: 200, body: message }
        });
    }

    @TsRestHandler(contract.assets.setAssetLocation)
    @Roles(PermissionScope.ASSETS_WRITE)
    async setAssetLocation(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.setAssetLocation, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.assetId);
            const id = await this.assetService.setAssetLocation(params.assetId, body);
            return { status: 200, body: { id } };
        });
    }

    @TsRestHandler(contract.assets.getAssetLocation)
    @Roles(PermissionScope.ASSETS_READ)
    async getAssetLocation(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAssetLocation, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.assetId);
            const location = await this.assetService.getAssetLocation(params.assetId);
            return { status: 200, body: location ?? null };
        });
    }

    @TsRestHandler(contract.assets.deleteAssetLocation)
    @Roles(PermissionScope.ASSETS_WRITE)
    async deleteAssetLocation(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.deleteAssetLocation, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.assetId);
            await this.assetService.deleteAssetLocation(params.assetId);
            return { status: 200, body: { success: true } };
        });
    }

    @TsRestHandler(contract.assets.checkAssetSlug)
    @Roles(PermissionScope.ASSETS_READ)
    async checkAssetSlug(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.checkAssetSlug, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const available = await this.assetService.checkAssetSlug(tenantId, query.slug, query.excludeId);
            return { status: 200, body: { available } };
        });
    }

}
