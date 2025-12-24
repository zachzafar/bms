import { Controller, UseGuards } from '@nestjs/common';
import { SlotService } from './slot.service';
import { contract } from 'src/api-contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
// import { RequireRead, RequireWrite } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller()
export class SlotController {
    constructor(private readonly slotService: SlotService) {}

    @TsRestHandler(contract.slots.getAssetStatus)
    @Roles(PermissionScope.SLOTS_READ)
    async getAssetStatus(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.slots.getAssetStatus, async ({ params, query }) => {
            const startDate = query?.start ? new Date(query.start) : undefined;
            const endDate = query?.end? new Date(query.end) :   undefined;

            if (endDate) {
                const status = await this.slotService.checkSlotsAvailability(params.id, startDate ?? new Date(), endDate);
            return { status: 200, body:{ status: status ? 'Available' : 'Unavailable' }};
                
            }

            const status = await this.slotService.checkAssetCurrentSatus(params.id);
            return { status: 200, body:{ status }};
            
        });
    }

    @TsRestHandler(contract.slots.createAssetAvailability)
    @Roles(PermissionScope.SLOTS_WRITE)
    async createAssetAvailability(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.slots.createAssetAvailability, async ({ body }) => {
            await this.slotService.generateSlotsForRangeAndPrice(
                body.assetId,  
                new Date(body.startDate),
                 new Date(body.endDate),
                 body.price,
                 body.available
            );
            return {
                status: 201 as const,
                body: {
                    message: 'Availability created successfully'
                }
            };
        });
    }

    @TsRestHandler(contract.slots.getAssetAvailability)
    @Roles(PermissionScope.SLOTS_READ)
    async getAssetAvailability(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.slots.getAssetAvailability, async ({ params }) => {
            const ranges = await this.slotService.getRangesForAssetByPriceAndAvailability(params.id);
            return { status: 200, body:  ranges };
        });
    }
}
