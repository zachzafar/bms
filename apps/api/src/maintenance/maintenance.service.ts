import { ConflictException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { BookingService } from 'src/booking/booking.service';
import  type { InsertMaintenanceTask, UpdateMaintenanceTask } from '@repo/api-contract';
import { eq } from 'drizzle-orm';

@Injectable()
export class MaintenanceService {
    

    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
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

    async getMaintenances() {
        return await this.db.query.MaintenanceTask.findMany();
    }
    async updateMaintenance(body: UpdateMaintenanceTask) {
        const existingMaintenance = await this.getMaintenance(body.id);
        if (!existingMaintenance) {
            throw new ConflictException('Maintenance not found');
        }

        await this.db.update(schema.MaintenanceTask).set(body).where(eq(schema.MaintenanceTask.id, body.id)).execute();
        return await this.getMaintenance(body.id);
    }
    async deleteMaintenance(id: string) {
        this.db.delete(schema.MaintenanceTask).where(eq(schema.MaintenanceTask.id,id)).execute();
    }

    async checkAvailability(assetId: string) {
        const conflictingMaintenance =   await this.getMaintenancesByAssetId(assetId);  
        return { available :  conflictingMaintenance.length === 0,  maintenance: conflictingMaintenance };    
    }
}
