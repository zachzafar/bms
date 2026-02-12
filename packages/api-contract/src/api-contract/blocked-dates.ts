import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { InsertBlockedDateSchema, UpdateBlockedDateSchema } from "../database-schema";

const c = initContract();

export const BlockedDateSchema = z.object({
  id: z.number(),
  tenantId: z.string(),
  assetId: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  title: z.string().min(1, "Title is required"),
  reason: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const blockedDatesContract = c.router({
  getBlockedDates: {
    method: "GET",
    path: "/blocked-dates",
    query: z
      .object({
        assetId: z.string().optional(),
      })
      .optional(),
    responses: {
      200: z.array(BlockedDateSchema),
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

  // Public endpoint to get blocked dates for an asset (for customer booking page)
  getBlockedDatesForAssetPublic: {
    method: 'GET',
    path: '/public/blocked-dates/:assetId',
    pathParams: z.object({
      assetId: z.string()
    }),
    responses: {
      200: z.array(z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      }))
    },
    summary: 'Get blocked date ranges for an asset (public endpoint for customer booking)'
  },

  // Public endpoint to get blocked dates for a tag (for customer tag booking page)
  getBlockedDatesForAssetTypePublic: {
    method: 'GET',
    path: '/public/blocked-dates/assetType/:assetTypeId',
    pathParams: z.object({
      assetTypeId: z.coerce.number()
    }),
    query: z.object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional()
    }).optional(),
    responses: {
      200: z.array(z.object({
        start: z.coerce.date(),
        end: z.coerce.date(),
      }))
    },
    summary: 'Get fully blocked date ranges for a tag (public endpoint for customer booking)'
  },
});
