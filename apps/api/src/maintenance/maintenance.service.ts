import { ConflictException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import  type { InsertMaintenanceTask, UpdateMaintenanceTask } from '@repo/api-contract';
import { and, eq, inArray } from 'drizzle-orm';
import { ObjectStorageService } from 'src/object-storage/object-storage.service';

@Injectable()
export class MaintenanceService {
    private readonly logger = new Logger(MaintenanceService.name);

    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
        @Inject(forwardRef(() => TenantService)) private tenantService: TenantService,
        private objectStorageService: ObjectStorageService
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

    async uploadFiles(maintenance_id:string ,tenant:string,assetId:string,files: Buffer[]){
        const fileUrls =  await Promise.all(files.map(async (file) => {
            return await this.objectStorageService.uploadObject(file,'file',tenant,assetId)
        }))

        await this.db.insert(schema.File).values(fileUrls.map(url => ({
            fileUrl: url,
            maintenanceTaskId: maintenance_id,
        }))).execute()
    }

    async getFiles(maintenanceId: string) {
        const files = await this.db.query.File.findMany({where: (file,{eq}) => eq(file.maintenanceTaskId,maintenanceId)})
        const results = await Promise.allSettled(files.map( async (file) => {
            try {
                const url = await this.objectStorageService.getObjectUrl(file.fileUrl)
                return { success: true, url, file}  
            } catch (e) {
                return { success: false, error: e}
            }
        }))
        const filesWithSignedUrls:schema.SelectFile[] = []
        results.forEach((result) => {
            if (result.status === "rejected") {
                this.logger.error(result.reason)
            } else if (result.status === "fulfilled" && result.value.success) {
               if (result.value.url) {
                    filesWithSignedUrls.push({...result.value.file, fileUrl: result.value.url})
               }
            }
        })

        return filesWithSignedUrls;
    }

    async deleteFiles(fileIds: number[],maintenanceId: string) {
        const files = await this.db.query.File.findMany({where: (file,{eq,inArray}) => eq(file.maintenanceTaskId,maintenanceId) && inArray(file.id,fileIds)})
        const results = await Promise.allSettled(files.map(async (file) => {
            try {
                await this.objectStorageService.deleteObject(file.fileUrl);
                return { success: true, fileId: file.id}
            } catch (e) {
                return { success: false, fileId: file.id}
            }
            
        }));
        const successfulDeletes: number[] = []
        const unsuccessfulDeletes: number[] = []
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
                successfulDeletes.push(result.value.fileId)
            } else if (result.status === 'fulfilled' && result.value.success === false) {
                unsuccessfulDeletes.push(result.value.fileId)
            } 
        })
        
        await this.db.delete(schema.File).where(and(eq(schema.File.maintenanceTaskId,maintenanceId),inArray(schema.File.id,successfulDeletes))).execute();

        return unsuccessfulDeletes
    }
}
