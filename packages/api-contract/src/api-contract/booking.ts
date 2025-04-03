import { initContract } from "@ts-rest/core";

import { z } from "zod";

import { InsertAvailabilitySchema, InsertBookingSchema, SelectAssetSchema, SelectAvailabilitySchema, SelectBookingSchema, SelectCustomerSchema, UpdateBookingSchema } from "../database-schema";


const c = initContract();

export const ExtendedSelectBookingSchema = SelectBookingSchema.extend({
    customer: SelectCustomerSchema,
    asset: SelectAssetSchema
})

export type ExtendedSelectBooking = z.infer<typeof ExtendedSelectBookingSchema>

export const bookingContract = c.router({
    createBooking : {
        method: 'POST',
        path: '/booking',
        responses: {
            201: z.object({
                message: z.string(),
            })
          
        },
        body: z.object({
            booking: InsertBookingSchema,
            customers: z.array(z.number()),
        }),
    
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
            id: z.string()
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
            id: z.string()
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
            id: z.string()
        }),
        body: UpdateBookingSchema,
        summary: 'Update a booking by id'
    },
    getAssetStatus: {
        method: 'GET',
        path: '/booking/asset-status/:id',
        responses: {
            200:z.object({
                status: z.enum(["Available", "Booked", "Unavailable"]),
            })
        },
        query: z.object({
            start: z.string(),
            end: z.string()
        }).optional(),
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Get asset status by id'
    },
    createAssetAvailability: {
        method: 'POST',
        path: '/booking/asset-availability',
        responses: {
            201: z.object({
                id: z.number(),
            })
        },
        body: InsertAvailabilitySchema.omit({startDate:true, endDate:true}).extend({ startDate: z.string(), endDate: z.string()}),
        summary: 'Create a new asset availability'
    },
    getAssetAvailability: {
        method: 'GET',
        path: '/booking/asset-availability/:id',
        responses: {
            200: z.array(SelectAvailabilitySchema)
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Get asset availability by id'
    },
    
})