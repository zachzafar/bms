import { Controller, Logger, Headers } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';

@Controller()
export class TenantController {
    private readonly logger = new Logger(TenantController.name);
  constructor(private tenantService: TenantService) {}

  @TsRestHandler(contract.tenants.getTenantsDetails)
  @Roles(PermissionScope.TENANTS_READ)
  async getTenantsDetails(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.tenants.getTenantsDetails, async ({ query }) => {
      const tenants = await this.tenantService.getTenantsDetails(query.tenants);
      return { status: 200, body: tenants };
    });
  }

  @TsRestHandler(contract.tenants.getTenants)
  @Roles(PermissionScope.TENANTS_READ)
  async getTenants(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.tenants.getTenants, async () => {
      const tenants = await this.tenantService.getTenants();
      return { status: 200, body: tenants };
    });
  }

  @TsRestHandler(contract.tenants.update)
  @Roles(PermissionScope.TENANTS_READ)
  async updateTenant(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.tenants.update, async ({body}) => {
      const tenantId = headers['x-tenant-id'];
      const tenants = await this.tenantService.updateTenant(tenantId,body);
      return { status: 200, body: tenants };
    });
  }
}
