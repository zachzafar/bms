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
            return { status: 201, body: maintenance  };
        });
    }

    @TsRestHandler(contract.maintenance.getMaintenance)
    async getMaintenance(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.maintenance.getMaintenance, async ({ params }) => {
            const maintenance = await this.maintenanceService.getMaintenance(params.id);
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
