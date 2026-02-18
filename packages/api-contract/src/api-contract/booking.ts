import { initContract } from "@ts-rest/core";

import { z } from "zod";

import { InsertBookingSchema, SelectAssetSchema, SelectAssetTypeSchema, SelectBookingSchema, SelectCustomerSchema, UpdateBookingSchema } from "../database-schema";
import { pagination } from './utils';


const c = initContract();

export const BookingAddonSelectionSchema = z.object({
  addonItemId: z.number(),
  quantity: z.number().min(1),
});

export const BookingAddonResponseSchema = z.object({
  id: z.number(),
  addonItemId: z.number(),
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.string(),
  billingType: z.string(),
  totalPrice: z.string(),
});

export const BookingFormResponseSchema = z.object({
    id: z.number(),
    formFieldId: z.number(),
    value: z.string(),
    fieldName: z.string(),
    fieldType: z.string(),
});

export const ExtendedSelectBookingSchema = SelectBookingSchema.omit({ startDate: true, endDate: true }).extend({
    customer: SelectCustomerSchema.nullable().optional(),
    asset: SelectAssetSchema,
    assetType: SelectAssetTypeSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    formResponses: z.array(BookingFormResponseSchema).optional(),
    addons: z.array(BookingAddonResponseSchema).optional(),
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
            addons: z.array(BookingAddonSelectionSchema).optional(),
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
            customerIds: z.array(z.coerce.number()),
            addons: z.array(BookingAddonSelectionSchema).optional(),
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
      }),
      formResponses: z.array(z.object({
        formFieldId: z.number(),
        value: z.string()
      })).optional(),
      addons: z.array(BookingAddonSelectionSchema).optional(),
    }),
    responses: {
      201: z.object({ message: z.string()})
    },
    summary: 'endpoint for unauthenticated new customers to create bookings'
  },

  customerCreateBookingByAssetType: {
    method: "POST",
    path: "/customer-create-booking-by-asset-type/:tenantId",
    pathParams: z.object({
      tenantId: z.string()
    }),
    body: z.object({
      assetTypeId: z.number(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      customer: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
      }),
      formResponses: z.array(z.object({
        formFieldId: z.number(),
        value: z.string()
      })).optional(),
      addons: z.array(BookingAddonSelectionSchema).optional(),
    }),
    responses: {
      201: z.object({
        message: z.string(),
        assetName: z.string(),
      }),
      404: z.object({
        message: z.string()
      })
    },
    summary: 'Create booking by tag - automatically assigns an available asset with the tag'
  },

  customerViewBooking: {
    method: 'GET',
    path: '/customer-view-booking/:bookingId/:token',
    pathParams: z.object({
      bookingId: z.string(),
      token:z.string(),
    }),
    responses: {
      200: ExtendedSelectBookingSchema,
      403: z.undefined()
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
  },

  // Cancel booking by token (customer-facing)
  cancelBookingByToken: {
    method: 'POST',
    path: '/cancel-booking-by-token/:token/:bookingId',
    pathParams: z.object({
      token: z.string(),
      bookingId: z.string()
    }),
    body: z.object({}),
    responses: {
      200: z.object({ message: z.string() }),
      403: z.undefined(),
      404: z.undefined()
    },
    summary: 'Cancel booking using update token (customer-facing)'
  },

  // Owner-specific endpoints
  getOwnerBookings: {
    method: 'GET',
    path: '/owner/bookings',
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
    summary: 'Get bookings for owner assets only'
  },

  getOwnerBooking: {
    method: 'GET',
    path: '/owner/bookings/:id',
    responses: {
      200: ExtendedSelectBookingSchema,
      403: z.undefined(),
      404: z.undefined()
    },
    pathParams: z.object({
      id: z.string()
    }),
    summary: 'Get a specific booking if owner owns the asset'
  }
});