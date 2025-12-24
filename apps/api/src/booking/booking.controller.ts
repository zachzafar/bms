import { ConflictException, Controller, Headers, Logger, Query } from '@nestjs/common';
import { contract } from 'src/api-contract';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { BookingService } from './booking.service';
import * as schema from "src/database-schema"
import { TenantService } from 'src/tenant/tenant.service';
// import { RequireRead, RequireWrite, RequireDelete, RequirePermissionsDecorator } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';

@Controller()
export class BookingController {
    private readonly logger = new Logger(BookingController.name);
    constructor(private bookingService: BookingService, private tenantService: TenantService) { }

    @TsRestHandler(contract.booking.createBooking)
    @Roles(PermissionScope.BOOKINGS_WRITE)
    async createBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.createBooking, async ({ body }) => {
            const { booking, customers } = body;

            const bookingId = await this.bookingService.createBooking(booking, customers);

            if (!bookingId) {
                throw new ConflictException('Booking creation failed, no bookingId returned');
            }

            return {
                status: 201,
                body: {
                    message: 'successfully added booking',
                    bookingId, // ✅ now guaranteed to be string
                },
            };
        });
    }

    @TsRestHandler(contract.booking.getBooking)
    @Roles(PermissionScope.BOOKINGS_READ)
    async getBooking(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getBooking, async ({ params }) => {
            const tenantId = headers['x-tenant-id'];
            const booking = await this.bookingService.getBooking(params.id);
            await this.tenantService.validateTenantAccess(tenantId, schema.Asset, booking.asset.id)
            return { status: 200, body: booking };
        });
    }

    @TsRestHandler(contract.booking.getBookings)
    async getBookings(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getBookings, async ({ query }) => {
            const tenantId = headers['x-tenant-id'];
            const bookings = (await this.bookingService.getBookings(tenantId, query.assetId)).map(booking => ({
                ...booking,
                asset: {
                    ...booking.asset,
                    assetTypeId: booking.asset.assetTypeId ? Number(booking.asset.assetTypeId) : undefined,
                },
            }));

            return { status: 200, body: bookings };
        });
    }

    @TsRestHandler(contract.booking.updateBooking)
    @Roles(PermissionScope.BOOKINGS_WRITE)
    async updateBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.updateBooking, async ({ body }) => {
            await this.bookingService.updateBooking(body);
            return { status: 200, body: { message: "succesffully updated booking" } };
        });
    }

    @TsRestHandler(contract.booking.cancelBooking)
    @Roles(PermissionScope.BOOKINGS_DELETE)
    async deleteBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.cancelBooking, async ({ params }) => {
            await this.bookingService.deleteBooking(params.id);
            return { status: 204, body: undefined };
        });
    }

    @TsRestHandler(contract.booking.createBookingByTag)
    @Roles(PermissionScope.BOOKINGS_WRITE, PermissionScope.BOOKINGS_BY_TAG_CREATE)
    async createBookingByTag(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.createBookingByTag, async ({ body }) => {
            const tenantId = headers['x-tenant-id'];
            const result = await this.bookingService.createBookingByTag(body, tenantId);
            return { status: 201, body: result };
        });
    }

    @TsRestHandler(contract.booking.checkTagAvailability)
    @Roles(PermissionScope.BOOKINGS_READ)
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

    // -------------------------
    // Blocked Dates endpoints
    // -------------------------
    @TsRestHandler(contract.booking.getBlockedDates)
    @Roles(PermissionScope.BOOKINGS_READ)
    async getBlockedDates(
        @Headers() headers: any,
        @Query() query: { assetId?: string }
    ): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getBlockedDates, async ({ query }) => {
            const blockedDates = await this.bookingService.getBlockedDates(query?.assetId);

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


    @TsRestHandler(contract.booking.createBlockedDate)
    @Roles(PermissionScope.BOOKINGS_WRITE)
    async createBlockedDate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.createBlockedDate, async ({ body }) => {
            const result = await this.bookingService.createBlockedDate(body);
            return { status: 201, body: result };
        });
    }

    @TsRestHandler(contract.booking.updateBlockedDate)
    @Roles(PermissionScope.BOOKINGS_WRITE)
    async updateBlockedDate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.updateBlockedDate, async ({ body, params }) => {
            const result = await this.bookingService.updateBlockedDate(params.id, body);
            return { status: 200, body: result };
        });
    }

    @TsRestHandler(contract.booking.deleteBlockedDate)
    @Roles(PermissionScope.BOOKINGS_DELETE)
    async deleteBlockedDate(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.deleteBlockedDate, async ({ params }) => {
            const id = String(params.id);
            // if (isNaN(id)) throw new BadRequestException("Invalid blocked date ID");

            await this.bookingService.deleteBlockedDate(id);
            return { status: 204, body: undefined };
        });
    }
}
