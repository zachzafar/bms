import { BadRequestException, Controller, Headers, Logger, Res } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { billingContract } from '@repo/api-contract';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { Response } from 'express';

@Controller()
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);
  constructor(
    private readonly invoices: InvoicesService,
    private readonly tenantService: TenantService,
    private readonly pdfService: PdfService,
  ) { }

  @TsRestHandler(billingContract.createInvoice)
  @Roles(PermissionScope.BILLING_WRITE)
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.createInvoice, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];

      // Convert string -> proper types
      const customerId = (body.invoice.customerId);
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
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      const rows = await this.invoices.list(tenantId, query, page, pageSize);
      return { status: 200, body: {data: rows.data.map(row => ({
        ...row,
        dueDate: row.dueDate.toISOString(),
      })),pagination: rows.pagination} };
    });
  }

  @TsRestHandler(billingContract.getInvoice)
  @Roles(PermissionScope.BILLING_READ)
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getInvoice, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, (params.id));
      const row = await this.invoices.get((params.id));
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
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, (params.id));

      const normalizedBody = {
        ...body,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        customerId: body.customerId ? (body.customerId) : undefined,
      };

      // Handle updated items if included
      const items = body.items?.map(item => ({
        ...item,
        invoiceId: (params.id),
      }));

      try {
        await this.invoices.update((params.id), normalizedBody, items);
        return { status: 200, body: { message: 'invoice updated' } };
      } catch (error: any) {
        if (error instanceof BadRequestException) {
          return { status: 400, body: { message: error.message } };
        }
        throw error;
      }
    });
  }


  @TsRestHandler(billingContract.deleteInvoice)
  @Roles(PermissionScope.BILLING_WRITE)
  async delete(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.deleteInvoice, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];

      // Validate tenant access
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, (params.id));

      try {
        // Call service delete method
        await this.invoices.delete((params.id));
        return { status: 200, body: { message: `Invoice ${params.id} deleted successfully` } };
      } catch (error: any) {
        if (error instanceof BadRequestException) {
          return { status: 400, body: { message: error.message } };
        }
        throw error;
      }
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

  @TsRestHandler(billingContract.downloadInvoicePdf)
  @Roles(PermissionScope.BILLING_READ)
  async downloadInvoicePdf(
    @Headers() headers: Record<string, string | string[]>,
    @Res() res: Response
  ) {
    return tsRestHandler(billingContract.downloadInvoicePdf, async ({ params }) => {
      const rawTenantId = headers['x-tenant-id'];
      const tenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId;

      if (!tenantId) {
        return { status: 404 as const, body: { message: 'TenantId missing' } };
      }

      // Validate tenant access
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, params.id);

      // Get invoice with items
      const invoice = await this.invoices.get(params.id);
      if (!invoice) {
        return { status: 404 as const, body: { message: 'Invoice not found' } };
      }

      // Get tenant info
      const tenant = await this.tenantService.getTenantById(tenantId);
      if (!tenant) {
        return { status: 404 as const, body: { message: 'Tenant not found' } };
      }

      // Get customer info
      const customer = invoice.customerId
        ? await this.tenantService.getCustomerById(invoice.customerId)
        : null;

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateInvoicePdf({
        tenant: {
          name: tenant.name,
          logoUrl: tenant.logoUrl,
          address: tenant.address ?? undefined,
          email: tenant.email ?? undefined,
          phone: tenant.phone ?? undefined,
        },
        invoice: {
          invoiceNumber: invoice.invoiceNumber,
          issueDate: new Date(invoice.issueDate),
          dueDate: new Date(invoice.dueDate),
          status: invoice.status,
          subtotal: String(invoice.subtotal),
          taxAmount: String(invoice.taxAmount),
          totalAmount: String(invoice.totalAmount),
          notes: invoice.notes ?? undefined,
        },
        customer: {
          name: customer?.user?.name ?? 'Unknown Customer',
          email: customer?.user?.email ?? undefined,
          address: customer?.address ?? undefined,
        },
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      });

      // Send PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);

      return { status: 200 as const, body: pdfBuffer };
    });
  }

  @TsRestHandler(billingContract.getInvoicePayments)
  @Roles(PermissionScope.BILLING_READ)
  async getInvoicePayments(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getInvoicePayments, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, params.id);

      const payments = await this.invoices.getInvoicePayments(params.id);
      return { status: 200, body: payments };
    });
  }

  @TsRestHandler(billingContract.refundInvoice)
  @Roles(PermissionScope.BILLING_WRITE)
  async refundInvoice(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.refundInvoice, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Invoice, params.id);

      try {
        const result = await this.invoices.refundInvoice(params.id);
        return { status: 200, body: result };
      } catch (error: any) {
        if (error instanceof BadRequestException) {
          return { status: 400, body: { message: error.message } };
        }
        throw error;
      }
    });
  }
}
