
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { InsertCustomerSchema, InsertOwnerSchema, InsertUserSchema, SelectCustomerSchema, SelectOwnerSchema, SelectUserSchema, UpdateCustomerSchema, UpdateOwnerSchema } from "../database-schema";


const c = initContract();

export const userContract = c.router({
    createUser: {
        method: "POST",
        path: "/users/",
        body:   InsertUserSchema.extend({
             roles: z.array(z.coerce.number()),
             ownerDetails: InsertOwnerSchema.omit({tenantId: true, userId: true, }).optional(),
             customerDetails: InsertCustomerSchema.omit({ tenantId: true, userId: true, dateOfBirth: true}).extend({ dateOfBirth: z.string().optional()}).optional(),
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
            200: z.array(SelectUserSchema.extend({ roles: z.array(z.number())})),
        },
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
        body: z.undefined(),
        pathParams: z.object({
            id: z.string(),
        }),
        summary: "Delete a user"
    },
    getCustomers: {
        method: "GET",
        path: "/customers",
        responses: {
            200: z.array(z.object({customer:SelectCustomerSchema,user: SelectUserSchema.omit({roles: true})})),
        },
        summary: "Get all customers"
    },
    getOwners: {
        method: "GET",
        path: "/owners",
        responses: {
            200: z.array(z.object({owner:SelectOwnerSchema,user: SelectUserSchema.omit({roles: true})})),
        },
        summary: "Get all owners"
    }
})