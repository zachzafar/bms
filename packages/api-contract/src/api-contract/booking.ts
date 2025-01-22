import { initContract } from "@ts-rest/core";

import { z } from "zod";

import { Customer, InsertBookingSchema, SelectAssetSchema, SelectBookingSchema, SelectCustomerSchema, UpdateBookingSchema } from "../database-schema";


const c = initContract();

export const ExtendedSelectBookingSchema = SelectBookingSchema.extend({
    asset: SelectAssetSchema,
    customer: SelectCustomerSchema
})

export type ExtendedSelectBooking = z.infer<typeof ExtendedSelectBookingSchema>

export const bookingContract = c.router({
    createBooking : {
        method: 'POST',
        path: '/booking',
        responses: {
            201: SelectBookingSchema,
          
        },
        body: InsertBookingSchema,
        summary: 'Create a new booking'
    },
    getBookings: {
        method: 'GET',
        path: '/booking',
        responses: {
            200: z.array(ExtendedSelectBookingSchema)
        },
        query: z.object({
            search: z.string().optional(),
        }),
        summary: 'Get all bookings'
    },
    getBooking: {
        method: 'GET',
        path: '/booking/:id',
        responses: {
            200: ExtendedSelectBookingSchema,
            404: z.undefined()
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Get a booking by id'
    }, 
    cancelBooking: {
        method: 'GET',
        path: '/booking/:id',
        responses: {
            204: z.undefined()
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Delete a booking by id'
    },
    updateBooking: {
        method: 'PUT',
        path: '/booking/:id',
        responses: {
            200: SelectBookingSchema
        },
        pathParams: z.object({
            id: z.number()
        }),
        body: UpdateBookingSchema,
        summary: 'Update a booking by id'
    }
    
})