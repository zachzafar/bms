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
            const {booking, customers} = body
            await this.bookingService.createBooking(booking,customers);
            return { status: 201, body: { message: "successfully added booking" } };
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
            await this.bookingService.updateBooking(body);
            return { status: 200, body:  { message: "succesffully updated booking"} };
        });
    }

    @TsRestHandler(contract.booking.cancelBooking)
    async deleteBooking(): Promise<ReturnType<typeof tsRestHandler>> {
        return tsRestHandler(contract.booking.cancelBooking, async ({ params }) => {
            await this.bookingService.deleteBooking(params.id);
            return { status: 204, body: undefined};
        });
    }

    
}
