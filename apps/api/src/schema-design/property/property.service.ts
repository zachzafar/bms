import { Inject, Injectable } from '@nestjs/common';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { MySql2Database } from '@repo/drizzle';
import * as schema from '@repo/drizzle/src/schema';
@Injectable()
export class PropertyService {
    constructor(
        @Inject(DrizzleAsyncProvider)
        private db: MySql2Database<typeof schema>
    ) {}

   

}
