import { Controller, InternalServerErrorException, Logger, NotFoundException, Headers } from '@nestjs/common';
import { FormsService } from './forms.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from "src/database-schema"

@Controller()
export class FormsController {
    private readonly logger = new Logger(FormsController.name);
    constructor(private formsService: FormsService,private TenantService: TenantService) {}

    @TsRestHandler(contract.settings.form.getForms)
    async getForms(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.getForms, async () => {
            const tenantId = headers['x-tenant-id']
            const forms = await this.formsService.getForms(tenantId);
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
            const { fields: rawFields, ...formData } = form;

            // Transform fields to match expected type
            const fields = rawFields.map(field => ({
                description: null,
                tenantId: formData.tenantId,
                id: Number(field.id),
                name: field.name,
                createdAt: new Date(),
                updatedAt: null
            }));
           
            return { status: 200, body: { form: formData, fields } };
        });
    }



}
