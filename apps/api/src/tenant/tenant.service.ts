import { ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq, sql } from 'drizzle-orm';
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

    async getTenants(page: number = 1, pageSize: number = 10){
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.Tenant)
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const results = await this.db.query.Tenant.findMany({
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

    async updateTenant(tenantId: string, tenantData: schema.UpdateTenant) {
        try {
          this.logger.log(`Updating tenant ${tenantId} with data: ${JSON.stringify(tenantData)}`);

          const existingTenant = await this.db.query.Tenant.findFirst({
            where: (tenant, { eq }) => eq(tenant.id, tenantId)
          });

          if (!existingTenant) {
            throw new NotFoundException('Tenant not found');
          }

          // Filter out undefined values
          

          this.logger.log(`Filtered update data: ${JSON.stringify(tenantData)}`);

          if (Object.keys(tenantData).length === 0) {
            throw new Error('No valid fields to update');
          }

          const { subdomain } = tenantData;
          // Check subdomain uniqueness if updating
          if (subdomain && subdomain !== existingTenant.subdomain) {
            const duplicateTenant = await this.db.query.Tenant.findFirst({
              where: (tenant, { eq }) => eq(tenant.subdomain, subdomain)
            });

            if (duplicateTenant) {
              throw new ConflictException('Tenant with this subdomain already exists');
            }
          }

          await this.db.update(schema.Tenant)
            .set(tenantData)
            .where(eq(schema.Tenant.id, tenantId));

          this.logger.log(`Updated tenant: ${tenantId}`);
          return { message: 'Tenant updated successfully' };
        } catch (error: any) {
          this.logger.error(`Failed to update tenant: ${error.message}`);
          throw error;
        }
      }

}
