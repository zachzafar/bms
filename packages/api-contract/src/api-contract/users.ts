
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { InsertUserSchema, SelectUserSchema } from "../database-schema";


const c = initContract();

export const userContract = c.router({
    createUser: {
        method: "POST",
        path: "/users/:id",
        body:  z.object({
             user: InsertUserSchema,
             customer : z.boolean(),
             owner: z.boolean(),
             roles: z.array(z.number()),
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
        path: "/users/:tenant",
        responses: {
            200: z.array(SelectUserSchema),
        },
        summary: "Get all users"
    },
    updateUser: {
        method: "PUT",
        path: "/users/:id",
        body: InsertUserSchema.partial(),
        
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
        pathParams: z.object({
            id: z.string(),
        }),
        summary: "Delete a user"
    },  



})