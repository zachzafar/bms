import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import type { InsertAssetType, UpdateAssetType } from '@repo/api-contract';
import { and, eq, sql, isNull } from 'drizzle-orm';

@Injectable()
export class AssetTypeService {
    private readonly logger = new Logger(AssetTypeService.name);

    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ){}
    
    async getAssetTypes(tenantId: string, page: number = 1, pageSize: number = 10) {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.AssetType)
            .where(and(eq(schema.AssetType.tenantId, tenantId),isNull(schema.AssetType.deletedAt)))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const results = await this.db.query.AssetType.findMany({
            where: (assetType, { eq }) => and(eq(assetType.tenantId, tenantId),isNull(assetType.deletedAt)),
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

    async getAssetType(id: number) {
        const assetType = await this.db.query.AssetType.findFirst({
            where: (assetType, { eq, and, isNull }) => and(eq(assetType.id, id), isNull(assetType.deletedAt)),
            with: {
                assetTypeHasProperties: { with: { assetProperty: true}},
                bookingForms: { with: { bookingForm: true }},
                tags: { with: { tag: true }}
            }
        });

        if (!assetType) {
            throw new NotFoundException('Asset type not found');
        }
        const {
            description,
            tenantId,
            name,
            createdAt,
            updatedAt,
            assetTypeHasProperties,
            bookingForms,
            tags,
          } = assetType || {};

        return {
            description,
            tenantId,
            id,
            name,
            createdAt,
            updatedAt,
            properties: assetTypeHasProperties?.map((relation) => relation.assetProperty) ?? [],
            forms: bookingForms?.map((relation) => relation.bookingForm) ?? [],
            tags: tags?.map((relation) => relation.tag) ?? []
        }
    }

    async createAssetType(data: InsertAssetType, properties: number[], forms: number[], tagIds?: number[]) {
        try {
            const result = await this.db.transaction(async (tx) => {
                const [{ id }] = await tx
                    .insert(schema.AssetType)
                    .values(data)
                    .$returningId();

                if (properties.length > 0) {
                    await tx
                        .insert(schema.AssetTypeHasProperties)
                        .values(
                            properties.map(property => ({
                                assetTypeId: id,
                                assetPropertyId: property
                            }))
                        );
                }

                if (forms.length > 0) {
                    await tx
                        .insert(schema.AssetTypeHasBookingForms)
                        .values(
                            forms.map(formId => ({
                                assetTypeId: id,
                                bookingFormId: formId
                            }))
                        );
                }

                if (tagIds && tagIds.length > 0) {
                    await tx
                        .insert(schema.AssetTypeHasTags)
                        .values(
                            tagIds.map(tagId => ({
                                assetTypeId: id,
                                tagId
                            }))
                        );
                }

                return id;
            });

            return result;
        } catch (error) {
            this.logger.error(`Failed to create asset type: ${error}`);
            throw new InternalServerErrorException(
                `Failed to create asset type: ${error}`
            );
        }
    }

    async updateAssetType(id: number, data: UpdateAssetType) {
        await this.db.update(schema.AssetType).set(data).where(eq(schema.AssetType.id, id)).execute()
        return this.getAssetType(id);
    }

    async deleteAssetType(id: number) {
        return this.db
            .update(schema.AssetType)
            .set({ deletedAt: new Date() })
            .where(eq(schema.AssetType.id, id));
    }

    async updateAssetTypeProperties(id: number, properties: number[]) {
        await this.db.delete(schema.AssetTypeHasProperties).where(eq(schema.AssetTypeHasProperties.assetTypeId, id)).execute()
        if (properties.length > 0) {
            await this.db
                .insert(schema.AssetTypeHasProperties)
                .values(
                    properties.map(property => ({
                        assetTypeId: id,
                        assetPropertyId: property
                    }))
                );
        }
    }

    async updateAssetTypeForms(id: number, forms: number[]) {
        await this.db.delete(schema.AssetTypeHasBookingForms).where(eq(schema.AssetTypeHasBookingForms.assetTypeId, id)).execute()
        if (forms.length > 0) {
            await this.db
                .insert(schema.AssetTypeHasBookingForms)
                .values(
                    forms.map(formId => ({
                        assetTypeId: id,
                        bookingFormId: formId
                    }))
                );
        }
    }

    async updateAssetTypeTags(id: number, tagIds: number[]) {
        await this.db.delete(schema.AssetTypeHasTags).where(eq(schema.AssetTypeHasTags.assetTypeId, id)).execute()
        if (tagIds.length > 0) {
            await this.db
                .insert(schema.AssetTypeHasTags)
                .values(
                    tagIds.map(tagId => ({
                        assetTypeId: id,
                        tagId
                    }))
                );
        }
    }

    async getTagsForAssetType(assetTypeId: number) {
        const tags = await this.db.query.AssetTypeHasTags.findMany({
            where: (aht, { eq }) => eq(aht.assetTypeId, assetTypeId),
            with: {
                tag: true,
            },
        });
        return tags.map(t => t.tag);
    }
}
