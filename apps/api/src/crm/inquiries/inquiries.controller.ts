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
      
      // Convert string dates to Date objects
      const inquiryData = {
        ...body,
        tenantId,
        inquiryDate: new Date(body.inquiryDate),
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
      };
      
      const id = await this.inquiries.createInquiry(inquiryData);
      return { status: 201, body: { message: 'inquiry created', inquiryId: (id) } };
    });
  }

  @TsRestHandler(crmContract.inquiries.listInquiries)
  async listInquiries(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.listInquiries, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      const rows = await this.inquiries.listInquiries(tenantId, {}, page, pageSize);

      return { status: 200, body: rows };
    });
  }

  @TsRestHandler(crmContract.inquiries.getInquiry)
  async getInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.getInquiry, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Inquiry, (params.id));
      const row = await this.inquiries.getInquiry((params.id));
      return row ? { status: 200, body: row } : { status: 404, body: undefined };
    });
  }

  @TsRestHandler(crmContract.inquiries.updateInquiry)
  async updateInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.updateInquiry, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Inquiry, (params.id));
      
      // Convert string dates to Date objects if provided
      const updateData = {
        ...body,
        ...(body.inquiryDate && { inquiryDate: new Date(body.inquiryDate) }),
        ...(body.followUpDate && { followUpDate: new Date(body.followUpDate) }),
      };

      const inquiryDate = updateData.inquiryDate ? new Date(updateData.inquiryDate) : undefined;
      const followUpDate = updateData.followUpDate ? new Date(updateData.followUpDate) : undefined;
      
      await this.inquiries.updateInquiry((params.id), {...updateData, contactId: updateData.contactId, inquiryDate, followUpDate });
      return { status: 200, body: { message: 'inquiry updated' } };
    });
  }

  @TsRestHandler(crmContract.inquiries.deleteInquiry)
  async deleteInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.deleteInquiry, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Inquiry, (params.id));
      await this.inquiries.deleteInquiry((params.id));
      return { status: 204, body: undefined };
    });
  }

  @TsRestHandler(crmContract.inquiries.assignInquiry)
  async assignInquiry(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.inquiries.assignInquiry, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Inquiry, (params.id));
      // (Optional) enforce user membership in tenant here.
      await this.inquiries.assignInquiry((params.id), body.assignedTo);
      return { status: 200, body: { message: 'inquiry assigned' } };
    });
  }
}
