import { Inject, Injectable } from '@nestjs/common';
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
        private readonly bookingService: BookingService,
    ){ }

    async createMaintenance(body: InsertMaintenanceTask) {
        
    }
    async getMaintenance(id: any) {
        throw new Error('Method not implemented.');
    }

    async getMaintenancesByAssetId(assetId: number, period?: { startDate: Date; endDate: Date; }) {
        return await this.db.query.MaintenanceTask.findMany({ where: (maintenance, { eq, and, gte, lte,or }) =>  period ? and(or(gte(maintenance.startDate,period?.endDate),lte(maintenance.endDate,period?.startDate)),or(gte(maintenance.startDate,period?.endDate),lte(maintenance.endDate,period?.startDate))):  eq(maintenance.assetId, assetId) });

    }

    async getMaintenances() {
        return await this.db.query.MaintenanceTask.findMany();
    }
    async updateMaintenance(body: UpdateMaintenanceTask) {
        throw new Error('Method not implemented.');
    }
    async deleteMaintenance(id: number) {
        this.db.delete(schema.MaintenanceTask).where(eq(schema.MaintenanceTask.id,id)).execute();
    }

    async checkAvailability(assetId: number, start: Date, end: Date) {
        const conflictingMaintenance =   await this.getMaintenancesByAssetId(assetId, { startDate: start, endDate: end });  
        return { available :  conflictingMaintenance.length === 0,  maintenance: conflictingMaintenance };    
    }
}
