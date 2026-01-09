import { initContract } from "@ts-rest/core";

import { z } from "zod";

import { InsertBlockedDateSchema, InsertBookingSchema, InsertCustomerSchema, SelectAssetSchema, SelectBookingSchema, SelectCustomerSchema, SelectUserSchema, UpdateBlockedDateSchema, UpdateBookingSchema } from "../database-schema";
import { pagination } from './utils';


const c = initContract();

export const ExtendedSelectBookingSchema = SelectBookingSchema.omit({ startDate: true, endDate: true }).extend({
    customer: SelectCustomerSchema,
    asset: SelectAssetSchema,
    user: SelectUserSchema.omit({ roles: true }),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
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
            customers: z.array(z.coerce.number()),
        }),

        summary: 'Create a new booking'
    },
    getBookings: {
        method: 'GET',
        path: '/booking',
        responses: {
            200: z.object({
                data: z.array(ExtendedSelectBookingSchema),
                pagination
            })
        },
        query: z.object({
            search: z.string().optional(),
            assetId: z.string().optional(),
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
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
            tagId: z.coerce.number(),
            startDate: z.coerce.date(),
            endDate: z.coerce.date(),
            customerIds: z.array(z.coerce.number())
        })
    },
    checkTagAvailability: {
        method: 'GET',
        path: '/booking/availability/by-tag',
        query: z.object({
            tagId: z.coerce.number(),
        }),
        responses: {
            200: z.array(z.object({
                from: z.coerce.date(),
                to: z.coerce.date(),
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
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
          title: z.string().min(1, "Title is required"),
          reason: z.string().optional(),
          createdAt: z.coerce.date(),
          updatedAt: z.coerce.date().optional(),
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
    pathParams: z.object({ id: z.coerce.number() }),
    body: UpdateBlockedDateSchema,
    responses: {
      200: z.object({ message: z.string() }),
    },
    summary: "Update a blocked date by ID",
  },

  deleteBlockedDate: {
    method: "DELETE",
    path: "/blocked-dates/:id",
    pathParams: z.object({ id: z.coerce.number() }),
    body: z.object({}).optional(),
    responses: {
      204: z.undefined(),
    },
    summary: "Delete a blocked date by ID",
  },

  updateBookingByToken: {
    method: "PUT",
    path:"/update-booking-by-token/:token/:bookingId",
    body:UpdateBookingSchema,
    responses: {
      200: z.object({ message: z.string()}),
      403: z.undefined()
    },
    pathParams: z.object({token: z.string(),bookingId:z.string()}),
    summary: 'create and share token for updating '
  },
  customerCreateBooking: {
    method: "POST",
    path:"/customer-create-booking/:tenantId",
    pathParams: z.object({
      tenantId:z.string()
    }),
    body: z.object({
      booking: InsertBookingSchema,
      customer: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
      })
    }),
    responses: {
      201: z.object({ message: z.string()})
    },
    summary: 'endpoint for unauthenticated new customers to create bookings'
  },

  customerViewBooking: {
    method: 'GET',
    path: '/customer-view-booking/:bookingId/:token',
    pathParams: z.object({
      bookingId: z.string(),
      token:z.string(),
    }),
    responses: {
      200: ExtendedSelectBookingSchema
    }
  },

  // Update booking status
  updateBookingStatus: {
    method: 'PATCH',
    path: '/booking/:id/status',
    pathParams: z.object({
      id: z.string()
    }),
    body: z.object({
      status: z.enum(["Pending", "Confirmed", "Cancelled"])
    }),
    responses: {
      200: z.object({ message: z.string() }),
      404: z.undefined()
    },
    summary: 'Update booking status'
  }
});