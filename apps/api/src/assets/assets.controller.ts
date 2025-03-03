import { Controller, Logger } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';

@Controller()
export class AssetsController {
    private readonly logger = new Logger(AssetsController.name);
    constructor(private assetService: AssetsService) {
        
    }

    @TsRestHandler(contract.assets.getAssets)
    async getAssets(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAssets, async ({ query }) => {
            const assets = (await this.assetService.getAssets(query)).map((asset) => {
                let assetTypeId = asset.assetTypeId? Number(asset.assetTypeId): undefined;
                return {...asset, assetTypeId};
            });
            return { status: 200, body: assets };
        });
    }

    @TsRestHandler(contract.assets.getAsset)
    async getAssetById(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.getAsset, async ({ params }) => {
            const asset = await this.assetService.getAssetById(params.id);
            if (!asset) {
                return { status: 404, message: 'Asset not found' };
            }
            let assetTypeId = asset.assetTypeId ? Number(asset.assetTypeId): undefined;

            return { status: 200, body: {...asset, assetTypeId} };
        });
    }

    @TsRestHandler(contract.assets.createAsset)
    async createAsset(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.createAsset, async ({ body }) => {
            this.logger.log(`Creating a new asset for tenant:${body.tenant}`);
             const id = await this.assetService.createAsset({...body.asset,tenantId: body.tenant});
             this.logger.log(`Created asset with id: ${id}`);
            return { status: 201, body: { id } };
        });
    }

    @TsRestHandler(contract.assets.updateAsset)
    async updateAsset(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.updateAsset, async ({ params, body }) => {
            const asset = await this.assetService.updateAsset(params.id, body);

            if (!asset) {
                return { status: 500, body: { message: 'Error updating asset' } };
            }

            return { status: 200, body: {...asset, assetTypeId: Number(asset.assetTypeId)} };
        });
    }

    @TsRestHandler(contract.assets.deleteAsset)
    async deleteAsset(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.assets.deleteAsset, async ({ params }) => {
            const result = await this.assetService.deleteAsset(params.id);

            if (!result) {
                return { status: 500, body: { message: 'Error deleting asset' } };
            }

            return { status: 204 };
        });
    }
}
