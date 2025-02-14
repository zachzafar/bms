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
            const bookings = await this.bookingService.getBookings();
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
            const status = await this.bookingService.checkAvailability(params.id,query.start,query.end);
            return { status: 200, body:{ status }};
        });
    }
}
