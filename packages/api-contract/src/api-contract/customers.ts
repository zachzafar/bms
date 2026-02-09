import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { InsertCustomerSchema, InsertCustomerTypeSchema, SelectCustomerSchema, SelectCustomerTypeSchema } from "../database-schema";
import { pagination } from './utils';

const c = initContract();

export const customerContract = c.router({
    createCustomer: {
        method: "POST",
        path: "/customers",
        body: InsertCustomerSchema.omit({ tenantId: true, id: true, createdAt: true, updatedAt: true }),
        responses: {
            200: z.object({
                id: z.number(),
            }),
        },
        summary: "Create a new customer"
    },
    getCustomers: {
        method: "GET",
        path: "/customers",
        responses: {
            200: z.object({
                data: z.array(SelectCustomerSchema),
                pagination
            }),
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
            search: z.string().optional(),
        }),
        summary: "Get all customers"
    },

    // ==================== CUSTOMER TYPES ====================
    // These must be defined BEFORE /customers/:id to avoid route conflicts
    createCustomerType: {
        method: "POST",
        path: "/customers-types",
        body: InsertCustomerTypeSchema.omit({ tenantId: true, id: true, createdAt: true, updatedAt: true, deletedAt: true }),
        responses: {
            200: z.object({
                id: z.number(),
            }),
        },
        summary: "Create a new customer type"
    },
    getCustomerTypes: {
        method: "GET",
        path: "/customers-types",
        responses: {
            200: z.object({
                data: z.array(SelectCustomerTypeSchema),
                pagination
            }),
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: "Get all customer types"
    },
    getCustomerType: {
        method: "GET",
        path: "/customers/types/:id",
        responses: {
            200: SelectCustomerTypeSchema,
            404: z.object({ message: z.string() }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Get a customer type by ID"
    },
    updateCustomerType: {
        method: "PUT",
        path: "/customers/types/:id",
        body: InsertCustomerTypeSchema.omit({ tenantId: true, id: true, createdAt: true, updatedAt: true, deletedAt: true }).partial(),
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Update a customer type"
    },
    deleteCustomerType: {
        method: "DELETE",
        path: "/customers/types/:id",
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        body: z.object({}).optional(),
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Delete a customer type"
    },

    // ==================== INDIVIDUAL CUSTOMER ====================
    // Dynamic :id routes must come AFTER static /types routes
    getCustomer: {
        method: "GET",
        path: "/customers/:id",
        responses: {
            200: SelectCustomerSchema,
            404: z.object({ message: z.string() }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Get a customer by ID"
    },
    updateCustomer: {
        method: "PUT",
        path: "/customers/:id",
        body: InsertCustomerSchema.omit({ tenantId: true, id: true, createdAt: true, updatedAt: true }).partial(),
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Update a customer"
    },
    deleteCustomer: {
        method: "DELETE",
        path: "/customers/:id",
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        body: z.object({}).optional(),
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Delete a customer"
    },
});
