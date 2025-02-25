import { Controller, Logger } from '@nestjs/common';
import { AssetTypeService } from './asset-type.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';

@Controller()
export class AssetTypeController {
    private readonly logger = new Logger(AssetTypeController.name);
    constructor(private assetTypeService: AssetTypeService) {}

    @TsRestHandler(contract.settings.assetType.getAssetTypes)
    async getAssetTypes(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.getAssetTypes, async () => {
            const assetTypes = await this.assetTypeService.getAssetTypes();
            return { status: 200, body: assetTypes };
        });
    }

    @TsRestHandler(contract.settings.assetType.createAssetType)
    async createAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.createAssetType, async ({ body }) => {
            const id = await this.assetTypeService.createAssetType(body.assetType,body.properties);
            this.logger.log(`Created asset type with id ${id}`);
            return { status: 201, body: { id } };
        });
    }

    @TsRestHandler(contract.settings.assetType.getAssetType)
    async getAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.getAssetType, async ({ params }) => {
            const assetType = await this.assetTypeService.getAssetType(Number(params.id));
            if (!assetType) {
                return { status: 404, body: { message: 'Asset type not found' }};
            }
            const { properties, ...assetTypeData } = assetType
    
           
            return { status: 200, body: { assetType: assetTypeData, properties} };
        });
    }

    @TsRestHandler(contract.settings.assetType.updateAssetType)
    async updateAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.updateAssetType, async ({ params, body }) => {
            const assetType = await this.assetTypeService.updateAssetType(params.id, body.assetType);
            if (!assetType) {
                return { status: 500, body: { message: 'Error updating asset type' } };
            }
         
            return { status: 200, body: null};
        });
    }

    @TsRestHandler(contract.settings.assetType.deleteAssetType)
    async deleteAssetType(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.assetType.deleteAssetType, async ({ params }) => {
            await this.assetTypeService.deleteAssetType(params.id);
            return { status: 204, body: { message: 'Asset type deleted' } };
        });
    }

}
