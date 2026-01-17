import { Controller, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { crmContract } from '@repo/api-contract';
import { FeedbackService } from './feedback.service';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from '@repo/api-contract';

@Controller()
export class FeedbackController {
  constructor(
    private readonly feedback: FeedbackService,
    private readonly tenantService: TenantService
  ) {}

  @TsRestHandler(crmContract.feedback.createFeedback)
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.feedback.createFeedback, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Contact, body.contactId);
      await this.tenantService.validateTenantAccess(tenantId, schema.Asset, body.assetId);
      const id = await this.feedback.create(body,tenantId );
      return { status: 201, body: { message: 'feedback created', feedbackId: id } };
    });
  }

  @TsRestHandler(crmContract.feedback.listFeedback)
  async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.feedback.listFeedback, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      const rows = await this.feedback.list(tenantId, query, page, pageSize);
      return { status: 200, body: rows };
    });
  }

  @TsRestHandler(crmContract.feedback.getFeedback)
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.feedback.getFeedback, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Feedback, (params.id));
      const row = await this.feedback.get((params.id));
      return row ? { status: 200, body: row } : { status: 404, body: undefined };
    });
  }

  @TsRestHandler(crmContract.feedback.updateFeedback)
  async update(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.feedback.updateFeedback, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Feedback, (params.id));
      await this.feedback.update((params.id), body);
      return { status: 200, body: { message: 'feedback updated' } };
    });
  }

  @TsRestHandler(crmContract.feedback.deleteFeedback)
  async remove(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.feedback.deleteFeedback, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Feedback, (params.id));
      await this.feedback.remove((params.id));
      return { status: 204, body: undefined };
    });
  }
}
