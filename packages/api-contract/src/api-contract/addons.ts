import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  InsertAddonItemSchema,
  SelectAddonItemSchema,
  UpdateAddonItemSchema,
} from "../database-schema";
import { pagination } from "./utils";

const c = initContract();

export const addonsContract = c.router({
  createAddon: {
    method: "POST",
    path: "/addon",
    summary: "Create a new add-on item",
    body: InsertAddonItemSchema,
    responses: {
      201: z.object({
        message: z.string(),
        addonId: z.number(),
      }),
    },
  },

  getAddons: {
    method: "GET",
    path: "/addon",
    summary: "Get all add-ons for tenant",
    query: z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(SelectAddonItemSchema),
        pagination,
      }),
    },
  },

  getAddon: {
    method: "GET",
    path: "/addon/:id",
    summary: "Get an add-on by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: SelectAddonItemSchema,
      404: z.undefined(),
    },
  },

  updateAddon: {
    method: "PUT",
    path: "/addon/:id",
    summary: "Update an add-on by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: UpdateAddonItemSchema,
    responses: {
      200: z.object({
        message: z.string(),
      }),
    },
  },

  deleteAddon: {
    method: "DELETE",
    path: "/addon/:id",
    summary: "Delete an add-on by ID",
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({}).optional(),
    responses: {
      204: z.undefined(),
    },
  },

  // Public endpoint (by subdomain)
  getPublicAddons: {
    method: "GET",
    path: "/addons-by-sub/:subdomain",
    summary: "Get active add-ons for a tenant by subdomain (public)",
    pathParams: z.object({
      subdomain: z.string(),
    }),
    responses: {
      200: z.array(SelectAddonItemSchema),
      404: z.object({ message: z.string() }),
    },
  },
});
