import { Controller, Logger } from '@nestjs/common';
import { SystemAdminService } from './system-admin.service';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin/admin.guard';

@UseGuards(AdminGuard)
@Controller()
export class SystemAdminController {
  private readonly logger = new Logger(SystemAdminController.name);

  constructor(private systemAdminService: SystemAdminService) {}

  // System Admin User Management
  @TsRestHandler(contract.systemAdmin.createSystemAdmin)
  async createSystemAdmin(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createSystemAdmin, async ({ body }) => {
      const result = await this.systemAdminService.createSystemAdmin(
        body.name,
        body.email,
        body.password
      );
      return { status: 201, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.getSystemAdmins)
  async getSystemAdmins(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getSystemAdmins, async () => {
      const admins = await this.systemAdminService.getSystemAdmins();
      return { status: 200, body: admins };
    });
  }

  // Tenant Management
  @TsRestHandler(contract.systemAdmin.createTenant)
  async createTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createTenant, async ({ body }) => {
      const result = await this.systemAdminService.createTenant(
        body.tenant,
        body.adminUser
      );
      return { status: 201, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.getTenants)

  async getTenants(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenants, async () => {
      const tenants = await this.systemAdminService.getTenants();
      return { status: 200, body: tenants };
    });
  }

  @TsRestHandler(contract.systemAdmin.getTenant)

  async getTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenant, async ({ params }) => {
      const result = await this.systemAdminService.getTenant(params.id);
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.updateTenant)
  async updateTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.updateTenant, async ({ params, body }) => {
      const result = await this.systemAdminService.updateTenant(
        params.id,
        body.tenant
      );
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.deleteTenant)
  async deleteTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteTenant, async ({ params }) => {
      const result = await this.systemAdminService.deleteTenant(params.id);
      return { status: 204, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.getTenantDetails)
  async getTenantDetails(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenantDetails, async ({ params }) => {
      const result = await this.systemAdminService.getTenant(params.id);
      return { status: 200, body: result };
    });
  }

  // Role Management
  @TsRestHandler(contract.systemAdmin.createTenantRole)
  async createTenantRole(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createTenantRole, async ({ params, body }) => {
      const result = await this.systemAdminService.createTenantRole(
        params.tenantId,
        body.name,
        body.description,
        body.permissions
      );
      return { status: 201, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.updateTenantRole)
  async updateTenantRole(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.updateTenantRole, async ({ params, body }) => {
      const result = await this.systemAdminService.updateTenantRole(
        params.tenantId,
        params.roleId,
        body.name,
        body.description,
        body.permissions
      );
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.deleteTenantRole)
  async deleteTenantRole(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteTenantRole, async ({ params }) => {
      const result = await this.systemAdminService.deleteTenantRole(
        params.tenantId,
        params.roleId
      );
      return { status: 204, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.getTenantRoles)
  async getTenantRoles(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenantRoles, async ({ params }) => {
      const result = await this.systemAdminService.getTenantRoles(params.tenantId);
      return { status: 200, body: result };
    });
  }

  // User Assignment to Tenants
  @TsRestHandler(contract.systemAdmin.assignUserToTenant)
  async assignUserToTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.assignUserToTenant, async ({ params, body }) => {
      const result = await this.systemAdminService.assignUserToTenant(
        params.tenantId,
        body.userId,
        body.roleIds,
        body.isAdmin
      );
      return { status: 201, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.removeUserFromTenant)
  async removeUserFromTenant(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.removeUserFromTenant, async ({ params }) => {
      const result = await this.systemAdminService.removeUserFromTenant(
        params.tenantId,
        params.userId
      );
      return { status: 204, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.getTenantUsers)
  async getTenantUsers(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenantUsers, async ({ params }) => {
      const result = await this.systemAdminService.getTenantUsers(params.tenantId);
      return { status: 200, body: result };
    });
  }

  // API Key Management
  @TsRestHandler(contract.systemAdmin.createTenantApiKey)
  async createTenantApiKey(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.createTenantApiKey, async ({ params, body }) => {
      const result = await this.systemAdminService.createTenantApiKey(
        params.tenantId,
        body.name,
        body.scopes
      );
      return { status: 201, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.getTenantApiKeys)
  async getTenantApiKeys(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getTenantApiKeys, async ({ params }) => {
      const result = await this.systemAdminService.getTenantApiKeys(params.tenantId);
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.deleteTenantApiKey)
  async deleteTenantApiKey(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.deleteTenantApiKey, async ({ params }) => {
      const result = await this.systemAdminService.deleteTenantApiKey(
        params.tenantId,
        params.keyId
      );
      return { status: 204, body: result };
    });
  }

  // System-wide operations
  @TsRestHandler(contract.systemAdmin.getSystemStats)
  async getSystemStats(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getSystemStats, async () => {
      const result = await this.systemAdminService.getSystemStats();
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.systemAdmin.getSystemLogs)
  async getSystemLogs(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.systemAdmin.getSystemLogs, async ({ query }) => {
      const result = await this.systemAdminService.getSystemLogs(
        query.level,
        query.startDate,
        query.endDate,
        query.limit,
        query.offset
      );
      return { status: 200, body: result };
    });
  }
}
