import { Controller, Headers, Query } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { BlockedDatesService } from './blocked-dates.service';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller()
export class BlockedDatesController {
    constructor(private blockedDatesService: BlockedDatesService) {}

    @TsRestHandler(contract.blockedDates.getBlockedDates)
    @Roles(PermissionScope.BOOKINGS_READ)
    async getBlockedDates(
        @Headers() headers: any,
        @Query() query: { assetId?: string }
    ): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.blockedDates.getBlockedDates, async ({ query }) => {
            const blockedDates = await this.blockedDatesService.getBlockedDates(query?.assetId);

            const formatted = blockedDates.map((b) => ({
                tenantId: b.tenantId,
                id: b.id,
                assetId: b.assetId,
                startDate: b.startDate,
                endDate: b.endDate,
                createdAt: b.createdAt,
                updatedAt: b.updatedAt ?? b.createdAt,
                reason: b.reason ?? undefined,
                title: b.title,
            }));

            return { status: 200, body: formatted };
        });
    }

    @TsRestHandler(contract.blockedDates.createBlockedDate)
    @Roles(PermissionScope.BOOKINGS_WRITE)
    async createBlockedDate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.blockedDates.createBlockedDate, async ({ body }) => {
            const result = await this.blockedDatesService.createBlockedDate(body);
            return { status: 201, body: result };
        });
    }

    @TsRestHandler(contract.blockedDates.updateBlockedDate)
    @Roles(PermissionScope.BOOKINGS_WRITE)
    async updateBlockedDate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.blockedDates.updateBlockedDate, async ({ body, params }) => {
            const result = await this.blockedDatesService.updateBlockedDate(params.id, body);
            return { status: 200, body: result };
        });
    }

    @TsRestHandler(contract.blockedDates.deleteBlockedDate)
    @Roles(PermissionScope.BOOKINGS_DELETE)
    async deleteBlockedDate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.blockedDates.deleteBlockedDate, async ({ params }) => {
            const id = params.id;
            await this.blockedDatesService.deleteBlockedDate(id);
            return { status: 204, body: undefined };
        });
    }

    @Public()
    @TsRestHandler(contract.blockedDates.getBlockedDatesForAssetPublic)
    async getBlockedDatesForAssetPublic(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.blockedDates.getBlockedDatesForAssetPublic, async ({ params }) => {
            const blockedDates = await this.blockedDatesService.getBlockedDates(params.assetId);

            const formatted = blockedDates.map((b) => ({
                startDate: b.startDate,
                endDate: b.endDate,
            }));

            return { status: 200, body: formatted };
        });
    }

    @Public()
    @TsRestHandler(contract.blockedDates.getBlockedDatesForAssetTypePublic)
    async getBlockedDatesForAssetTypePublic(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.blockedDates.getBlockedDatesForAssetTypePublic, async ({ params, query }) => {
            const { assetTypeId } = params;
            const startDate = query?.startDate;
            const endDate = query?.endDate;

            const result = await this.blockedDatesService.getFullyBlockedDaysForAssetType(assetTypeId, startDate, endDate);

            return { status: 200, body: result };
        });
    }
}
