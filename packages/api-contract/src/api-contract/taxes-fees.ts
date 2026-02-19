import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  InsertTaxFeeSchema,
  SelectTaxFeeSchema,
  UpdateTaxFeeSchema,
} from "../database-schema";
import { pagination } from "./utils";

const c = initContract();

export const taxesFeesContract = c.router({
  createTaxFee: {
    method: "POST",
    path: "/tax-fee",
    summary: "Create a new tax or fee",
    body: InsertTaxFeeSchema,
    responses: {
      201: z.object({
        message: z.string(),
        taxFeeId: z.number(),
      }),
    },
  },

  getTaxFees: {
    method: "GET",
    path: "/tax-fee",
    summary: "Get all taxes and fees for tenant",
    query: z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(SelectTaxFeeSchema),
        pagination,
      }),
    },
  },

  getTaxFee: {
    method: "GET",
    path: "/tax-fee/:id",
    summary: "Get a tax/fee by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: SelectTaxFeeSchema,
      404: z.undefined(),
    },
  },

  updateTaxFee: {
    method: "PUT",
    path: "/tax-fee/:id",
    summary: "Update a tax/fee by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: UpdateTaxFeeSchema,
    responses: {
      200: z.object({
        message: z.string(),
      }),
    },
  },

  deleteTaxFee: {
    method: "DELETE",
    path: "/tax-fee/:id",
    summary: "Delete a tax/fee by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({}).optional(),
    responses: {
      204: z.undefined(),
    },
  },

  // Public endpoint (by subdomain)
  getPublicTaxFees: {
    method: "GET",
    path: "/tax-fees-by-sub/:subdomain",
    summary: "Get active taxes and fees for a tenant by subdomain (public)",
    pathParams: z.object({
      subdomain: z.string(),
    }),
    responses: {
      200: z.array(SelectTaxFeeSchema),
      404: z.object({ message: z.string() }),
    },
  },
});
