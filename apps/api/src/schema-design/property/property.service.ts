import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
import { and, eq, isNull, sql } from 'drizzle-orm';
@Injectable()
export class PropertyService {
    constructor(
        @Inject(DrizzleAsyncProvider)
        private db: MySql2Database<typeof schema>
    ) {}


    async createProperty(data: schema.InsertAssetProperty) {
        const existing = await this.db.query.assetProperty.findFirst({
            where: (p, { and, eq }) => and(eq(p.name, data.name), eq(p.tenantId, data.tenantId)),
        });

        if (existing) {
            if (existing.deletedAt !== null) {
                await this.db
                    .update(schema.assetProperty)
                    .set({ deletedAt: null })
                    .where(eq(schema.assetProperty.id, existing.id));
                return existing.id;
            }
            throw new ConflictException(`A property with the name "${data.name}" already exists`);
        }

        const newPropertyId = await this.db.insert(schema.assetProperty).values(data).$returningId().execute();
        return newPropertyId[0].id;
    }

    async getProperty(id: number) {
        return this.db.query.assetProperty.findFirst({
            where: (property, { eq, and, isNull }) => and(eq(property.id, id), isNull(property.deletedAt)),
            with: { options: { orderBy: (o, { asc }) => [asc(o.displayOrder)] } },
        });
    }

    async getProperties(tenantId: string, page: number = 1, pageSize: number = 10) {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.assetProperty)
            .where(and(eq(schema.assetProperty.tenantId, tenantId),isNull(schema.assetProperty.deletedAt)))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const results = await this.db.query.assetProperty.findMany({
            where: (property, { eq, and, isNull }) => and(eq(property.tenantId, tenantId),isNull(property.deletedAt)),
            with: { options: { orderBy: (o, { asc }) => [asc(o.displayOrder)] } },
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

    async getPropertyOptions(id: number) {
        return this.db.query.AssetPropertyOption.findMany({
            where: (o, { eq }) => eq(o.assetPropertyId, id),
            orderBy: (o, { asc }) => [asc(o.displayOrder)],
        });
    }

    async setPropertyOptions(id: number, labels: string[]) {
        await this.db.delete(schema.AssetPropertyOption)
            .where(eq(schema.AssetPropertyOption.assetPropertyId, id));

        if (labels.length > 0) {
            await this.db.insert(schema.AssetPropertyOption).values(
                labels.map((label, index) => ({
                    assetPropertyId: id,
                    label,
                    displayOrder: index,
                }))
            );
        }

        return this.getPropertyOptions(id);
    }

    async updateProperty(id: number, data: schema.UpdateAssetProperty) {
        await this.db.update(schema.assetProperty).set(data).where(eq(schema.assetProperty.id, id)).execute()
        return this.getProperty(id);
    }

    async deleteProperty(id: number) {
        await this.db
            .delete(schema.assetProperty)
            .where(eq(schema.assetProperty.id, id));
    }
}
