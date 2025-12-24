import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { Asset, InsertAssetPropertySchema, InsertAssetTypeSchema, SelectAssetPropertySchema, SelectAssetTypeSchema, UpdateAssetTypeSchema } from "../../database-schema";

const c = initContract();

export const AssetTypeWithPropertiesSchema = z.object({
    assetType: InsertAssetTypeSchema,
    properties: z.array(z.number())
})

export const SelectAssetTypeWithPropertiesSchema = z.object({
    assetType: SelectAssetTypeSchema,
    properties: z.array(z.number())
})

export type SelectAssetTypeWithProperties = z.infer<typeof SelectAssetTypeWithPropertiesSchema>
export type AssetTypeWithProperties = z.infer<typeof AssetTypeWithPropertiesSchema>

export const assetTypeContract = c.router({
    createAssetType: {
        method: 'POST',
        path: '/asset-type',
        body: AssetTypeWithPropertiesSchema,
        responses: {
            201: z.object({
                id: z.number(),
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
            200: z.object({
                assetType: SelectAssetTypeSchema,
                properties: z.array(SelectAssetPropertySchema)
            }),
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Get asset type by id'
    },
    updateAssetType: {
        method: 'PUT',
        path: '/asset-type/:id',
        body: z.object({
            assetType: UpdateAssetTypeSchema,
            properties: z.array(z.number())
    }),
        responses: {
            200: z.null()
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Update asset type by id'
    },
    deleteAssetType: {
        method: 'DELETE',
        path: '/asset-type/:id',
        body: z.undefined(),
        responses: {
            200: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Delete asset type by id'
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