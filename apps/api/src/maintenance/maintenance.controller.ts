import { Controller, Header, Headers, Logger } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import {  tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from "@repo/api-contract"

@Controller()
export class MaintenanceController {
    private readonly logger = new Logger(MaintenanceController.name);
    constructor(private maintenanceService: MaintenanceService,private TenantService: TenantService) {

    }
        
    @TsRestHandler(contract.maintenance.createMaintenance)
    async createMaintenance(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.createMaintenance, async ({ body }) => {
            const tenantId = headers['x-tenant-id']
            await this.TenantService.validateTenantAccess(tenantId, schema.Asset, body.assetId)
            const id = await this.maintenanceService.createMaintenance(body);
            return { status: 201, body: {id} };
        });
    }

    @TsRestHandler(contract.maintenance.getMaintenance)
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
    async getMaintenances(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.getMaintenances, async () => {
            const tenantId = headers['x-tenant-id']
            this.logger.log(`Get maintenances for tenant: ${tenantId}`)
            const maintenances = await this.maintenanceService.getMaintenances(tenantId);
            
            return { status: 200, body:  maintenances.map(m => ({...m, asset: {...m.asset, assetTypeId: Number(m.asset.assetTypeId)}}))  };
        });
    }

    @TsRestHandler(contract.maintenance.updateMaintenance)
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
    async deleteMaintenance(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.deleteMaintenance, async ({ params }) => {
            const tenantId = headers['x-tenant-id']
            await this.maintenanceService.deleteMaintenance(params.id);
            return { status: 204, body: undefined};
        });
    }
}
