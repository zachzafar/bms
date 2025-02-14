import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';

@Injectable()
export class FormsService {
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ) {}

    async getForms() {
        return this.db.query.BookingForm.findMany();
    }

    async createForm(form: any, fields: any) {
        return 1;
    }

    async getForm(id: number) {
        return null;
    }
}
