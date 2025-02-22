import { Inject, Injectable } from '@nestjs/common';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { eq } from 'drizzle-orm';
@Injectable()
export class PropertyService {
    constructor(
        @Inject(DrizzleAsyncProvider)
        private db: MySql2Database<typeof schema>
    ) {}


    async createProperty(data: schema.InsertAssetProperty) {
        const newPropertyId = await this.db.insert(schema.assetProperty).values(data).$returningId().execute();
        
        return newPropertyId[0].id
    }

    async getProperty(id: number) {
        return this.db.query.assetProperty.findFirst({ where: (property, { eq }) => eq(property.id, id) });
    }

    async getProperties() {
        return this.db.query.assetProperty.findMany();
    }

    async updateProperty(id: number, data: schema.UpdateAssetProperty) {
        await this.db.update(schema.assetProperty).set(data).where(eq(schema.assetProperty.id, id)).execute()
        return this.getProperty(id);
    }

    async deleteProperty(id: number) {
        return this.db.delete(schema.assetProperty).where(eq(schema.assetProperty.id, id));
    }
}
