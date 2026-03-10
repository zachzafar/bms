import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq, sql, and, isNull } from 'drizzle-orm';

@Injectable()
export class FormsService {
    private readonly logger = new Logger(FormsService.name);

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
        this.logger.log(`Creating form "${form.name}" for tenant ${form.tenantId} with ${fields.length} field(s)`);
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
            where: (form, { eq, and, isNull }) => and(eq(form.id, id), isNull(form.deletedAt)),
            with: { fields: true }
        });

        if (!form) {
            throw new NotFoundException(`Form with id ${id} not found`);
        }

        return form;
    }

    async updateForm(id: number, formData: schema.UpdateBookingForm, fields?: Omit<schema.InsertBookingFormField,"formId">[]) {
        this.logger.log(`Updating form ${id}${fields ? ` with ${fields.length} field(s)` : ''}`);
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
        this.logger.log(`Soft-deleting form ${id}`);
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
        this.logger.log(`Assigning form ${formId} to asset ${assetId}`);
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
        this.logger.log(`Unassigning form ${formId} from asset ${assetId}`);
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
        this.logger.log(`Assigning form ${formId} to asset type ${assetTypeId}`);
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
        this.logger.log(`Unassigning form ${formId} from asset type ${assetTypeId}`);
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

    // Priority-based form resolution for an asset
    async getFormsForAsset(assetId: string) {
        // Get the asset with its type and tags
        const asset = await this.db.query.Asset.findFirst({
            where: (asset, { eq }) => eq(asset.id, assetId),
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


        return { forms: Array.from(formMap.values()) };
    }

    // Get forms for an asset type (for public booking)
    async getFormsForAssetType(assetTypeId: number) {
        // Check if asset type exists
        const assetType = await this.db.query.AssetType.findFirst({
            where: (type, { eq }) => eq(type.id, assetTypeId)
        });

        if (!assetType) {
            throw new NotFoundException(`Asset type with id ${assetTypeId} not found`);
        }

        // Get all forms assigned to this asset type
        const assetTypeForms = await this.db.query.AssetTypeHasBookingForms.findMany({
            where: (rel, { eq }) => eq(rel.assetTypeId, assetTypeId),
            with: {
                bookingForm: {
                    with: {
                        fields: true
                    }
                }
            }
        });

        const forms = assetTypeForms
            .filter(rel => rel.bookingForm && rel.bookingForm.fields)
            .map(rel => ({
                form: rel.bookingForm,
                fields: rel.bookingForm.fields
            }));

        return { forms };
    }
}
