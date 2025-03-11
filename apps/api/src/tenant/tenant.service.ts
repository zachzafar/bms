import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';

@Injectable()
export class TenantService {
    constructor(@Inject(DrizzleAsyncProvider) private db:MySql2Database<typeof schema>){}

    async getTenantsDetails(tenantIds: string[]){
        return await this.db.query.Tenant.findMany({
            where: (tenant,{inArray}) => inArray(tenant.id,tenantIds)})
        
    }

    async tenantHasUser(tenantId: string, userId: string){
        const row = await this.db.query.TenantHasUsers.findFirst({
            where: (tu, {eq, and}) => and(eq(tu.tenantId,tenantId),eq(tu.userId,userId))
        })

        if (!row) {
            return false;
        }

        return true
    }


}
