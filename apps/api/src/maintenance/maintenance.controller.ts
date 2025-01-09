import { Controller } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import {  tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';

@Controller('maintenance')
export class MaintenanceController {
    constructor(private maintenanceService: MaintenanceService) {

    }
        
    @TsRestHandler(contract.maintenance.createMaintenance)
    async createMaintenance(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.createMaintenance, async ({ body }) => {
            const maintenance = await this.maintenanceService.createMaintenance(body);
            if (!maintenance) {
                return { status: 500, body: { message: 'Error creating maintenance' } };
            }
            return { status: 201, body: maintenance };
        });
    }

    @TsRestHandler(contract.maintenance.getMaintenance)
    async getMaintenance(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.getMaintenance, async ({ params }) => {
            const maintenance = await this.maintenanceService.getMaintenance(params.id);
            if (!maintenance) {
                return { status: 404,  message: 'Maintenance not found'  };
            }
            return { status: 200, body:  maintenance  };
        });
    }

    @TsRestHandler(contract.maintenance.getMaintenances)
    async getMaintenances(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.getMaintenances, async () => {
            const maintenances = await this.maintenanceService.getMaintenances();
            return { status: 200, body:  maintenances  };
        });
    }

    @TsRestHandler(contract.maintenance.updateMaintenance)
    async updateMaintenance(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.updateMaintenance, async ({ body }) => {
            const  maintenance  = await this.maintenanceService.updateMaintenance(body);
            if (!maintenance ) {
                return { status: 500, body: { message: 'Error updating maintenance' } };
            }
            
            return { status: 200, body:  maintenance  };
        });
    }

    @TsRestHandler(contract.maintenance.deleteMaintenance)
    async deleteMaintenance(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.deleteMaintenance, async ({ params }) => {
            await this.maintenanceService.deleteMaintenance(params.id);
            return { status: 204, body: undefined};
        });
    }
}
