import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { Asset, InsertAssetPropertySchema, InsertAssetTypeSchema, SelectAssetPropertySchema, SelectAssetTypeSchema, UpdateAssetTypeSchema, SelectBookingFormSchema, SelectTagSchema } from "../../database-schema";
import { pagination } from "../utils";

const c = initContract();

export const AssetTypeWithPropertiesSchema = z.object({
    assetType: InsertAssetTypeSchema,
    properties: z.array(z.number()),
    forms: z.array(z.number()),
    tagIds: z.array(z.number()).optional()
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
            200: z.object({
                data: z.array(SelectAssetTypeSchema),
                pagination
            })
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: 'Get all asset types'
    },
    getAssetType: {
        method: 'GET',
        path: '/asset-type/:id',
        responses: {
            200: z.object({
                assetType: SelectAssetTypeSchema.omit({ deletedAt: true}),
                properties: z.array(SelectAssetPropertySchema),
                forms: z.array(SelectBookingFormSchema),
                tags: z.array(SelectTagSchema).optional()
            }),
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.coerce.number()
        }),
        summary: 'Get asset type by id'
    },
    updateAssetType: {
        method: 'PUT',
        path: '/asset-type/:id',
        body: z.object({
            assetType: UpdateAssetTypeSchema,
            properties: z.array(z.number()),
            forms: z.array(z.number()),
            tagIds: z.array(z.number()).optional()
    }),
        responses: {
            200: z.null()
        },
        pathParams: z.object({
            id: z.coerce.number()
        }),
        summary: 'Update asset type by id'
    },
    deleteAssetType: {
        method: 'DELETE',
        path: '/asset-type/:id',
        body: z.object({}).optional(),
        responses: {
            200: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.coerce.number()
        }),
        summary: 'Delete asset type by id'
    },
    getProperties: {
        method: 'GET',
        path: '/properties',
        responses: {
            200: z.object({
                data: z.array(SelectAssetPropertySchema),
                pagination
            })
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: 'Get all asset properties'
    },
    customerGetAssetTypes: {
        method:"GET",
        path: '/customer/:subdomain/assetTypes',
        pathParams:z.object({
            subdomain: z.string()
        }),
        query: z.object({
                    search: z.string().optional(),
                    assetId: z.string().optional(),
                    page: z.coerce.number().optional(),
                    pageSize: z.coerce.number().optional(),
                }),
        responses: {
            200: z.object({
                data: z.array(z.object({
                    id: z.number(),
                    name: z.string(),
                    image: z.string(),
                    description: z.string(),
                })),
                pagination
            })
        }
    },
    customerGetAssetType: {
        method:"GET",
        path: '/customer/:subdomain/assetType/:id',
        pathParams:z.object({
            subdomain: z.string(),
            id: z.number()
        }),
        responses: {
            200: z.object({
                    id: z.number(),
                    name: z.string(),
                    image: z.string(),
                    description: z.string(),
            })
        }
    },
})