import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq } from 'drizzle-orm';

@Injectable()
export class FormsService {
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ) {}

    async getForms(tenantId:string) {
        return this.db.query.BookingForm.findMany({where: (form, { eq }) => eq(form.tenantId, tenantId), with: { fields: true }});
    }

    async createForm(form: schema.InsertBookingForm, fields: Omit<schema.InsertBookingFormField,"formId">[]) {
        let formId: number = 0;
        try {
            await this.db.transaction(async (tx) => {
                const [{ id }] = await tx.insert(schema.BookingForm).values(form).$returningId().execute()
                await tx.insert(schema.BookingFormField).values(fields.map(field => ({ ...field, formId: BigInt(id) }))).execute();
                formId = id;
            });
        } catch (error) {
            throw new InternalServerErrorException(`Error creating form: ${error}`)
        } 

        return formId;
    }

    async getForm(id: number) {
        return await this.db.query.BookingForm.findFirst({ where: (form, { eq }) => eq(form.id, id), with: { fields: true } });
    }

    // async updateForm(id: number, form: schema.UpdateBookingForm,fields: Omit<schema.InsertBookingFormField,"formId">[]) {
    //     return await this.db.update(schema.BookingForm).set(form).where((form, { eq }) => eq(form.id, id)).execute();
    // }

    async deleteForm(id: number) {
        return await this.db.delete(schema.BookingForm).where(eq(schema.BookingForm.id, id)).execute();
    }
}
