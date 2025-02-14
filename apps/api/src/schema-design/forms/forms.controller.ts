import { Controller } from '@nestjs/common';
import { FormsService } from './forms.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';

@Controller('forms')
export class FormsController {
    constructor(private formsService: FormsService) {}

    @TsRestHandler(contract.settings.form.getForms)
    async getForms(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.settings.form.getForms, async () => {
            const forms = await this.formsService.getForms();
            return { status: 200, body: forms };
        });
    }

    // @TsRestHandler(contract.settings.form.createForm)
    // async createForm(): Promise<ReturnType<typeof tsRestHandler>> {
    //     return tsRestHandler(contract.settings.form.createForm, async ({ body }) => {
    //         const id = await this.formsService.createForm(body.form, body.fields);

    //         return { status: 201, body: { id } };
    //     });
    // }

    // @TsRestHandler(contract.settings.form.getForm)
    // async getForm(): Promise<ReturnType<typeof tsRestHandler>> {
    //     return tsRestHandler(contract.settings.form.getForm, async ({ params }) => {
    //         const form = await this.formsService.getForm(params.id);
    //         if (!form) {
    //             return { status: 404, body: { message: 'Form not found' }};
    //         }
    //         const { fields, ...formData } = form

           
    //         return { status: 200, body: { form: formData, fields} };
    //     });
    // }



}
