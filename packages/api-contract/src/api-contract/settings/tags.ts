import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertTagSchema, SelectTagSchema } from "../../database-schema";
import { pagination } from "../utils";

const c = initContract();

export const tagsContract = c.router({
    createTag: {
        method: 'POST',
        path: '/tags',
        body: InsertTagSchema,
        responses: {
            201: z.object({
                id: z.coerce.number(),
            })
        },
        summary: 'Create a new tag'
    },
    getTag: {
        method: 'GET',
        path: '/tags/:id',
        responses: {
            200: SelectTagSchema,
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: 'Get a tag'
    },
    deleteTag: {
        method: 'DELETE',
        path: '/tags/:id',
        body: z.object({}).optional(),
        responses: {
            200: z.object({
                message: z.string(),
            }),
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: 'Delete a tag'
    },
    getTags: {
        method: 'GET',
        path: '/tags',
        responses: {
            200: z.object({
                data: z.array(SelectTagSchema),
                pagination
            })
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: 'Get all tags'
    },
});