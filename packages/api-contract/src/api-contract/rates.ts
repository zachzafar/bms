import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  InsertRateSchema,
  SelectRateSchema,
  UpdateRateSchema,
  InsertRateTypeSchema,
  SelectRateTypeSchema,
  UpdateRateTypeSchema,
} from "../database-schema";
import { pagination } from "./utils";

const c = initContract();

export const rateContract = c.router({
  // --- Rate CRUD ---

  createRate: {
    method: "POST",
    path: "/rate",
    summary: "Create a new rate",
    body: InsertRateSchema.extend({ assetIds: z.array(z.string())}),
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
      assetIds: z.array(z.string()).optional()
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

  // --- RateType CRUD ---

  createRateType: {
    method: "POST",
    path: "/rate-type",
    summary: "Create a new rate type",
    body: InsertRateTypeSchema,
    responses: {
      201: z.object({
        message: z.string(),
        rateTypeId: z.number(),
      }),
      400: z.object({
        message: z.string(),
      }),
    },
  },

  getRateTypes: {
    method: "GET",
    path: "/rate-type",
    summary: "Get all rate types for tenant",
    query: z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(SelectRateTypeSchema),
        pagination,
      }),
    },
  },

  updateRateType: {
    method: "PUT",
    path: "/rate-type/:id",
    summary: "Update a rate type by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: UpdateRateTypeSchema,
    responses: {
      200: z.object({
        message: z.string(),
      }),
      400: z.object({
        message: z.string(),
      }),
    },
  },

  deleteRateType: {
    method: "DELETE",
    path: "/rate-type/:id",
    summary: "Delete a rate type by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({}).optional(),
    responses: {
      204: z.undefined(),
    },
  },
});
