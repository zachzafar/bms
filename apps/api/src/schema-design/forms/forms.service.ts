import { Inject, Injectable, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq, sql, and } from 'drizzle-orm';

@Injectable()
export class FormsService {
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ) {}

    async getForms(tenantId:string, page: number = 1, pageSize: number = 10) {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.BookingForm)
            .where(and(eq(schema.BookingForm.tenantId, tenantId),isNull(schema.BookingForm.deletedAt)))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const results = await this.db.query.BookingForm.findMany({
            where: (form, { eq,and,isNull }) => and(eq(form.tenantId, tenantId),isNull(form.deletedAt)),
            with: { fields: true },
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

    async createForm(form: schema.InsertBookingForm, fields: Omit<schema.InsertBookingFormField,"formId">[]) {
        let formId: number = 0;
        try {
            await this.db.transaction(async (tx) => {
                const [{ id }] = await tx.insert(schema.BookingForm).values(form).$returningId().execute()
                await tx.insert(schema.BookingFormField).values(fields.map(field => ({ ...field, formId: (id) }))).execute();
                formId = id;
            });
        } catch (error) {
            throw new InternalServerErrorException(`Error creating form: ${error}`)
        } 

        return formId;
    }

    async getForm(id: number) {
        const form = await this.db.query.BookingForm.findFirst({
            where: (form, { eq }) => eq(form.id, id),
            with: { fields: true }
        });

        if (!form) {
            throw new NotFoundException(`Form with id ${id} not found`);
        }

        return form;
    }

    async updateForm(id: number, formData: schema.UpdateBookingForm, fields?: Omit<schema.InsertBookingFormField,"formId">[]) {
        try {
            await this.db.transaction(async (tx) => {
                // Update form
                await tx.update(schema.BookingForm)
                    .set(formData)
                    .where(eq(schema.BookingForm.id, id))
                    .execute();

                // If fields are provided, delete existing fields and insert new ones
                if (fields) {
                    await tx.delete(schema.BookingFormField)
                        .where(eq(schema.BookingFormField.formId, id))
                        .execute();

                    if (fields.length > 0) {
                        await tx.insert(schema.BookingFormField)
                            .values(fields.map(field => ({ ...field, formId: id })))
                            .execute();
                    }
                }
            });

            return { message: 'Form updated successfully' };
        } catch (error) {
            throw new InternalServerErrorException(`Error updating form: ${error}`);
        }
    }

    async deleteForm(id: number) {
        const form = await this.getForm(id);
        if (!form) {
            throw new NotFoundException(`Form with id ${id} not found`);
        }

        return await this.db
            .update(schema.BookingForm)
            .set({ deletedAt: new Date() })
            .where(eq(schema.BookingForm.id, id))
            .execute();
    }

    // Asset assignment methods
    async assignFormToAsset(formId: number, assetId: string) {
        // Check if form exists
        await this.getForm(formId);

        // Check if asset exists
        const asset = await this.db.query.Asset.findFirst({
            where: (asset, { eq }) => eq(asset.id, assetId)
        });

        if (!asset) {
            throw new NotFoundException(`Asset with id ${assetId} not found`);
        }

        // Check if assignment already exists
        const existing = await this.db.query.AssetHasBookingForms.findFirst({
            where: (rel, { and, eq }) => and(
                eq(rel.assetId, assetId),
                eq(rel.bookingFormId, formId)
            )
        });

        if (existing) {
            throw new ConflictException('Form is already assigned to this asset');
        }

        await this.db.insert(schema.AssetHasBookingForms).values({
            assetId,
            bookingFormId: formId
        }).execute();

        return { message: 'Form assigned to asset successfully' };
    }

    async unassignFormFromAsset(formId: number, assetId: string) {
        const result = await this.db.delete(schema.AssetHasBookingForms)
            .where(
                and(
                    eq(schema.AssetHasBookingForms.assetId, assetId),
                    eq(schema.AssetHasBookingForms.bookingFormId, formId)
                )
            )
            .execute();

        if (result[0].affectedRows === 0) {
            throw new NotFoundException('Assignment not found');
        }
    }

    // AssetType assignment methods
    async assignFormToAssetType(formId: number, assetTypeId: number) {
        // Check if form exists
        await this.getForm(formId);

        // Check if asset type exists
        const assetType = await this.db.query.AssetType.findFirst({
            where: (type, { eq }) => eq(type.id, assetTypeId)
        });

        if (!assetType) {
            throw new NotFoundException(`Asset type with id ${assetTypeId} not found`);
        }

        // Check if assignment already exists
        const existing = await this.db.query.AssetTypeHasBookingForms.findFirst({
            where: (rel, { and, eq }) => and(
                eq(rel.assetTypeId, assetTypeId),
                eq(rel.bookingFormId, formId)
            )
        });

        if (existing) {
            throw new ConflictException('Form is already assigned to this asset type');
        }

        await this.db.insert(schema.AssetTypeHasBookingForms).values({
            assetTypeId,
            bookingFormId: formId
        }).execute();

        return { message: 'Form assigned to asset type successfully' };
    }

    async unassignFormFromAssetType(formId: number, assetTypeId: number) {
        const result = await this.db.delete(schema.AssetTypeHasBookingForms)
            .where(
                and(
                    eq(schema.AssetTypeHasBookingForms.assetTypeId, assetTypeId),
                    eq(schema.AssetTypeHasBookingForms.bookingFormId, formId)
                )
            )
            .execute();

        if (result[0].affectedRows === 0) {
            throw new NotFoundException('Assignment not found');
        }
    }

    // Tag assignment methods
    async assignFormToTag(formId: number, tagId: number) {
        // Check if form exists
        await this.getForm(formId);

        // Check if tag exists
        const tag = await this.db.query.Tags.findFirst({
            where: (tag, { eq }) => eq(tag.id, tagId)
        });

        if (!tag) {
            throw new NotFoundException(`Tag with id ${tagId} not found`);
        }

        // Check if assignment already exists
        const existing = await this.db.query.TagHasBookingForms.findFirst({
            where: (rel, { and, eq }) => and(
                eq(rel.tagId, tagId),
                eq(rel.bookingFormId, formId)
            )
        });

        if (existing) {
            throw new ConflictException('Form is already assigned to this tag');
        }

        await this.db.insert(schema.TagHasBookingForms).values({
            tagId,
            bookingFormId: formId
        }).execute();

        return { message: 'Form assigned to tag successfully' };
    }

    async unassignFormFromTag(formId: number, tagId: number) {
        const result = await this.db.delete(schema.TagHasBookingForms)
            .where(
                and(
                    eq(schema.TagHasBookingForms.tagId, tagId),
                    eq(schema.TagHasBookingForms.bookingFormId, formId)
                )
            )
            .execute();

        if (result[0].affectedRows === 0) {
            throw new NotFoundException('Assignment not found');
        }
    }

    // Priority-based form resolution for an asset
    async getFormsForAsset(assetId: string) {
        // Get the asset with its type and tags
        const asset = await this.db.query.Asset.findFirst({
            where: (asset, { eq }) => eq(asset.id, assetId),
            with: {
                tags: {
                    with: {
                        tag: true
                    }
                }
            }
        });

        if (!asset) {
            throw new NotFoundException(`Asset with id ${assetId} not found`);
        }

        const formMap = new Map<number, { form: any; fields: any[]; assignmentType: 'direct' | 'assetType' | 'tag' }>();

        // 1. Get directly assigned forms (highest priority)
        const directForms = await this.db.query.AssetHasBookingForms.findMany({
            where: (rel, { eq }) => eq(rel.assetId, assetId),
            with: {
                bookingForm: {
                    with: {
                        fields: true
                    }
                }
            }
        });

        for (const rel of directForms) {
            if (rel.bookingForm && rel.bookingForm.fields) {
                formMap.set(rel.bookingFormId, {
                    form: rel.bookingForm,
                    fields: rel.bookingForm.fields,
                    assignmentType: 'direct'
                });
            }
        }

        // 2. Get forms from asset type (medium priority)
        if (asset.assetTypeId) {
            const assetTypeForms = await this.db.query.AssetTypeHasBookingForms.findMany({
                where: (rel, { eq }) => eq(rel.assetTypeId, asset.assetTypeId),
                with: {
                    bookingForm: {
                        with: {
                            fields: true
                        }
                    }
                }
            });

            for (const rel of assetTypeForms) {
                if (rel.bookingForm && rel.bookingForm.fields && !formMap.has(rel.bookingFormId)) {
                    formMap.set(rel.bookingFormId, {
                        form: rel.bookingForm,
                        fields: rel.bookingForm.fields,
                        assignmentType: 'assetType'
                    });
                }
            }
        }

        // 3. Get forms from tags (lowest priority)
        const tagIds = asset.tags.map(at => at.tag.id);
        if (tagIds.length > 0) {
            const tagForms = await this.db.query.TagHasBookingForms.findMany({
                where: (rel, { inArray }) => inArray(rel.tagId, tagIds),
                with: {
                    bookingForm: {
                        with: {
                            fields: true
                        }
                    }
                }
            });

            for (const rel of tagForms) {
                if (rel.bookingForm && rel.bookingForm.fields && !formMap.has(rel.bookingFormId)) {
                    formMap.set(rel.bookingFormId, {
                        form: rel.bookingForm,
                        fields: rel.bookingForm.fields,
                        assignmentType: 'tag'
                    });
                }
            }
        }

        return { forms: Array.from(formMap.values()) };
    }
}
