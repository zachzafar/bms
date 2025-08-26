import { Controller, Headers } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { billingContract } from '@repo/api-contract';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
import { PaymentsService } from './payments.service';
import { RequireRead, RequireWrite } from 'src/auth/decorators/permissions.decorator';

@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly tenantService: TenantService,
  ) { }

  @TsRestHandler(billingContract.createPayment)
  @RequireWrite('payments')
  async create(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.createPayment, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];

      // Guard: payment belongs to a tenant customer
      await this.tenantService.validateTenantAccess(tenantId, schema.Customer, body.payment.customerId);

      const id = await this.payments.create({
        ...body.payment,
      }, body.invoiceIds, body.amountsApplied);

      return { status: 201, body: { message: 'payment created', paymentId: id } };
    });
  }

  @TsRestHandler(billingContract.getPayments)
  @RequireRead('payments')
  async list(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getPayments, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const rows = await this.payments.list(tenantId, query);
      return { status: 200, body: rows };
    });
  }

  @TsRestHandler(billingContract.getPayment)
  @RequireRead('payments')
  async get(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(billingContract.getPayment, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Payment, Number(params.id));
      const row = await this.payments.get(Number(params.id));
      if (!row) {
        return { status: 404, body: undefined };
      }
      return { status: 200, body: row };
    });
  }
}
