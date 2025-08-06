import { Controller, Headers, Logger } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@repo/api-contract';
import { RatesService } from './rates.service';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';

@Controller()
export class RatesController {
    private readonly logger = new Logger(RatesController.name);

    constructor(
        private rateService: RatesService,
        private tenantService: TenantService
    ) { }

    @TsRestHandler(contract.rates.createRate)
    async createRate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.createRate, async ({ body }) => {
            const { assetIds = [], ...rateData } = body;

            const rateId = await this.rateService.createRate(rateData, assetIds);

            return {
                status: 201,
                body: {
                    message: "Successfully created rate",
                    rateId: Number(rateId),
                },
            };
        });
    }


    @TsRestHandler(contract.rates.getRate)
    async getRate(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.getRate, async ({ params }) => {
            const rate = await this.rateService.getRate(params.id);
            const tenantId = headers["x-tenant-id"];

            // Validate access for each linked asset
            for (const asset of rate.assets ?? []) {
                await this.tenantService.validateTenantAccess(tenantId, schema.Asset, asset.id);
            }

            return { status: 200, body: rate };
        });
    }

    @TsRestHandler(contract.rates.getRates)
    async getRates(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.getRates, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const rates = await this.rateService.getRates(query.assetId);
            return { status: 200, body: rates };
        });
    }

    @TsRestHandler(contract.rates.updateRate)
    async updateRate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.updateRate, async ({ params, body }) => {
            const { id } = params;

            if (!id) {
                throw new Error("Rate id is required");
            }

            await this.rateService.updateRate(id, body);

            return {
                status: 200,
                body: { message: "successfully updated rate" },
            };
        });
    }



    @TsRestHandler(contract.rates.deleteRate)
    async deleteRate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.deleteRate, async ({ params }) => {
            await this.rateService.deleteRate(params.id);
            return { status: 204, body: undefined };
        });
    }

    //   @TsRestHandler(contract.rates.getRatesInRange)
    //   async getRatesInRange(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    //     return tsRestHandler(contract.rates.getRatesInRange, async ({ query }) => {
    //       const tenantId = headers['x-tenant-id'];
    //       const { assetId, startDate, endDate } = query;
    //       const rates = await this.rateService.getRatesInRange({ assetId, startDate, endDate });
    //       return { status: 200, body: rates };
    //     });
    //   }
}
