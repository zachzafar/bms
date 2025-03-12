import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq } from 'drizzle-orm';
import type { InsertAsset, UpdateAsset } from '@repo/api-contract';

@Injectable()
export class AssetsService {
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ) {}

    async getAssets(query: any,tenantId: string) {
        return await this.db.query.Asset.findMany({where: (asset,{eq}) => eq(asset.tenantId,tenantId)})
    }

    async getAssetById(id: string) {
        return this.db.query.Asset.findFirst({ where: (asset, { eq }) => eq(asset.id, id) });
    }

    async createAsset(data: InsertAsset) {
        let assetTypeId = data.assetTypeId ? BigInt(data.assetTypeId) : undefined;
        try{
            const result = await this.db.insert(schema.Asset).values({...data, assetTypeId}).$returningId()
            return result[0].id
        } catch (e) {
            throw new InternalServerErrorException("Error occured while creating asset") 
        }
    }

    async updateAsset(id: string, data: UpdateAsset) {
        let assetTypeId = data.assetTypeId ? BigInt(data.assetTypeId) : undefined;
        await this.db.update(schema.Asset).set({...data, assetTypeId }).where(eq(schema.Asset.id, id)).execute()
        return this.getAssetById(id);
    }

    async deleteAsset(id: string) {
        return this.db.delete(schema.Asset).where(eq(schema.Asset.id, id));
    }

    async addPropertyValues(assetId: string, propertyValues: {propertyId: number,value:string}[]){
       return await this.db.insert(schema.AssetHasProperties).values(
            propertyValues.map(({propertyId,value}) => ({
                assetId,
                assetPropertyId: BigInt(propertyId),
                value
            }))
        ).$returningId().execute();
    }

    
}
