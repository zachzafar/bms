import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertTagSchema, SelectTagSchema } from "../../database-schema";
import { pagination } from "../utils";

const c = initContract();

const UpdateTagSchema = InsertTagSchema.partial();

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
    updateTag: {
        method: 'PUT',
        path: '/tags/:id',
        body: UpdateTagSchema,
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        responses: {
            200: z.object({
                message: z.string(),
            }),
            404: z.object({
                message: z.string()
            })
        },
        summary: 'Update a tag'
    },
    uploadTagImage: {
        method: 'POST',
        path: '/tags/:id/image',
        contentType: 'multipart/form-data',
        body: c.type<{ image: File }>(),
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        responses: {
            200: z.object({
                message: z.string(),
                imagePath: z.string(),
            }),
            404: z.object({
                message: z.string()
            })
        },
        summary: 'Upload an image for a tag'
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
    getTagsBySubdomain: {
        method: 'GET',
        path: '/tags-by-sub/:subdomain',
        pathParams: z.object({
            subdomain: z.string(),
        }),
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        responses: {
            200: z.object({
                data: z.array(z.object({
                    id: z.number(),
                    name: z.string(),
                    slug: z.string().nullable(),
                    description: z.string().nullable(),
                    tagImage: z.string().nullable(),
                })),
                pagination
            }),
            404: z.object({
                message: z.string()
            })
        },
        summary: 'Get tags by tenant subdomain (public)'
    },
    checkTagSlug: {
        method: 'GET',
        path: '/tags/check-slug',
        query: z.object({
            slug: z.string(),
            excludeId: z.coerce.number().optional(),
        }),
        responses: {
            200: z.object({ available: z.boolean() }),
        },
        summary: 'Check if a tag slug is available',
    },
});