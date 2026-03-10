import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import type { InsertAssetType, UpdateAssetType } from '@repo/api-contract';
import { and, eq, sql, isNull } from 'drizzle-orm';
import { ObjectStorageService } from 'src/object-storage/object-storage.service';

@Injectable()
export class AssetTypeService {
    private readonly logger = new Logger(AssetTypeService.name);

    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
        private readonly objectStorageService: ObjectStorageService,
    ) { }

    async getAssetTypes(tenantId: string, page: number = 1, pageSize: number = 10) {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.AssetType)
            .where(and(eq(schema.AssetType.tenantId, tenantId), isNull(schema.AssetType.deletedAt)))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const results = await this.db.query.AssetType.findMany({
            where: (assetType, { eq }) => and(eq(assetType.tenantId, tenantId), isNull(assetType.deletedAt)),
            limit: pageSize,
            offset: offset,
        });

        const assetTypesWithSignedUrls = await Promise.all(
            results.map(async (assetType) => {
                if (assetType.image) {
                    try {
                        const signedUrl = await this.objectStorageService.getObjectUrl(assetType.image);
                        return { ...assetType, image: signedUrl };
                    } catch (error) {
                        this.logger.warn(`Failed to get signed URL for tag ${assetType.id}: ${error}`);
                        return { ...assetType, image: null };
                    }
                }
                return assetType;
            })
        );

        const paginationData = {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1,
        };

        return {
            data: assetTypesWithSignedUrls,
            pagination: paginationData,
        };
    }

    async getAssetType(id: number) {
        const assetType = await this.db.query.AssetType.findFirst({
            where: (assetType, { eq, and, isNull }) => and(eq(assetType.id, id), isNull(assetType.deletedAt)),
            with: {
                assetTypeHasProperties: { with: { assetProperty: true } },
                bookingForms: { with: { bookingForm: true } },
                tags: { with: { tag: true } }
            }
        });

        if (!assetType) {
            throw new NotFoundException('Asset type not found');
        }
        const {
            description,
            tenantId,
            name,
            slug,
            createdAt,
            updatedAt,
            assetTypeHasProperties,
            bookingForms,
            tags,
            image
        } = assetType || {};

        return {
            description,
            tenantId,
            id,
            name,
            slug,
            image,
            createdAt,
            updatedAt,
            properties: assetTypeHasProperties?.map((relation) => relation.assetProperty) ?? [],
            forms: bookingForms?.map((relation) => relation.bookingForm) ?? [],
            tags: tags?.map((relation) => relation.tag) ?? []
        }
    }

    async createAssetType(data: InsertAssetType, properties: number[], forms: number[], tagIds?: number[]) {
        this.logger.log(`Creating asset type "${data.name}" for tenant ${data.tenantId} with ${properties.length} propert(ies), ${forms.length} form(s)`);
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
        this.logger.log(`Updating asset type ${id}`);
        await this.db.update(schema.AssetType).set(data).where(eq(schema.AssetType.id, id)).execute()
        return this.getAssetType(id);
    }

    async deleteAssetType(id: number) {
        this.logger.log(`Soft-deleting asset type ${id}`);
        return this.db
            .update(schema.AssetType)
            .set({ deletedAt: new Date() })
            .where(eq(schema.AssetType.id, id));
    }

    async updateAssetTypeProperties(id: number, properties: number[]) {
        this.logger.log(`Updating properties for asset type ${id}: [${properties.join(', ')}]`);
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
        this.logger.log(`Updating forms for asset type ${id}: [${forms.join(', ')}]`);
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
        this.logger.log(`Updating tags for asset type ${id}: [${tagIds.join(', ')}]`);
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

    async checkAssetTypeSlug(tenantId: string, slug: string, excludeId?: number): Promise<boolean> {
        const conditions: any[] = [
            eq(schema.AssetType.tenantId, tenantId),
            eq(schema.AssetType.slug, slug),
            isNull(schema.AssetType.deletedAt),
        ];
        if (excludeId !== undefined) {
            conditions.push(sql`${schema.AssetType.id} != ${excludeId}`);
        }
        const existing = await this.db.query.AssetType.findFirst({
            where: (_, { and }) => and(...conditions),
            columns: { id: true },
        });
        return existing === undefined;
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

    async getAssetTypesForCustomer(tenantId: string, page: number = 1, pageSize: number = 12) {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.AssetType)
            .where(and(eq(schema.AssetType.tenantId, tenantId), isNull(schema.AssetType.deletedAt)))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const results = await this.db.query.AssetType.findMany({
            where: (assetType, { eq, and, isNull }) => and(
                eq(assetType.tenantId, tenantId),
                isNull(assetType.deletedAt)
            ),
            limit: pageSize,
            offset: offset,
        });

        const assetTypesWithSignedUrls = await Promise.all(
            results.map(async (assetType) => {
                let imageUrl = '';
                if (assetType.image) {
                    try {
                        imageUrl = await this.objectStorageService.getObjectUrl(assetType.image);
                    } catch (error) {
                        this.logger.warn(`Failed to get signed URL for asset type ${assetType.id}: ${error}`);
                    }
                }
                return {
                    id: assetType.id,
                    slug: assetType.slug ?? null,
                    name: assetType.name,
                    image: imageUrl,
                    description: assetType.description || '',
                };
            })
        );

        const paginationData = {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1,
        };

        return {
            data: assetTypesWithSignedUrls,
            pagination: paginationData,
        };
    }

    async getAssetTypeForCustomer(tenantId: string, idOrSlug: string) {
        const numericId = Number(idOrSlug);
        const assetType = await this.db.query.AssetType.findFirst({
            where: (at, { eq, and, isNull, or }) => and(
                eq(at.tenantId, tenantId),
                isNull(at.deletedAt),
                or(
                    eq(at.slug, idOrSlug),
                    ...(!isNaN(numericId) ? [eq(at.id, numericId)] : [])
                )
            ),
            with: {
                propertyValues: { with: { assetProperty: true } },
            },
        });

        if (!assetType) {
            return null;
        }

        let imageUrl = '';
        if (assetType.image) {
            try {
                imageUrl = await this.objectStorageService.getObjectUrl(assetType.image);
            } catch (error) {
                this.logger.warn(`Failed to get signed URL for asset type ${assetType.id}: ${error}`);
            }
        }

        return {
            id: assetType.id,
            name: assetType.name,
            image: imageUrl,
            description: assetType.description || '',
            propertyValues: (assetType.propertyValues ?? []).map(pv => ({
                id: pv.id,
                assetTypeId: pv.assetTypeId,
                assetPropertyId: pv.assetPropertyId,
                value: pv.value,
                property: {
                    name: pv.assetProperty.name,
                    propertyType: pv.assetProperty.propertyType,
                },
            })),
        };
    }

    async getAssetTypePropertyValues(assetTypeId: number) {
        const rows = await this.db.query.AssetTypePropertyValues.findMany({
            where: (pv, { eq }) => eq(pv.assetTypeId, assetTypeId),
            with: { assetProperty: true },
        });
        return rows.map(pv => ({
            id: pv.id,
            assetTypeId: pv.assetTypeId,
            assetPropertyId: pv.assetPropertyId,
            value: pv.value,
            property: {
                name: pv.assetProperty.name,
                propertyType: pv.assetProperty.propertyType,
            },
        }));
    }

    async setAssetTypePropertyValues(assetTypeId: number, values: { propertyId: number; value: string }[]) {
        this.logger.log(`Setting ${values.length} property value(s) for asset type ${assetTypeId}`);
        await this.db.delete(schema.AssetTypePropertyValues)
            .where(eq(schema.AssetTypePropertyValues.assetTypeId, assetTypeId));
        if (values.length > 0) {
            await this.db.insert(schema.AssetTypePropertyValues).values(
                values.map(v => ({
                    assetTypeId,
                    assetPropertyId: v.propertyId,
                    value: v.value,
                }))
            );
        }
    }

    async uploadsetTypeImage(tenantId: string, assetTypeId: number, imageBuffer: Buffer): Promise<string> {
        this.logger.log(`Uploading image for asset type ${assetTypeId} tenant ${tenantId}`);
        const assetType = await this.getAssetType(assetTypeId);
        if (!assetType) {
            throw new NotFoundException('Tag not found');
        }

        // Delete old image if exists
        if (assetType.image) {
            try {
                await this.objectStorageService.deleteObject(assetType.image);
            } catch (error) {
                this.logger.warn(`Failed to delete old tag image: ${error}`);
            }
        }

        // Upload new image - using 'tags' as the asset folder for organization
        const imagePath = await this.objectStorageService.uploadObject(
            imageBuffer,
            'image',
            tenantId,
            `assetType/${assetType.id}`
        );

        // Update tag with new image path
        await this.db
            .update(schema.AssetType)
            .set({ image: imagePath })
            .where(eq(schema.AssetType.id, assetType.id));

        return imagePath;
    }
}
