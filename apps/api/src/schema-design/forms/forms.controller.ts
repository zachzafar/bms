import { Controller, InternalServerErrorException, Logger, NotFoundException, Headers } from '@nestjs/common';
import { FormsService } from './forms.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from "@repo/api-contract"

@Controller()
export class FormsController {
    private readonly logger = new Logger(FormsController.name);
    constructor(private formsService: FormsService,private TenantService: TenantService) {}

    @TsRestHandler(contract.settings.form.getForms)
    async getForms(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.getForms, async ({ query }) => {
            const tenantId = headers['x-tenant-id']
            const page = query.page ? Number(query.page) : 1;
            const pageSize = query.pageSize ? Number(query.pageSize) : 10;

            const forms = await this.formsService.getForms(tenantId, page, pageSize);
            return { status: 200, body: forms };
        });
    }

    @TsRestHandler(contract.settings.form.createForm)
    async createForm(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.createForm, async ({ body }) => {
            const tenantId = headers['x-tenant-id']
            const id = await this.formsService.createForm({...body.form, tenantId}, body.fields);
            if (id == 0)
            throw new InternalServerErrorException('Failed to create form');
            this.logger.log(`Created form with id: ${id}`);
            return { status: 201, body: { id } };
        });

        
    }

    @TsRestHandler(contract.settings.form.getForm)
    async getForm(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.getForm, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId,schema.BookingForm ,params.id)
            const form = await this.formsService.getForm(params.id);
            if (!form) {
                throw new NotFoundException('Form not found')
            }
            const { fields, ...formData } = form;

            return { status: 200, body: { form: formData, fields } };
        });
    }

    @TsRestHandler(contract.settings.form.updateForm)
    async updateForm(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.updateForm, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.BookingForm, params.id)

            const result = await this.formsService.updateForm(params.id, body.form, body.fields);
            return { status: 200, body: result };
        });
    }

    @TsRestHandler(contract.settings.form.deleteForm)
    async deleteForm(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.deleteForm, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.BookingForm, params.id)

            await this.formsService.deleteForm(params.id);
            return { status: 204, body: undefined };
        });
    }

    // Asset assignment endpoints
    @TsRestHandler(contract.settings.form.assignFormToAsset)
    async assignFormToAsset(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.assignFormToAsset, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.BookingForm, params.formId)
            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, params.assetId)

            const result = await this.formsService.assignFormToAsset(params.formId, params.assetId);
            return { status: 201, body: result };
        });
    }

    @TsRestHandler(contract.settings.form.unassignFormFromAsset)
    async unassignFormFromAsset(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.unassignFormFromAsset, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.BookingForm, params.formId)
            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, params.assetId)

            await this.formsService.unassignFormFromAsset(params.formId, params.assetId);
            return { status: 204, body: undefined };
        });
    }

    // AssetType assignment endpoints
    @TsRestHandler(contract.settings.form.assignFormToAssetType)
    async assignFormToAssetType(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.assignFormToAssetType, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.BookingForm, params.formId)
            await this.TenantService.validateTenantAccess(tenantId, schema.AssetType, params.assetTypeId)

            const result = await this.formsService.assignFormToAssetType(params.formId, params.assetTypeId);
            return { status: 201, body: result };
        });
    }

    @TsRestHandler(contract.settings.form.unassignFormFromAssetType)
    async unassignFormFromAssetType(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.unassignFormFromAssetType, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.BookingForm, params.formId)
            await this.TenantService.validateTenantAccess(tenantId, schema.AssetType, params.assetTypeId)

            await this.formsService.unassignFormFromAssetType(params.formId, params.assetTypeId);
            return { status: 204, body: undefined };
        });
    }

    // Tag assignment endpoints
    @TsRestHandler(contract.settings.form.assignFormToTag)
    async assignFormToTag(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.assignFormToTag, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.BookingForm, params.formId)
            await this.TenantService.validateTenantAccess(tenantId, schema.Tags, params.tagId)

            const result = await this.formsService.assignFormToTag(params.formId, params.tagId);
            return { status: 201, body: result };
        });
    }

    @TsRestHandler(contract.settings.form.unassignFormFromTag)
    async unassignFormFromTag(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.unassignFormFromTag, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.BookingForm, params.formId)
            await this.TenantService.validateTenantAccess(tenantId, schema.Tags, params.tagId)

            await this.formsService.unassignFormFromTag(params.formId, params.tagId);
            return { status: 204, body: undefined };
        });
    }

    // Get forms for an asset (with priority resolution)
    @TsRestHandler(contract.settings.form.getFormsForAsset)
    async getFormsForAsset(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.getFormsForAsset, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, params.assetId)

            const result = await this.formsService.getFormsForAsset(params.assetId);
            return { status: 200, body: result };
        });
    }

}
