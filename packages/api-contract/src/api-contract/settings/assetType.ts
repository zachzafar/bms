import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertAssetTypeSchema, SelectAssetTypeSchema, UpdateAssetTypeSchema } from "../../database-schema";

const c = initContract();

export const assetTypeContract = c.router({
    createAssetType: {
        method: 'POST',
        path: '/asset-type',
        body: z.object({
            assetType: InsertAssetTypeSchema
        }),
        responses: {
            201: z.object({
                assetType: SelectAssetTypeSchema
            })
        },
        summary: 'Create a new asset type'
    },
    getAssetTypes: {
        method: 'GET',
        path: '/asset-type',
        responses: {
            200: z.array(SelectAssetTypeSchema)
        },
        summary: 'Get all asset types'
    },
    getAssetType: {
        method: 'GET',
        path: '/asset-type/:id',
        responses: {
            200: SelectAssetTypeSchema,
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Get asset type by id'
    },
    updateAssetType: {
        method: 'PUT',
        path: '/asset-type/:id',
        body: z.object({
            assetType: UpdateAssetTypeSchema
        }),
        responses: {
            200: SelectAssetTypeSchema
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Update asset type by id'
    },
    deleteAssetType: {
        method: 'DELETE',
        path: '/asset-type/:id',
        responses: {
            200: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Delete asset type by id'}
})