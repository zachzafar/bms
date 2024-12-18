import { Inject, Injectable } from '@nestjs/common';
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

    async getAssets(query: any) {
        return this.db.query.Asset.findMany();
    }

    async getAssetById(id: number) {
        return this.db.query.Asset.findFirst({ where: (asset, { eq }) => eq(asset.id, id) });
    }

    async createAsset(data: InsertAsset) {
        const newAssetId = await this.db.insert(schema.Asset).values(data).$returningId().execute();
        
        return this.getAssetById(newAssetId[0].id);
    }

    async updateAsset(id: number, data: UpdateAsset) {
        await this.db.update(schema.Asset).set(data).where(eq(schema.Asset.id, id)).execute()
        return this.getAssetById(id);
    }

    async deleteAsset(id: number) {
        return this.db.delete(schema.Asset).where(eq(schema.Asset.id, id));
    }
}
