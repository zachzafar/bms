
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { InsertUserSchema, SelectUserSchema } from "../database-schema";
import { pagination } from './utils';


const c = initContract();

export const userContract = c.router({
    createUser: {
        method: "POST",
        path: "/users/",
        body: InsertUserSchema.extend({
             roles: z.array(z.coerce.number()),
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
        body: z.object({
            user: InsertUserSchema.partial(),
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
})
