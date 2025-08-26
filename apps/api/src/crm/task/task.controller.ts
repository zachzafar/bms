import { Controller, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { crmContract } from '@repo/api-contract';
import { TasksService } from './task.service'
import { TenantService } from 'src/tenant/tenant.service';
import * as schema from '@repo/api-contract';

@Controller()
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly tenantService: TenantService
  ) {}

  @TsRestHandler(crmContract.tasks.createTask)
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.tasks.createTask, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      // Validate user (assignee)
      await this.tasks.assertUserInTenant(tenantId, body.userId);
      // Validate contact if provided
      if (body.contactId) await this.tenantService.validateTenantAccess(tenantId, schema.Contact, body.contactId);
      const id = await this.tasks.create({ ...body, tenantId });
      return { status: 201, body: { message: 'task created', taskId: id } };
    });
  }

  @TsRestHandler(crmContract.tasks.listTasks)
  async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.tasks.listTasks, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const rows = await this.tasks.list(tenantId, query);
      return { status: 200, body: rows };
    });
  }

  @TsRestHandler(crmContract.tasks.getTask)
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.tasks.getTask, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Task, Number(params.id));
      const row = await this.tasks.get(Number(params.id));
      return row ? { status: 200, body: row } : { status: 404, body: undefined };
    });
  }

  @TsRestHandler(crmContract.tasks.updateTask)
  async update(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.tasks.updateTask, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Task, Number(params.id));
      if (body.userId) await this.tasks.assertUserInTenant(tenantId, body.userId);
      if (body.contactId) await this.tenantService.validateTenantAccess(tenantId, schema.Contact, body.contactId);
      await this.tasks.update(Number(params.id), body);
      return { status: 200, body: { message: 'task updated' } };
    });
  }

  @TsRestHandler(crmContract.tasks.deleteTask)
  async remove(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.tasks.deleteTask, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Task, Number(params.id));
      await this.tasks.remove(Number(params.id));
      return { status: 204, body: undefined };
    });
  }

  @TsRestHandler(crmContract.tasks.completeTask)
  async complete(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.tasks.completeTask, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Task, Number(params.id));
      await this.tasks.complete(Number(params.id));
      return { status: 200, body: { message: 'task completed' } };
    });
  }
}
