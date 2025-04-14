import { initContract } from "@ts-rest/core";

import { z } from "zod";

import {  InsertBookingSchema, SelectAssetSchema, SelectBookingSchema, SelectCustomerSchema, SelectUserSchema, UpdateBookingSchema } from "../database-schema";


const c = initContract();

export const ExtendedSelectBookingSchema = SelectBookingSchema.omit({startDate: true, endDate:true}).extend({
    customer: SelectCustomerSchema,
    asset: SelectAssetSchema,
    user: SelectUserSchema,
    startDate: z.string(),
    endDate: z.string(),
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
            200: z.object({
                message: z.string(),
            })
        },
        pathParams: z.object({
            id: z.string()
        }),
        body: UpdateBookingSchema,
        summary: 'Update a booking by id'
    },
    
})