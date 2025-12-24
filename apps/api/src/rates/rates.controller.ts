import { Body, Controller, Headers, Logger, Param, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from 'src/api-contract';
import { RatesService } from './rates.service';
import * as schema from 'src/database-schema';
import { TenantService } from 'src/tenant/tenant.service';
// import { RequireRead, RequireWrite, RequireDelete } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class RatesController {
    private readonly logger = new Logger(RatesController.name);

    constructor(
        private rateService: RatesService,
        private tenantService: TenantService
    ) { }

    @TsRestHandler(contract.rates.createRate)
    @Roles(PermissionScope.RATES_WRITE)
    async createRate(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.createRate, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const { assetIds = [], ...rateData } = body;

            for (const assetId of assetIds) {
                await this.tenantService.validateTenantAccess(tenantId, schema.Asset, assetId);
            }

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
    @Roles(PermissionScope.RATES_READ)
    async getRate(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.getRate, async ({ params }) => {
            const tenantId = headers["x-tenant-id"];
            const rate = await this.rateService.getRate(params.id);

            for (const asset of rate.assets ?? []) {
                await this.tenantService.validateTenantAccess(tenantId, schema.Asset, asset.id);
            }

            return { status: 200, body: rate };
        });
    }

    @TsRestHandler(contract.rates.getRates)
    @Roles(PermissionScope.RATES_READ)
    async getRates(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.getRates, async ({ query }) => {
            const tenantId = headers['x-tenant-id']; // Extract tenantId from request headers
            const { assetId } = query; // Optional assetId from query params

            // Fetch the rates from the service
            const rates = await this.rateService.getRates(assetId);

            const authorizedRates: {
                rate: {
                    description: string | null;
                    id: number;
                    name: string;
                    startDate: Date;
                    endDate: Date;
                    minNights: number | null;
                    maxNights: number | null;
                    pricePerNight: string | null;
                    priority: number | null;
                };
                assetIds: string[];
            }[] = [];

            // Validate tenant access for each rate's associated assets
            for (const { rate, assetIds } of rates) {
                let isAuthorized = false;

                for (const assetId of assetIds) {
                    try {
                        // Validate tenant access to the asset
                        await this.tenantService.validateTenantAccess(tenantId, schema.Asset, assetId);
                        isAuthorized = true; // If tenant is authorized for any asset, mark as authorized
                        break;
                    } catch (error) {
                        // Continue checking other assets if access is denied
                        continue;
                    }
                }

                // If tenant is authorized for at least one asset, add rate and assetIds to the response
                if (isAuthorized) {
                    authorizedRates.push({
                        rate, // The rate object itself
                        assetIds, // The associated assetIds
                    });
                }
            }

            return {
                status: 200,
                body: authorizedRates, // Return authorized rates with assetIds
            };
        });
    }



    @TsRestHandler(contract.rates.updateRate)
    @Roles(PermissionScope.RATES_WRITE)
    async updateRate(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.updateRate, async ({ params, body }) => {
            const tenantId = headers['x-tenant-id'];
            const { id } = params;

            if (!id) {
                throw new Error("Rate id is required");
            }

            if (body.assetIds && body.assetIds.length > 0) {
                for (const assetId of body.assetIds) {
                    await this.tenantService.validateTenantAccess(tenantId, schema.Asset, assetId);
                }
            }

            await this.rateService.updateRate(id, body);

            return {
                status: 200,
                body: { message: "successfully updated rate" },
            };
        });
    }

    @TsRestHandler(contract.rates.deleteRate)
    @Roles(PermissionScope.RATES_DELETE)
    async deleteRate(@Headers() headers: any, @Param('id') rateId: string): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.rates.deleteRate, async ({ params }) => {
            const rateId = params.id;

            // Directly delete the rate based on the rateId without tenant validation
            try {
                await this.rateService.deleteRate(rateId);
                return { status: 204, body: undefined };  // Use `undefined` instead of `null`
            } catch (error) {
                // Handle error case if deletion fails
                return { status: 404, body: { message: 'Rate not found' } };
            }
        });
    }


    // @TsRestHandler(contract.rates.getRatesInRange)
    // async getRatesInRange(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    //     return tsRestHandler(contract.rates.getRatesInRange, async ({ query }) => {
    //         const tenantId = headers['x-tenant-id'];
    //         const { assetId, startDate, endDate } = query;

    //         // validate tenant for the requested asset
    //         if (assetId) {
    //             await this.tenantService.validateTenantAccess(tenantId, schema.Asset, assetId);
    //         }

    //         const rates = await this.rateService.getRatesInRange({ assetId, startDate, endDate });
    //         return { status: 200, body: rates };
    //     });
    // }
}
