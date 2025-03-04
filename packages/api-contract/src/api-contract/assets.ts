import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertAssetSchema, SelectAssetSchema } from "../database-schema";


const c = initContract();

export const assetsContract = c.router({
    createAsset : {
        method: 'POST',
        path: '/asset',
        responses: {
            201: z.object({
                id: z.string(),
            })
            
        },
        headers: z.object({
            tenant: z.string().optional(),
        }),
        body: z.object({
            tenant: z.string(),     
            asset: InsertAssetSchema.omit({ tenantId: true})
        }),
        summary: 'Create a new asset'
    },
    getAssets: {
        method: 'GET',
        path: '/asset',
        responses: {
            200: z.array(SelectAssetSchema)
        },
        headers: z.object({
            tenant: z.string(),
        }),
        query: z.object({
            search: z.string().optional(),
        }),
        summary: 'Get all assets'
    },
    getAsset: {
        method: 'GET',
        path: '/asset/:id',
        responses: {
            200: SelectAssetSchema,
            404: z.undefined()
        },
        headers: z.object({
            tenant: z.string(),
        }),
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Get an asset by id'
    },
    updateAsset: {
        method: 'PUT',
        path: '/asset/:id',
        responses: {
            200: SelectAssetSchema
        },
        headers: z.object({
            tenant: z.string(),
        }),
        pathParams: z.object({
            id: z.string()
        }),
        body: InsertAssetSchema.partial(),
        summary: 'Update an asset by id'
    },
    deleteAsset: {
        method: 'DELETE',
        path: '/asset/:id',
        responses: {
            204: z.undefined()
        },
        headers: z.object({
            tenant: z.string(),
        }),
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Delete an asset by id'
    },
    addAssetProperties: {
        method: 'POST',
        path: '/asset/:id/properties',
        responses: {
            200: z.object({
                message: z.string(),
            })
        },
        headers: z.object({
            tenant: z.string(),
        }),
        pathParams: z.object({
            id: z.string()
        }),
        body: z.object({
            properties: z.array(z.object({
                propertyId: z.string(),
                value: z.string()
            }))
        }),
        summary: 'Add properties to an asset'
    },
})