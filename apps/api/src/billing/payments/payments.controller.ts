import { Controller, Headers, Res } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { billingContract } from '@repo/api-contract';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import { PaymentsService } from './payments.service';
import { PdfService } from '../pdf/pdf.service';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { Response } from 'express';

@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly tenantService: TenantService,
    private readonly pdfService: PdfService,
  ) { }

  @TsRestHandler(billingContract.createPayment)
  @Roles(PermissionScope.PAYMENTS_WRITE)
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.createPayment, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];

      // Guard: payment belongs to a tenant customer
      await this.tenantService.validateTenantAccess(tenantId, schema.Customer, body.payment.customerId);

      const id = await this.payments.create({
        ...body.payment,  
      }, tenantId, body.invoiceIds, body.amountsApplied);

      return { status: 201, body: { message: 'payment created', paymentId: id } };
    });
  }

  @TsRestHandler(billingContract.getPayments)
  @Roles(PermissionScope.PAYMENTS_READ)
  async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getPayments, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      const rows = await this.payments.list(tenantId, { customerId: query.customerId ? (query.customerId) : undefined }, page, pageSize);
      return { status: 200, body: {data: rows.data.map((row) => ({ ...row, paymentDate: row.paymentDate.toISOString() })),pagination: rows.pagination} };
    });
  }

  @TsRestHandler(billingContract.getPayment)
  @Roles(PermissionScope.PAYMENTS_READ)
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getPayment, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Payment, (params.id));
      const row = await this.payments.get((params.id));
      if (!row) {
        return { status: 404, body: undefined };
      }
      return { status: 200, body: { ...row, paymentDate: row.paymentDate.toISOString() } };
    });
  }

  @TsRestHandler(billingContract.deletePayment)
  @Roles(PermissionScope.PAYMENTS_WRITE)
  async delete(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.deletePayment, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Payment, (params.id));

      try {
        const result = await this.payments.delete((params.id));
        return { status: 200, body: result };
      } catch (error:any) {
        if (error.message?.includes('not found')) {
          return { status: 404, body: { message: error.message } };
        }
        throw error;
      }
    });
  }

  @TsRestHandler(billingContract.downloadPaymentReceiptPdf)
  @Roles(PermissionScope.PAYMENTS_READ)
  async downloadPaymentReceiptPdf(
    @Headers() headers: Record<string, string | string[]>,
    @Res() res: Response
  ) {
    return tsRestHandler(billingContract.downloadPaymentReceiptPdf, async ({ params }) => {
      const rawTenantId = headers['x-tenant-id'];
      const tenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId;

      if (!tenantId) {
        return { status: 404 as const, body: { message: 'TenantId missing' } };
      }

      // Validate tenant access
      await this.tenantService.validateTenantAccess(tenantId, schema.Payment, params.id);

      // Get payment with invoices
      const payment = await this.payments.get(params.id);
      if (!payment) {
        return { status: 404 as const, body: { message: 'Payment not found' } };
      }

      // Get tenant info
      const tenant = await this.tenantService.getTenantById(tenantId);
      if (!tenant) {
        return { status: 404 as const, body: { message: 'Tenant not found' } };
      }

      // Get customer info
      const customer = payment.customerId
        ? await this.tenantService.getCustomerById(payment.customerId)
        : null;

      // Generate receipt number from payment ID
      const receiptNumber = `RCP-${String(payment.id).padStart(6, '0')}`;

      // Generate PDF
      const pdfBuffer = await this.pdfService.generatePaymentReceiptPdf({
        tenant: {
          name: tenant.name,
          logoUrl: tenant.logoUrl,
          address: tenant.address ?? undefined,
          email: tenant.email ?? undefined,
          phone: tenant.phone ?? undefined,
        },
        payment: {
          receiptNumber,
          paymentDate: new Date(payment.paymentDate),
          paymentMethod: payment.paymentMethod ?? 'Unknown',
          type: payment.type ?? 'Payment',
          amount: String(payment.amount),
          referenceNumber: payment.reference,
          notes: payment.notes,
        },
        customer: {
          name: customer?.name ?? 'Unknown Customer',
          email: customer?.email ?? undefined,
          address: customer?.address ?? undefined,
        },
        appliedInvoices: payment.invoices?.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          amountApplied: inv.amountApplied,
        })),
      });

      // Send PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptNumber}.pdf"`);
      res.send(pdfBuffer);

      return { status: 200 as const, body: pdfBuffer };
    });
  }
}