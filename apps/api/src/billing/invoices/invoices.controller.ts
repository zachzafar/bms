import { Controller, Headers, Logger, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { billingContract } from '@repo/api-contract';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import { InvoicesService } from './invoices.service';
// import { RequireRead, RequireWrite } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { IncomingHttpHeaders } from 'http';

@Controller()
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);
  constructor(
    private readonly invoices: InvoicesService,
    private readonly tenantService: TenantService,
  ) { }

  @TsRestHandler(billingContract.createInvoice)
  @Roles(PermissionScope.BILLING_WRITE)
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.createInvoice, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];

      // Convert string -> proper types
      const customerId = Number(body.invoice.customerId);
      const issueDate = new Date(body.invoice.issueDate);
      const dueDate = new Date(body.invoice.dueDate);

      // Access validations
      await this.tenantService.validateTenantAccess(tenantId, schema.Customer, customerId);

      const id = await this.invoices.create(
        {
          ...body.invoice,
          customerId,
          issueDate,
          dueDate,
        },
        body.items,
        tenantId,
      );

      return { status: 201, body: { message: 'invoice created', invoiceId: id } };
    });
  }


  @TsRestHandler(billingContract.getInvoices)
  @Roles(PermissionScope.BILLING_READ)
  async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getInvoices, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const rows = await this.invoices.list(tenantId, query);
      return { status: 200, body: rows.map(row => ({
        ...row,
        dueDate: row.dueDate.toISOString(),
      })) };
    });
  }

  @TsRestHandler(billingContract.getInvoice)
  @Roles(PermissionScope.BILLING_READ)
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getInvoice, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, Number(params.id));
      const row = await this.invoices.get(Number(params.id));
      return row ? { status: 200, body: {
        ...row,
        dueDate: row.dueDate.toISOString(),
      } } : { status: 404, body: undefined };
    });
  }

  @TsRestHandler(billingContract.updateInvoice)
  @Roles(PermissionScope.BILLING_WRITE)
  async update(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.updateInvoice, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, Number(params.id));

      const normalizedBody = {
        ...body,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        customerId: body.customerId ? Number(body.customerId) : undefined,
      };

      // 👇 NEW: handle updated items if included
      const items = body.items?.map(item => ({
        ...item,
        invoiceId: Number(params.id),
      }));

      await this.invoices.update(Number(params.id), normalizedBody, items);

      return { status: 200, body: { message: 'invoice updated' } };
    });
  }


  @TsRestHandler(billingContract.deleteInvoice)
  @Roles(PermissionScope.BILLING_WRITE)
  async delete(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.deleteInvoice, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];

      // Validate tenant access
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, Number(params.id));

      // Call service delete method
      await this.invoices.delete(Number(params.id));

      return { status: 200, body: { message: `Invoice ${params.id} deleted successfully` } };
    });
  }




  @TsRestHandler(billingContract.generateInvoiceFromBooking)
  @Roles(PermissionScope.BILLING_WRITE)
  async generateInvoiceFromBooking(
    @Headers() headers: Record<string, string | string[]>
  ): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.generateInvoiceFromBooking, async ({ params, body }) => {
      // Ensure tenantId is a string
      const rawTenantId = headers['x-tenant-id'];
      const tenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId;

      if (!tenantId) {
        throw new Error('TenantId missing');
      }

      const invoiceId = await this.invoices.generateInvoiceFromBooking(tenantId, params.bookingId);

      return {
        status: 201,
        body: { message: 'invoice generated from booking', invoiceId },
      };
    });
  }
}
