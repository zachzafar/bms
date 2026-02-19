import { Controller, Headers, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { TaxFeeService } from './tax-fee.service';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(PermissionsGuard)
@Controller()
export class TaxFeeController {
  constructor(private taxFeeService: TaxFeeService) {}

  @TsRestHandler(contract.taxesFees.createTaxFee)
  @Roles(PermissionScope.RATES_WRITE)
  async createTaxFee(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.taxesFees.createTaxFee, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      const taxFeeId = await this.taxFeeService.createTaxFee(body, tenantId);
      return { status: 201, body: { message: 'Tax/fee created successfully', taxFeeId } };
    });
  }

  @TsRestHandler(contract.taxesFees.getTaxFees)
  @Roles(PermissionScope.RATES_READ)
  async getTaxFees(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.taxesFees.getTaxFees, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const result = await this.taxFeeService.getTaxFees(tenantId, query.page, query.pageSize);
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.taxesFees.getTaxFee)
  @Roles(PermissionScope.RATES_READ)
  async getTaxFee(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.taxesFees.getTaxFee, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const taxFee = await this.taxFeeService.getTaxFee(params.id, tenantId);
      return { status: 200, body: taxFee };
    });
  }

  @TsRestHandler(contract.taxesFees.updateTaxFee)
  @Roles(PermissionScope.RATES_WRITE)
  async updateTaxFee(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.taxesFees.updateTaxFee, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.taxFeeService.updateTaxFee(params.id, body, tenantId);
      return { status: 200, body: { message: 'Tax/fee updated successfully' } };
    });
  }

  @TsRestHandler(contract.taxesFees.deleteTaxFee)
  @Roles(PermissionScope.RATES_WRITE)
  async deleteTaxFee(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.taxesFees.deleteTaxFee, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.taxFeeService.deleteTaxFee(params.id, tenantId);
      return { status: 204, body: undefined };
    });
  }

  @Public()
  @TsRestHandler(contract.taxesFees.getPublicTaxFees)
  async getPublicTaxFees(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.taxesFees.getPublicTaxFees, async ({ params }) => {
      const taxFees = await this.taxFeeService.getTaxFeesBySubdomain(params.subdomain);
      return { status: 200, body: taxFees };
    });
  }
}
