import { Controller, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { crmContract } from '@repo/api-contract';
import { CommunicationsService } from './comunications.service';
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from '@repo/api-contract';

@Controller()
export class CommunicationsController {
  constructor(
    private readonly comms: CommunicationsService,
    private readonly tenantService: TenantService
  ) {}

  @TsRestHandler(crmContract.communications.createComm)
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.communications.createComm, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Contact, body.contactId);

      const id = await this.comms.create({ ...body, tenantId });
      return { status: 201, body: { message: 'communication created', communicationId: id } };
    });
  }

  @TsRestHandler(crmContract.communications.listComms)
  async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.communications.listComms, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const {page, pageSize, ...rest} = query
      const rows = await this.comms.list(tenantId, rest,page,pageSize);
      return { status: 200, body: {data: rows.data.map(row => ({...row, contactId: (row.contactId)})), pagination: rows.pagination} };
    });
  }

  @TsRestHandler(crmContract.communications.getComm)
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.communications.getComm, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.CommunicationLog, (params.id));
      const row = await this.comms.get((params.id));
      return row ? { status: 200, body: row } : { status: 404, body: undefined };
    });
  }

  @TsRestHandler(crmContract.communications.updateComm)
  async update(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.communications.updateComm, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.CommunicationLog, (params.id));
      await this.comms.update((params.id), body);
      return { status: 200, body: { message: 'communication updated' } };
    });
  }

  @TsRestHandler(crmContract.communications.deleteComm)
  async remove(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.communications.deleteComm, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.CommunicationLog, (params.id));
      await this.comms.remove((params.id));
      return { status: 204, body: undefined };
    });
  }
}