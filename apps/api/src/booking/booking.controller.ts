import { Controller, Headers, Logger, Query } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { BookingService } from './booking.service';
import * as schema from "@repo/api-contract"
import { TenantService } from 'src/tenant/tenant.service';
import { RequireRead, RequireWrite, RequireDelete, RequirePermissionsDecorator } from 'src/auth/decorators/permissions.decorator';

@Controller()
export class BookingController {
    private readonly logger = new Logger(BookingController.name);
    constructor(private bookingService: BookingService,private tenantService: TenantService) {}
    
    @TsRestHandler(contract.booking.createBooking)
    @RequireWrite('bookings')
    async createBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.createBooking, async ({ body }) => {
            const {booking, customers} = body
            await this.bookingService.createBooking(booking,customers);
            return { status: 201, body: { message: "successfully added booking" } };
        });
    }

    @TsRestHandler(contract.booking.getBooking)
    @RequireRead('bookings')
    async getBooking(@Headers() headers:any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getBooking, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            const booking = await this.bookingService.getBooking(params.id);
            await this.tenantService.validateTenantAccess(tenantId,schema.Asset,booking.asset.id)
            return { status: 200, body:  booking  };
        });
    }

    @TsRestHandler(contract.booking.getBookings)
    @RequireRead('bookings')
    async getBookings(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getBookings, async () => {
            this.logger.log("Get bookings for tenant: ", headers['x-tenant-id'] || "no tenant")
            const tenantId = headers['x-tenant-id'];
            const bookings = (await this.bookingService.getBookings(tenantId)).map((booking) => {
                let assetTypeId = booking.asset.assetTypeId? Number(booking.asset.assetTypeId): undefined;

                return {
                    ...booking,
                    asset: {
                        ...booking.asset,
                        assetTypeId
                    }
                }
            });

            return { status: 200, body:  bookings  };
        });
    }

    @TsRestHandler(contract.booking.updateBooking)
    @RequireWrite('bookings')
    async updateBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.updateBooking, async ({ body }) => {
            await this.bookingService.updateBooking(body);
            return { status: 200, body:  { message: "succesffully updated booking"} };
        });
    }

    @TsRestHandler(contract.booking.cancelBooking)
    @RequireDelete('bookings')
    async deleteBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.cancelBooking, async ({ params }) => {
            await this.bookingService.deleteBooking(params.id);
            return { status: 204, body: undefined};
        });
    }

    @TsRestHandler(contract.booking.createBookingByTag)
    @RequirePermissionsDecorator(['bookings:write', 'bookings:by-tag:create'])
    async createBookingByTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.createBookingByTag, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const result = await this.bookingService.createBookingByTag(body, tenantId);
            return { status: 201, body: result };
        });
    }

    @TsRestHandler(contract.booking.checkTagAvailability)
    @RequireRead('bookings')
    async checkTagAvailability(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.checkTagAvailability, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];

            const tagId = Number(query.tagId);
            if (isNaN(tagId)) {
                return { status: 400, body: { message: "Invalid tagId" } };
            }

            const result = await this.bookingService.checkAvailabilityByTag({ tagId });

            return { status: 200, body: result };
        });
    }
}
