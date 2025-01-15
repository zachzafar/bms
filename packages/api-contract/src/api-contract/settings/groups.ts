import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertGroupSchema, SelectGroupSchema, UpdateGroupSchema } from "../../database-schema";


const c = initContract();

export const groupsContract = c.router({
    createGroup: {
        method: 'POST',
        path: '/group',
        body: z.object({
            group: InsertGroupSchema
        }),
        responses: {
            201: z.object({
                group: SelectGroupSchema
            }),
            500: z.object({
                message: z.string()
            }),
        },
        summary: 'Create a new group'
    },
    getGroups: {
        method: 'GET',
        path: '/group',
        responses: {
            200: z.array(SelectGroupSchema)
        },
        summary: 'Get all groups'
    },
    getGroup: {
        method: 'GET',
        path: '/group/:id',
        responses: {
            200: SelectGroupSchema,
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Get group by id'
    },
    updateGroup: {
        method: 'PUT',
        path: '/group/:id',
        body: z.object({
            group: UpdateGroupSchema
        }),
        responses: {
            200: SelectGroupSchema
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Update group by id'
    },
    deleteGroup: {
        method: 'DELETE',
        path: '/group/:id',
        responses: {
            200: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Delete group by id'
    }
})