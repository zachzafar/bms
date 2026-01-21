import { Controller, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { billingContract } from '@repo/api-contract';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import { PaymentsService } from './payments.service';
// import { RequireRead, RequireWrite } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';

@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly tenantService: TenantService,
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
}