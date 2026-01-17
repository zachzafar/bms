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
      const id = await this.brochures.create({ ...body, tenantId });
      return { status: 201, body: { message: 'brochure created', brochureId: id } };
    });
  }

  @TsRestHandler(crmContract.brochures.listBrochures)
  async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.listBrochures, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      const rows = await this.brochures.list(tenantId, page, pageSize);
      return { status: 200, body: rows };
    });
  }

  @TsRestHandler(crmContract.brochures.getBrochure)
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.getBrochure, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, (params.id));
      const row = await this.brochures.get((params.id));
      return row ? { status: 200, body: row } : { status: 404, body: undefined };
    });
  }

  @TsRestHandler(crmContract.brochures.deleteBrochure)
  async remove(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.deleteBrochure, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, (params.id));
      await this.brochures.remove((params.id));
      return { status: 204, body: undefined };
    });
  }

  @TsRestHandler(crmContract.brochures.addBrochureAssets)
  async addAssets(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.addBrochureAssets, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, (params.id));
      const added = await this.brochures.addAssets((params.id), body.assetIds);
      return { status: 200, body: { message: 'Assets added to brochure', added } };
    });
  }

  @TsRestHandler(crmContract.brochures.removeBrochureAsset)
  async removeAsset(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.brochures.removeBrochureAsset, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, (params.id));
      await this.brochures.removeAsset((params.id), params.assetId);
      return { status: 204, body: undefined };
    });
  }

  // @TsRestHandler(crmContract.brochures.listBrochureAssets)
  // async listAssets(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(crmContract.brochures.listBrochureAssets, async ({ params }) => {
  //     const tenantId = headers['x-tenant-id'];
  //     await this.tenantService.validateTenantAccess(tenantId, schema.Brochure, (params.id));
  //     const assets = await this.brochures.listAssets((params.id));
  //     return { status: 200, body: assets };
  //   });
  // }
}
