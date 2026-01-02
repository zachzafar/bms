import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertAssetPropertySchema, SelectAssetPropertySchema, UpdateAssetPropertySchema } from "../../database-schema";

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
            200: SelectAssetPropertySchema,
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
            200: z.array(SelectAssetPropertySchema)
        },
        summary: 'Get all asset properties'
    },

})