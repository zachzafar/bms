
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { InsertCustomerSchema, InsertCustomerTypeSchema, InsertOwnerSchema, InsertUserSchema, SelectCustomerSchema, SelectCustomerTypeSchema, SelectOwnerSchema, SelectUserSchema, UpdateCustomerSchema, UpdateOwnerSchema } from "../database-schema";
import { pagination } from './utils';


const c = initContract();

export const userContract = c.router({
    createUser: {
        method: "POST",
        path: "/users/",
        body:   InsertUserSchema.extend({
             roles: z.array(z.coerce.number()),
             ownerDetails: InsertOwnerSchema.omit({tenantId: true, userId: true, }).optional(),
             customerDetails: InsertCustomerSchema.omit({ tenantId: true, userId: true}).extend({ dateOfBirth: z.string().optional()}).optional(),
            }),
        responses: {
            200: z.object({
                id: z.string(),
            }),
        },
        summary: "Create a new user"
    },
    getUser: {
        method: "GET",
        path: "/users/:tenant/:id",
        responses: {
            200: z.object({
                id: z.string(),
            }),
        },
        pathParams: z.object({
            id: z.string(),
        }),
        summary: "Get a user"
    },
    getUsers: {
        method: "GET",
        path: "/users/",
        responses: {
            200: z.object({
                data: z.array(SelectUserSchema),
                pagination
            }),
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: "Get all users"
    },
    updateUser: {
        method: "PUT",
        path: "/users/:id",
        body:  z.object({
            user: InsertUserSchema.partial(),
            customer : UpdateCustomerSchema.partial().optional(),
            owner: UpdateOwnerSchema.partial().optional(),
            roles: z.array(z.coerce.number()),
           }),
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        pathParams: z.object({
            id: z.string(),
        }),
        summary: "Update a user"
    },
    deleteUser: {
        method: "DELETE",
        path: "/users/:id",
        responses: {
            200: z.object({
                id: z.string(),
            }),
        },
        body: z.object({}).optional(),
        pathParams: z.object({
            id: z.string(),
        }),
        summary: "Delete a user"
    },
    getCustomers: {
        method: "GET",
        path: "/customers",
        responses: {
            200: z.object({
                data: z.array(z.object({customer:SelectCustomerSchema,user: SelectUserSchema.omit({roles: true})})),
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
    getOwners: {
        method: "GET",
        path: "/owners",
        responses: {
            200: z.object({
                data: z.array(z.object({owner:SelectOwnerSchema,user: SelectUserSchema.omit({roles: true})})),
                pagination
            }),
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
            search: z.string().optional(),
        }),
        summary: "Get all owners"
    },

    // ==================== CUSTOMER TYPES ====================
    createCustomerType: {
        method: "POST",
        path: "/customer-types",
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
        path: "/customer-types",
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
        path: "/customer-types/:id",
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
        path: "/customer-types/:id",
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
        path: "/customer-types/:id",
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
    }
})