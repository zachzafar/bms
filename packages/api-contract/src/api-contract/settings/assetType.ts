import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { Asset, InsertAssetPropertySchema, InsertAssetTypeSchema, SelectAssetPropertySchema, SelectAssetTypeSchema, UpdateAssetTypeSchema, SelectBookingFormSchema, SelectTagSchema } from "../../database-schema";
import { pagination } from "../utils";

export const AssetTypePropertyValueSchema = z.object({
    id: z.number(),
    assetTypeId: z.number(),
    assetPropertyId: z.number(),
    value: z.string(),
    property: z.object({
        name: z.string(),
        propertyType: z.enum(['number', 'string', 'textbox', 'list','select','multi_select']),
    }),
});

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
    uploadAssetTypeImage: {
        method: 'POST',
        path: '/asset-type/:id/image',
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
        summary: 'Upload an image for an asset type'
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
                    slug: z.string().nullable().optional(),
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
            id: z.string()
        }),
        responses: {
            200: z.object({
                    id: z.number(),
                    name: z.string(),
                    image: z.string(),
                    description: z.string(),
                    propertyValues: z.array(AssetTypePropertyValueSchema).optional(),
            })
        }
    },
    getAssetTypePropertyValues: {
        method: 'GET',
        path: '/asset-type/:id/property-values',
        pathParams: z.object({ id: z.coerce.number() }),
        responses: {
            200: z.array(AssetTypePropertyValueSchema),
        },
        summary: 'Get property values for an asset type',
    },
    setAssetTypePropertyValues: {
        method: 'POST',
        path: '/asset-type/:id/property-values',
        pathParams: z.object({ id: z.coerce.number() }),
        body: z.object({
            values: z.array(z.object({
                propertyId: z.number(),
                value: z.string(),
            })),
        }),
        responses: {
            200: z.null(),
        },
        summary: 'Set (upsert) property values for an asset type',
    },

    checkAssetTypeSlug: {
        method: 'GET',
        path: '/asset-type/check-slug',
        query: z.object({
            slug: z.string(),
            excludeId: z.coerce.number().optional(),
        }),
        responses: {
            200: z.object({ available: z.boolean() }),
        },
        summary: 'Check if an asset type slug is available',
    },
})