import { Controller, Logger } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';

@Controller()
export class TenantController {
    private readonly logger = new Logger(TenantController.name);
  constructor(private tenantService: TenantService) {}

  @TsRestHandler(contract.tenants.getTenantsDetails)
  async getTenantsDetails(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.tenants.getTenantsDetails, async ({ query }) => {
      const tenants = await this.tenantService.getTenantsDetails(query.tenants);
      return { status: 200, body: tenants };
    });
  }
}
