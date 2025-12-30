import { Controller, Header, Headers, Logger, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import {  tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from "@repo/api-contract"
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class MaintenanceController {
    private readonly logger = new Logger(MaintenanceController.name);
    constructor(private maintenanceService: MaintenanceService,private TenantService: TenantService) {

    }
        
    @TsRestHandler(contract.maintenance.createMaintenance)
    @Roles(PermissionScope.MAINTENANCE_WRITE)
    async createMaintenance(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.createMaintenance, async ({ body }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, body.assetId)
            const id = await this.maintenanceService.createMaintenance(body);
            return { status: 201, body: {id} };
        });
    }

    @TsRestHandler(contract.maintenance.getMaintenance)
    @Roles(PermissionScope.MAINTENANCE_READ)
    async getMaintenance(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.getMaintenance, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            const maintenance = await this.maintenanceService.getMaintenance(params.id);
            
            if (!maintenance) {
                return { status: 404,  message: 'Maintenance not found'  };
            }

            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, maintenance.assetId)

            return { status: 200, body:  maintenance  };
        });
    }

    @TsRestHandler(contract.maintenance.getMaintenances)
    @Roles(PermissionScope.MAINTENANCE_READ)
    async getMaintenances(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.getMaintenances, async () => {
            const tenantId = headers['x-tenant-id']
            this.logger.log(`Get maintenances for tenant: ${tenantId}`)
            const maintenances = await this.maintenanceService.getMaintenances(tenantId);
            
            return { status: 200, body:  maintenances.map(m => ({...m, asset: {...m.asset, assetTypeId: Number(m.asset.assetTypeId)}}))  };
        });
    }

    @TsRestHandler(contract.maintenance.updateMaintenance)
    @Roles(PermissionScope.MAINTENANCE_WRITE)
    async updateMaintenance(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.updateMaintenance, async ({ body, params }) => {
            const tenantId = headers['x-tenant-id']
            const existingMaintenance = await this.maintenanceService.getMaintenance(params.id);
            if (!existingMaintenance) {
                return { status: 404, body: { message: 'Maintenance not found' } };
            }
            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, existingMaintenance.assetId)
            await this.maintenanceService.updateMaintenance(body, params.id);

            
            return { status: 200, body:  "successfully updated maintenance"  };
        });
    }

    

    @TsRestHandler(contract.maintenance.deleteMaintenance)
    @Roles(PermissionScope.MAINTENANCE_DELETE)
    async deleteMaintenance(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.deleteMaintenance, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.maintenanceService.deleteMaintenance(params.id);
            return { status: 204, body: undefined};
        });
    }

    @UseInterceptors(FileFieldsInterceptor([
        { name: 'files', maxCount: 10 }
    ]))
    @TsRestHandler(contract.maintenance.uploadMaintenanceFiles)
    @Roles(PermissionScope.MAINTENANCE_FILES_MANAGE)
    async uploadMaintenanceFiles(
        @Headers() headers:any,
        @UploadedFiles() files: { files?: Express.Multer.File[] },
    ):Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.uploadMaintenanceFiles, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            const existingMaintenance = await this.maintenanceService.getMaintenance(params.id);
            if (!existingMaintenance) {
                return { status: 404, body: { message: 'Maintenance not found' } };
            }

            if (!files.files || files.files.length === 0) {
                return { status: 400, body: { message: 'No files uploaded' } };
            }

            const fileBuffers = files.files.map(file => file.buffer);
            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, existingMaintenance.assetId)
            await this.maintenanceService.uploadFiles(existingMaintenance.id,tenantId,existingMaintenance.assetId,fileBuffers);
            return { status: 200, body:  { message: "successfully uploaded files" } };
        });
    }

    @TsRestHandler(contract.maintenance.getMaintenanceFiles)
    @Roles(PermissionScope.MAINTENANCE_FILES_MANAGE)
    async getMaintenanceFiles(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.getMaintenanceFiles, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            const existingMaintenance = await this.maintenanceService.getMaintenance(params.id);
            if (!existingMaintenance) {
                return { status: 404, body: { message: 'Maintenance not found' } };
            }

            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, existingMaintenance.assetId)
            const files = await this.maintenanceService.getFiles(params.id);
            return { status: 200, body:  files  };
        });
    }

    @TsRestHandler(contract.maintenance.deleteMaintenanceFiles)
    @Roles(PermissionScope.MAINTENANCE_FILES_MANAGE)
    async deleteMaintenanceFiles(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.deleteMaintenanceFiles, async ({ params,body }) => {
            const tenantId = headers['x-tenant-id']
            const existingMaintenance = await this.maintenanceService.getMaintenance(params.id);
            if (!existingMaintenance) {
                return { status: 404, body: { message: 'Maintenance not found' } };
            }
            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, existingMaintenance.assetId)
            await this.maintenanceService.deleteFiles(body.files,params.id);
            return { status: 204, body:  undefined  };
        });
    }
}
