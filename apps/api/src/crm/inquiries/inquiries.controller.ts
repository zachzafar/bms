import { Controller, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { crmContract } from '@repo/api-contract';
import { InquiriesService } from './inquiries.service';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from '@repo/api-contract';

@Controller()
export class InquiriesController {
  constructor(
    private readonly inquiries: InquiriesService,
    private readonly tenantService: TenantService
  ) {}

  @TsRestHandler(crmContract.inquiries.createInquiry)
  async createInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.createInquiry, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      // Validate tenant access to contact & asset before insert
      await this.tenantService.validateTenantAccess(tenantId, schema.Contact, body.contactId);
      await this.tenantService.validateTenantAccess(tenantId, schema.Asset, body.assetId);
      const id = await this.inquiries.createInquiry({ ...body, tenantId });
      return { status: 201, body: { message: 'inquiry created', inquiryId: id } };
    });
  }

  @TsRestHandler(crmContract.inquiries.listInquiries)
  async listInquiries(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.listInquiries, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const rows = await this.inquiries.listInquiries(tenantId, query);
      return { status: 200, body: rows };
    });
  }

  @TsRestHandler(crmContract.inquiries.getInquiry)
  async getInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.getInquiry, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Inquiry, Number(params.id));
      const row = await this.inquiries.getInquiry(Number(params.id));
      return row ? { status: 200, body: row } : { status: 404, body: undefined };
    });
  }

  @TsRestHandler(crmContract.inquiries.updateInquiry)
  async updateInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.updateInquiry, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Inquiry, Number(params.id));
      await this.inquiries.updateInquiry(Number(params.id), body);
      return { status: 200, body: { message: 'inquiry updated' } };
    });
  }

  @TsRestHandler(crmContract.inquiries.deleteInquiry)
  async deleteInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.deleteInquiry, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Inquiry, Number(params.id));
      await this.inquiries.deleteInquiry(Number(params.id));
      return { status: 204, body: undefined };
    });
  }

  @TsRestHandler(crmContract.inquiries.assignInquiry)
  async assignInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.assignInquiry, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Inquiry, Number(params.id));
      // (Optional) enforce user membership in tenant here.
      await this.inquiries.assignInquiry(Number(params.id), body.assignedTo);
      return { status: 200, body: { message: 'inquiry assigned' } };
    });
  }
}
