import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  InsertRateSchema,
  SelectRateSchema,
  UpdateRateSchema,
} from "../database-schema";

const c = initContract();

export const rateContract = c.router({
  createRate: {
    method: "POST",
    path: "/rate",
    summary: "Create a new rate",
    body: InsertRateSchema,
    responses: {
      201: z.object({
        message: z.string(),
        rateId: z.number(),
      }),
      400: z.object({
        message: z.string(),
      }),
    },
  },

  getRates: {
  method: "GET",
  path: "/rate",
  summary: "Get all rates, optionally filtered by assetId",
  query: z.object({
    assetId: z.string().optional(),
  }),
  responses: {
    200: z.array(
      z.object({
        rate: SelectRateSchema,
        assetIds: z.array(z.string()),
      })
    ),
  },
},


  getRate: {
    method: "GET",
    path: "/rate/:id",
    summary: "Get a rate by ID",
    pathParams: z.object({
      id: z.number(),
    }),
    responses: {
      200: SelectRateSchema,
      404: z.undefined(),
    },
  },

  updateRate: {
    method: "PUT",
    path: "/rate/:id",
    summary: "Update a rate by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: UpdateRateSchema,
    responses: {
      200: z.object({
        message: z.string(),
      }),
      400: z.object({
        message: z.string(),
      }),
    },
  },

  deleteRate: {
    method: "DELETE",
    path: "/rate/:id",
    summary: "Delete a rate by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({}).optional(),
    responses: {
      204: z.undefined(),
    },
  },
});
