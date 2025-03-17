import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import  type { InsertMaintenanceTask, UpdateMaintenanceTask } from '@repo/api-contract';
import { eq } from 'drizzle-orm';

@Injectable()
export class MaintenanceService {
    

    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
        @Inject(forwardRef(() => TenantService)) private tenantService: TenantService
    ){ }

    async createMaintenance(body: InsertMaintenanceTask) {
        try{
           let result =  await this.db.insert(schema.MaintenanceTask).values(body).$returningId();
           return result[0].id;
        } catch (e) {
            throw new ConflictException('Error occured while creating maintenance');
        }
    }

    async getMaintenance(id: string) {
        return await this.db.query.MaintenanceTask.findFirst({ where: (maintenance, { eq }) => eq(maintenance.id, id) });
    }

    async getMaintenancesByAssetId(assetId: string) {
        return await this.db.query.MaintenanceTask.findMany({ where: (maintenance, { eq }) =>   eq(maintenance.assetId, assetId) });

    }

    async getMaintenances(tenantId: string) {

        const maintenances = await this.db.select()
            .from(schema.MaintenanceTask)
            .innerJoin(
                schema.Asset, 
                eq(schema.MaintenanceTask.assetId, schema.Asset.id)
            )
            .where(eq(schema.Asset.tenantId, tenantId));
        
        const results = maintenances.map((maintenance) => {
            return {
                ...maintenance.maintenance_tasks,
                asset: maintenance.assets,
            }
        });

        return results;
    }
    async updateMaintenance(body: UpdateMaintenanceTask,maintenanceId: string) {
        const existingMaintenance = await this.getMaintenance(maintenanceId);

        if (!existingMaintenance) {
            throw new NotFoundException('Maintenance not found');
        }
        try {
            await this.db.update(schema.MaintenanceTask).set(body).where(eq(schema.MaintenanceTask.id, maintenanceId)).execute();        
        } catch (e) {
            throw new ConflictException('Error occured while updating maintenance');
        }
    
    }
    async deleteMaintenance(id: string) {
        this.db.delete(schema.MaintenanceTask).where(eq(schema.MaintenanceTask.id,id)).execute();
    }

    async checkAvailability(assetId: string) {
        const conflictingMaintenance =   await this.getMaintenancesByAssetId(assetId);  
        return { available :  conflictingMaintenance.length === 0,  maintenance: conflictingMaintenance };    
    }
}
