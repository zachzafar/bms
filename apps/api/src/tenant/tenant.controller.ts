import { Controller } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { TenantsService } from './tenant.service';


@Controller('tenant')
export class TenantController {
    constructor(private tenantService: TenantsService) {}

    @TsRestHandler(contract.tenants.create)
    async createTenant(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.tenants.create, async ({ body }) => {
            const { tenant, adminUser } = await this.tenantService.createTenantWithAdmin(body.tenant, body.adminUser);
            return { status: 201, body: { tenant, adminUser } };
        });
     
    }    
}
