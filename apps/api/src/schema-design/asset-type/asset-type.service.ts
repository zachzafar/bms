import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import type { InsertAssetType, UpdateAssetType } from '@repo/api-contract';
import type { InsertAssetProperty, UpdateAssetProperty } from '@repo/api-contract';
import { eq } from 'drizzle-orm';

@Injectable()
export class AssetTypeService {
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ){}
    
    async getAssetTypes() {
        return this.db.query.AssetType.findMany();
    }

    async getAssetType(id: number) {
        return this.db.query.AssetType.findFirst({ where: (assetType, { eq }) => eq(assetType.id, id) });
    }

    async createAssetType(data: InsertAssetType) {
        const newAssetTypeId = await this.db.insert(schema.AssetType).values(data).$returningId().execute();
        
        return this.getAssetType(newAssetTypeId[0].id);
    }

    async updateAssetType(id: number, data: UpdateAssetType) {
        await this.db.update(schema.AssetType).set(data).where(eq(schema.AssetType.id, id)).execute()
        return this.getAssetType(id);
    }

    async deleteAssetType(id: number) {
        return this.db.delete(schema.AssetType).where(eq(schema.AssetType.id, id));
    }

    async createProperty(data: InsertAssetProperty) {
        const newPropertyId = await this.db.insert(schema.assetProperty).values(data).$returningId().execute();
        
        return this.getProperty(newPropertyId[0].id);
    }

    async getProperty(id: number) {
        return this.db.query.assetProperty.findFirst({ where: (property, { eq }) => eq(property.id, id) });
    }

    async getProperties() {
        return this.db.query.assetProperty.findMany();
    }

    async updateProperty(id: number, data: UpdateAssetProperty) {
        await this.db.update(schema.assetProperty).set(data).where(eq(schema.assetProperty.id, id)).execute()
        return this.getProperty(id);
    }

    

}
