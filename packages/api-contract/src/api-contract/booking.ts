import { initContract } from "@ts-rest/core";

import { z } from "zod";

import { InsertBlockedDateSchema, InsertBookingSchema, SelectAssetSchema, SelectBookingSchema, SelectCustomerSchema, SelectUserSchema, UpdateBlockedDateSchema, UpdateBookingSchema } from "./zod";


const c = initContract();

export const ExtendedSelectBookingSchema = SelectBookingSchema.omit({ startDate: true, endDate: true }).extend({
    customer: SelectCustomerSchema,
    asset: SelectAssetSchema,
    user: SelectUserSchema.omit({ roles: true }),
    startDate: z.string(),
    endDate: z.string(),
})

export type ExtendedSelectBooking = z.infer<typeof ExtendedSelectBookingSchema>

export const bookingContract = c.router({
    createBooking: {
        method: 'POST',
        path: '/booking',
        responses: {
            201: z.object({
                message: z.string(),
                bookingId: z.string(),
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
            assetId: z.string().optional(),
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
        method: 'DELETE',
        path: '/booking/:id',
        responses: {
            204: z.undefined()
        },
        pathParams: z.object({
            id: z.string()
        }),
        body: z.object({}).optional(),
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
    createBookingByTag: {
        method: 'POST',
        path: '/bookings/by-tag',
        responses: {
            201: z.object({
                message: z.string(),
                assetId: z.string(),
                bookingId: z.string()
            })
        },
        body: z.object({
            tagId: z.number(),
            startDate: z.string(),
            endDate: z.string(),
            customerIds: z.array(z.number())
        })
    },
    checkTagAvailability: {
        method: 'GET',
        path: '/booking/availability/by-tag',
        query: z.object({
            tagId: z.string(),
        }),
        responses: {
            200: z.array(z.object({
                from: z.string(),
                to: z.string(),
            })),
            400: z.object({ message: z.string() }),
        },
        summary: 'Get blocked date ranges for a tag',
    },
// Blocked Dates routes
  getBlockedDates: {
    method: "GET",
    path: "/blocked-dates",
    query: z
      .object({
        assetId: z.string().optional(), // optional filter by asset
      })
      .optional(),
    responses: {
      200: z.array(
        z.object({
          id: z.number(),
          tenantId: z.string(),
          assetId: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          title: z.string().min(1, "Title is required"),
          reason: z.string().optional(),
          createdAt: z.string(),
          updatedAt: z.string(),
        })
      ),
    },
    summary: "Get all blocked dates, optionally filtered by asset",
  },

  createBlockedDate: {
    method: "POST",
    path: "/blocked-dates",
    body: InsertBlockedDateSchema,
    responses: {
      201: z.object({
        message: z.string(),
        blockedDateId: z.number(),
      }),
    },
    summary: "Create a new blocked date",
  },

  updateBlockedDate: {
    method: "PUT",
    path: "/blocked-dates/:id",
    pathParams: z.object({ id: z.number() }),
    body: UpdateBlockedDateSchema,
    responses: {
      200: z.object({ message: z.string() }),
    },
    summary: "Update a blocked date by ID",
  },

  deleteBlockedDate: {
    method: "DELETE",
    path: "/blocked-dates/:id",
    pathParams: z.object({ id: z.string() }),
    body: z.object({}).optional(),
    responses: {
      204: z.undefined(),
    },
    summary: "Delete a blocked date by ID",
  },
});