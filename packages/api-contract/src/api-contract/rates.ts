import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  InsertRateSchema,
  SelectRateSchema,
  UpdateRateSchema,
} from "../database-schema";
import { pagination } from "./utils";

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
  summary: "Get all rates, optionally filtered by assetId or assetTypeId",
  query: z.object({
    assetId: z.string().optional(),
    assetTypeId: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
    pageSize: z.coerce.number().optional(),
  }),
  responses: {
    200: z.object({
      data: z.array(
        z.object({
          rate: SelectRateSchema,
          assetIds: z.array(z.string()),
          assetTypeIds: z.array(z.number()).optional(),
        })
      ),
      pagination
    })
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
    body: UpdateRateSchema.extend({
      assetTypeIds: z.array(z.number()).optional(),
    }),
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
