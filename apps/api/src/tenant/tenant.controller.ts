import { Controller, Logger, Headers } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { Public } from 'src/auth/decorators/public.decorator';

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
    return tsRestHandler(contract.tenants.update, async ({body, params}) => {
      const tenantId = params.id; // Use the path param, not the header
      this.logger.log(`Update tenant request - tenantId: ${tenantId}, body: ${JSON.stringify(body)}`);
      const tenants = await this.tenantService.updateTenant(tenantId, body);
      return { status: 200, body: tenants };
    });
  }

  @Public()
  @TsRestHandler(contract.tenants.getTenantBySubdomain)
  async getTenantBySubdomain(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.tenants.getTenantBySubdomain, async ({ params }) => {
      try {
        const tenant = await this.tenantService.getTenantBySubdomain(params.subdomain);
        return {
          status: 200,
          body: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            enableAutomaticConfirmation: tenant.enableAutomaticConfirmation,
            booksByTagOnCustomerPage: tenant.booksByTagOnCustomerPage,
          }
        };
      } catch (error: any) {
        return { status: 404, body: { message: error.message || 'Tenant not found' } };
      }
    });
  }
}
