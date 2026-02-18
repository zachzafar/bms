import { Controller, Headers, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { AddonService } from './addon.service';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(PermissionsGuard)
@Controller()
export class AddonController {
  constructor(private addonService: AddonService) {}

  @TsRestHandler(contract.addons.createAddon)
  @Roles(PermissionScope.RATES_WRITE)
  async createAddon(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.addons.createAddon, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      const addonId = await this.addonService.createAddon(body, tenantId);
      return { status: 201, body: { message: 'Add-on created successfully', addonId } };
    });
  }

  @TsRestHandler(contract.addons.getAddons)
  @Roles(PermissionScope.RATES_READ)
  async getAddons(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.addons.getAddons, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const result = await this.addonService.getAddons(tenantId, query.page, query.pageSize);
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.addons.getAddon)
  @Roles(PermissionScope.RATES_READ)
  async getAddon(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.addons.getAddon, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const addon = await this.addonService.getAddon(params.id, tenantId);
      return { status: 200, body: addon };
    });
  }

  @TsRestHandler(contract.addons.updateAddon)
  @Roles(PermissionScope.RATES_WRITE)
  async updateAddon(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.addons.updateAddon, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.addonService.updateAddon(params.id, body, tenantId);
      return { status: 200, body: { message: 'Add-on updated successfully' } };
    });
  }

  @TsRestHandler(contract.addons.deleteAddon)
  @Roles(PermissionScope.RATES_WRITE)
  async deleteAddon(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.addons.deleteAddon, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.addonService.deleteAddon(params.id, tenantId);
      return { status: 204, body: undefined };
    });
  }

  @Public()
  @TsRestHandler(contract.addons.getPublicAddons)
  async getPublicAddons(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.addons.getPublicAddons, async ({ params }) => {
      const addons = await this.addonService.getAddonsBySubdomain(params.subdomain);
      return { status: 200, body: addons };
    });
  }
}
