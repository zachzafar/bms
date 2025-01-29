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
        @Inject(forwardRef(() => BookingService)) private readonly bookingService: BookingService,
    ){ }

    async createMaintenance(body: InsertMaintenanceTask) {
        if (body.endDate) {
            const { available } = await this.checkAvailability(body.assetId, body.startDate, body.endDate);
            const { available: bookingAvailable } = await this.bookingService.checkAvailability(body.assetId, body.startDate, body.endDate);

            if (!available || !bookingAvailable) {
            throw new ConflictException('The asset is not available for the selected dates.');
         }
        }

        const result = await this.db.insert(schema.MaintenanceTask).values(body).$returningId().execute();
        return await this.getMaintenance(result[0].id);
    }
    async getMaintenance(id: number) {
        return await this.db.query.MaintenanceTask.findFirst({ where: (maintenance, { eq }) => eq(maintenance.id, id) });
    }

    async getMaintenancesByAssetId(assetId: bigint, period?: { startDate: Date; endDate: Date; }) {
        return await this.db.query.MaintenanceTask.findMany({ where: (maintenance, { eq, and, gte, lte,or }) =>  period ? and(or(gte(maintenance.startDate,period?.endDate),lte(maintenance.endDate,period?.startDate)),or(gte(maintenance.startDate,period?.endDate),lte(maintenance.endDate,period?.startDate))):  eq(maintenance.assetId, assetId) });

    }

    async getMaintenances() {
        return await this.db.query.MaintenanceTask.findMany();
    }
    async updateMaintenance(body: UpdateMaintenanceTask) {
        const existingMaintenance = await this.getMaintenance(body.id);
        if (!existingMaintenance) {
            throw new ConflictException('Maintenance not found');
        }
        if (body.endDate) {
            const isAvailable = await this.checkAvailability(body.assetId, body.startDate, body.endDate);
            if (!isAvailable) {
                throw new ConflictException('The asset is not available for the selected dates.');
            }
        }
        await this.db.update(schema.MaintenanceTask).set(body).where(eq(schema.MaintenanceTask.id, body.id)).execute();
        return await this.getMaintenance(body.id);
    }
    async deleteMaintenance(id: number) {
        this.db.delete(schema.MaintenanceTask).where(eq(schema.MaintenanceTask.id,id)).execute();
    }

    async checkAvailability(assetId: bigint, start: Date, end: Date) {
        const conflictingMaintenance =   await this.getMaintenancesByAssetId(assetId, { startDate: start, endDate: end });  
        return { available :  conflictingMaintenance.length === 0,  maintenance: conflictingMaintenance };    
    }
}
