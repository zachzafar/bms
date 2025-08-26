import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq } from 'drizzle-orm';
import type { MySqlTableWithColumns,MySqlColumn } from "drizzle-orm/mysql-core"

type TableWithTenant = MySqlTableWithColumns<{
    name: string;
    schema: undefined;
    dialect: 'mysql';
    columns: {
        id: MySqlColumn;
        tenantId: MySqlColumn;
    };
}>;

@Injectable()
export class TenantService {
    private readonly logger = new Logger(TenantService.name);


    constructor(@Inject(DrizzleAsyncProvider) private db:MySql2Database<typeof schema>){}

    async getTenantsDetails(tenantIds: string[]){
        return await this.db.query.Tenant.findMany({
            where: (tenant,{inArray}) => inArray(tenant.id,tenantIds)})
        
    }

    async getTenants(){
        return await this.db.query.Tenant.findMany()
    }

    async tenantHasUser(tenantId: string, userId: string){
        const row = await this.db.query.TenantHasUsers.findFirst({
            where: (tu, {eq, and}) => and(eq(tu.tenantId,tenantId),eq(tu.userId,userId))
        })

        if (!row) {
            this.logger.warn(`Tenant ${tenantId} does not have user ${userId}`)
            return false;
        }
        this.logger.log(`Tenant ${tenantId} has user ${userId}`)
        return true
    }

    async validateTenantAccess(
        tenantId: string, 
        table: TableWithTenant, 
        id: number | string | bigint
    ) {
        
        const row = await this.db.select().from(table).where(and(eq(table.tenantId, tenantId), eq(table.id, id)))
        this.logger.log(`data available for tenant: ${JSON.stringify(row,(_,value) => typeof value === 'bigint' ? value.toString() : value)}`)
        
        if (row.length === 0) {
            throw new UnauthorizedException(`Not authorized to access this resource`)
        }
    }

}
