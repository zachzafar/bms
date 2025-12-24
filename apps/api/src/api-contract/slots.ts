import { initContract } from "@ts-rest/core";

import { z } from "zod";

import {  SelectAssetSchema, SelectBookingSchema, SelectCustomerSchema, SelectUserSchema, UpdateBookingSchema } from "../database-schema";


const c = initContract();

export const ExtendedSelectBookingSchema = SelectBookingSchema.omit({startDate: true, endDate:true}).extend({
    customer: SelectCustomerSchema,
    asset: SelectAssetSchema,
    user: SelectUserSchema,
    startDate: z.string(),
    endDate: z.string(),
})

export type ExtendedSelectBooking = z.infer<typeof ExtendedSelectBookingSchema>

export const slotContract = c.router({
    getAssetStatus: {
        method: 'GET',
        path: '/asset-status/:id',
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
        path: '/asset-availability',
        responses: {
            201: z.object({
                message: z.string(),
            })
        },
        body: z.object({
            assetId: z.string(),
            startDate: z.string(),
            endDate: z.string(),
            available: z.boolean(),
            price: z.string(),
        }),
        summary: 'Create a new asset availability'
    },
    getAssetAvailability: {
        method: 'GET',
        path: '/asset-availability/:id',
        responses: {
            200: z.array(z.object({
                startDate: z.string(),
                endDate: z.string(),
                available: z.boolean(),
                price: z.string(),
            }))
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Get asset availability by id'
    },
    
})