import { Controller } from '@nestjs/common';
import { contract } from '@repo/api-contract';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { BookingService } from './booking.service';

@Controller()
export class BookingController {

    constructor(private bookingService: BookingService) {}
    
    @TsRestHandler(contract.booking.createBooking)
    async createBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.createBooking, async ({ body }) => {
             const id = await this.bookingService.createBooking(body);
            return { status: 201, body: { id } };
        });
    }

    @TsRestHandler(contract.booking.getBooking)
    async getBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getBooking, async ({ params }) => {
            const booking = await this.bookingService.getBooking(params.id);
            return { status: 200, body:  booking  };
        });
    }

    @TsRestHandler(contract.booking.getBookings)
    async getBookings(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getBookings, async () => {
            const bookings = (await this.bookingService.getBookings()).map((booking) => {
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
    async updateBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.updateBooking, async ({ body }) => {
            const  booking  = await this.bookingService.updateBooking(body);
            return { status: 200, body:  booking  };
        });
    }

    @TsRestHandler(contract.booking.cancelBooking)
    async deleteBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.cancelBooking, async ({ params }) => {
            await this.bookingService.deleteBooking(params.id);
            return { status: 204, body: undefined};
        });
    }

    @TsRestHandler(contract.booking.getAssetStatus)
    async getAssetStatus(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getAssetStatus, async ({ params, query }) => {
            const startDate = query?.start ? new Date(query.start) : undefined;
            const endDate = query?.end? new Date(query.end) : undefined;

            if (startDate?.toString() === 'Invalid Date' || endDate?.toString() === 'Invalid Date') {
                return { status: 400, body: { message: 'Invalid start date' }};
            }

            const status = await this.bookingService.checkAvailability(params.id, startDate && endDate ? {startDate, endDate}: undefined);
            return { status: 200, body:{ status }};
        });
    }

    @TsRestHandler(contract.booking.createAssetAvailability)
    async createAssetAvailability(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.createAssetAvailability, async ({ body }) => {
            const [{id}] = await this.bookingService.addAvailabilityException(body);
            return { status: 201, body: {id}};
        });
    }

    @TsRestHandler(contract.booking.getAssetAvailability)
    async getAssetAvailability(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.getAssetAvailability, async ({ params }) => {
            const availability = await this.bookingService.getAvailabilityExceptions(params.id);
            return { status: 200, body:  availability  };
        });
    }
}
