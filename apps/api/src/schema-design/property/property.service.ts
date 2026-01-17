import { Inject, Injectable } from '@nestjs/common';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { eq, sql } from 'drizzle-orm';
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

    async getProperties(tenantId: string, page: number = 1, pageSize: number = 10) {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.assetProperty)
            .where(eq(schema.assetProperty.tenantId, tenantId))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const results = await this.db.query.assetProperty.findMany({
            where: (property, { eq }) => eq(property.tenantId, tenantId),
            limit: pageSize,
            offset: offset,
        });

        const paginationData = {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1,
        };

        return {
            data: results,
            pagination: paginationData,
        };
    }

    async updateProperty(id: number, data: schema.UpdateAssetProperty) {
        await this.db.update(schema.assetProperty).set(data).where(eq(schema.assetProperty.id, id)).execute()
        return this.getProperty(id);
    }

    async deleteProperty(id: number) {
  await this.db.transaction(async (tx) => {
    await tx.delete(schema.AssetHasProperties).where(eq(schema.AssetHasProperties.assetPropertyId, id));
    await tx.delete(schema.assetProperty).where(eq(schema.assetProperty.id, id));
  });
}
}
