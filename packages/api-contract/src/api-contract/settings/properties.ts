import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertAssetPropertySchema, SelectAssetPropertyOptionSchema, SelectAssetPropertySchema, UpdateAssetPropertySchema } from "../../database-schema";
import { pagination } from "../utils";

const PropertyWithOptionsSchema = SelectAssetPropertySchema.extend({
    options: z.array(SelectAssetPropertyOptionSchema),
});

const c = initContract();


export const propertiesContract = c.router({
    createProperty: {
        method: 'POST',
        path: '/properties',
        body: InsertAssetPropertySchema,
        responses: {
            201: z.object({
                id: z.number(),
            })
        },
        summary: 'Create a new asset property'
    },
    getProperty: {
        method: 'GET',
        path: '/properties/:id',
        responses: {
            200: PropertyWithOptionsSchema,
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Get a asset property'
    },

    updateProperty: {
        method: 'PUT',
        path: '/properties/:id',
        body: UpdateAssetPropertySchema,
        responses: {
            200: z.object({
                id: z.number(),
            }),
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Update a asset property'
    },
    deleteProperty: {
        method: 'DELETE',
        path: '/properties/:id',
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
        summary: 'Delete a asset property'
    },
    getProperties: {
        method: 'GET',
        path: '/properties',
        responses: {
            200: z.object({
                data: z.array(PropertyWithOptionsSchema),
                pagination
            })
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: 'Get all asset properties'
    },

    getPropertyOptions: {
        method: 'GET',
        path: '/properties/:id/options',
        pathParams: z.object({ id: z.coerce.number() }),
        responses: {
            200: z.array(SelectAssetPropertyOptionSchema),
            404: z.object({ message: z.string() }),
        },
        summary: 'Get preconfigured options for a select/multi_select property',
    },

    setPropertyOptions: {
        method: 'PUT',
        path: '/properties/:id/options',
        pathParams: z.object({ id: z.coerce.number() }),
        body: z.object({
            options: z.array(z.string().min(1)),
        }),
        responses: {
            200: z.array(SelectAssetPropertyOptionSchema),
            404: z.object({ message: z.string() }),
        },
        summary: 'Replace all options for a select/multi_select property',
    },

})