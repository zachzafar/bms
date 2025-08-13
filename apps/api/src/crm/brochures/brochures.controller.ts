import { Controller, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { crmContract } from '@repo/api-contract';
import { BrochuresService } from './brochures.service';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from '@repo/api-contract';

@Controller()
export class BrochuresController {
  constructor(
    private readonly brochures: BrochuresService,
    private readonly tenantService: TenantService
  ) {}

  @TsRestHandler(crmContract.brochures.createBrochure)
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.createBrochure, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Contact, body.contactId);
      const id = await this.brochures.create({ ...body, tenantId });
      return { status: 201, body: { message: 'brochure created', brochureId: id } };
    });
  }

  // @TsRestHandler(crmContract.brochures.listBrochures)
  // async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(crmContract.brochures.listBrochures, async ({ query }) => {
  //     const tenantId = headers['x-tenant-id'];
  //     const rows = await this.brochures.list(tenantId, query);
  //     return { status: 200, body: rows };
  //   });
  // }

  // @TsRestHandler(crmContract.brochures.getBrochure)
  // async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(crmContract.brochures.getBrochure, async ({ params }) => {
  //     const tenantId = headers['x-tenant-id'];
  //     await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, Number(params.id));
  //     const row = await this.brochures.get(Number(params.id));
  //     return row ? { status: 200, body: row } : { status: 404, body: undefined };
  //   });
  // }

  @TsRestHandler(crmContract.brochures.deleteBrochure)
  async remove(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.deleteBrochure, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, Number(params.id));
      await this.brochures.remove(Number(params.id));
      return { status: 204, body: undefined };
    });
  }

  @TsRestHandler(crmContract.brochures.addBrochureAssets)
  async addAssets(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.addBrochureAssets, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, Number(params.id));
      for (const assetId of body.assetIds) {
        await this.tenantService.validateTenantAccess(tenantId, schema.Asset, assetId);
      }
      const added = await this.brochures.addAssets(Number(params.id), body.assetIds);
      return { status: 200, body: { message: 'assets added', added } };
    });
  }

  @TsRestHandler(crmContract.brochures.removeBrochureAsset)
  async removeAsset(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.removeBrochureAsset, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, Number(params.id));
      await this.tenantService.validateTenantAccess(tenantId, schema.Asset, params.assetId);
      await this.brochures.removeAsset(Number(params.id), params.assetId);
      return { status: 204, body: undefined };
    });
  }

  // @TsRestHandler(crmContract.brochures.listBrochureAssets)
  // async listAssets(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(crmContract.brochures.listBrochureAssets, async ({ params }) => {
  //     const tenantId = headers['x-tenant-id'];
  //     await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, Number(params.id));
  //     const rows = await this.brochures.listAssets(Number(params.id));
  //     return { status: 200, body: rows };
  //   });
  // }
}
