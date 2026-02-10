import { Controller, Headers, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { RatesService } from './rates.service';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(PermissionsGuard)
@Controller()
export class RatesController {
  constructor(private rateService: RatesService) {}

  // --- Rate endpoints ---

  @TsRestHandler(contract.rates.createRate)
  @Roles(PermissionScope.RATES_WRITE)
  async createRate(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.createRate, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      const { assetIds = [], ...rateData } = body;

      const rateId = await this.rateService.createRate(tenantId, rateData, assetIds);

      return {
        status: 201,
        body: { message: 'Successfully created rate', rateId },
      };
    });
  }

  @TsRestHandler(contract.rates.getRate)
  @Roles(PermissionScope.RATES_READ)
  async getRate(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.getRate, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      const rate = await this.rateService.getRate(tenantId, params.id);
      return { status: 200, body: rate };
    });
  }

  @TsRestHandler(contract.rates.getRates)
  @Roles(PermissionScope.RATES_READ)
  async getRates(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.getRates, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const { assetId, assetTypeId } = query;
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      const result = await this.rateService.getRates(tenantId, assetId, assetTypeId, page, pageSize);

      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.rates.updateRate)
  @Roles(PermissionScope.RATES_WRITE)
  async updateRate(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.updateRate, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];

      await this.rateService.updateRate(tenantId, params.id, body);

      return { status: 200, body: { message: 'Successfully updated rate' } };
    });
  }

  @TsRestHandler(contract.rates.deleteRate)
  @Roles(PermissionScope.RATES_DELETE)
  async deleteRate(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.deleteRate, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];

      await this.rateService.deleteRate(tenantId, params.id);

      return { status: 204, body: undefined };
    });
  }

  // --- RateType endpoints ---

  @TsRestHandler(contract.rates.createRateType)
  @Roles(PermissionScope.RATES_WRITE)
  async createRateType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.createRateType, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      const rateTypeId = await this.rateService.createRateType(tenantId, body);
      return {
        status: 201,
        body: { message: 'Successfully created rate type', rateTypeId },
      };
    });
  }

  @TsRestHandler(contract.rates.getRateTypes)
  @Roles(PermissionScope.RATES_READ)
  async getRateTypes(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.getRateTypes, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      const result = await this.rateService.getRateTypes(tenantId, page, pageSize);
      return { status: 200, body: result };
    });
  }

  @TsRestHandler(contract.rates.updateRateType)
  @Roles(PermissionScope.RATES_WRITE)
  async updateRateType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.updateRateType, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.rateService.updateRateType(tenantId, params.id, body);
      return { status: 200, body: { message: 'Successfully updated rate type' } };
    });
  }

  @TsRestHandler(contract.rates.deleteRateType)
  @Roles(PermissionScope.RATES_DELETE)
  async deleteRateType(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.deleteRateType, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.rateService.deleteRateType(tenantId, params.id);
      return { status: 204, body: undefined };
    });
  }

  // --- Public endpoints (by subdomain) ---

  @Public()
  @TsRestHandler(contract.rates.getPublicRates)
  async getPublicRates(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.getPublicRates, async ({ params, query }) => {
      const { subdomain } = params;
      const { assetId, assetTypeId } = query;
      const page = query.page ? Number(query.page) : 1;
      const pageSize = query.pageSize ? Number(query.pageSize) : 10;

      const result = await this.rateService.getRatesBySubdomain(subdomain, assetId, assetTypeId, page, pageSize);
      return { status: 200, body: result };
    });
  }

  @Public()
  @TsRestHandler(contract.rates.getPublicRate)
  async getPublicRate(): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(contract.rates.getPublicRate, async ({ params }) => {
      const { subdomain, id } = params;
      const rate = await this.rateService.getRateBySubdomain(subdomain, id);
      return { status: 200, body: rate };
    });
  }
}
