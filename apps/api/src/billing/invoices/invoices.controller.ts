import { Controller, Headers, Logger } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { billingContract } from '@repo/api-contract';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import { InvoicesService } from './invoices.service';

@Controller()
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);
  constructor(
    private readonly invoices: InvoicesService,
    private readonly tenantService: TenantService,
  ) {}

  @TsRestHandler(billingContract.createInvoice)
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.createInvoice, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];

      // Access validations
      await this.tenantService.validateTenantAccess(tenantId, schema.Customer, body.invoice.customerId);
      // Optional: if booking is present, validate its asset belongs to tenant (service handles it too)

      const id = await this.invoices.create({
        ...body.invoice,
        tenantId,
      }, body.items);

      return { status: 201, body: { message: 'invoice created', invoiceId: id } };
    });
  }

  @TsRestHandler(billingContract.getInvoices)
  async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getInvoices, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const rows = await this.invoices.list(tenantId, query);
      return { status: 200, body: rows };
    });
  }

  @TsRestHandler(billingContract.getInvoice)
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getInvoice, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, Number(params.id));
      const row = await this.invoices.get(Number(params.id));
      return row ? { status: 200, body: row } : { status: 404, body: undefined };
    });
  }

  @TsRestHandler(billingContract.updateInvoice)
  async update(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.updateInvoice, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, Number(params.id));
      await this.invoices.update(Number(params.id), body);
      return { status: 200, body: { message: 'invoice updated' } };
    });
  }

  @TsRestHandler(billingContract.generateInvoiceFromBooking)
  async generateFromBooking(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.generateInvoiceFromBooking, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const invoiceId = await this.invoices.generateFromBooking(tenantId, params.bookingId);
      return { status: 201, body: { message: 'invoice generated from booking', invoiceId } };
    });
  }
}
