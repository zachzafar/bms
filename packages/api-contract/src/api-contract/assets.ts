import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  assetProperty,
  InsertAssetSchema,
  SelectAssetHasPropertiesSchema,
  SelectAssetImagesSchema,
  SelectAssetPropertySchema,
  SelectAssetSchema,
  SelectTagSchema, // import tag schema
} from '../database-schema';
import { pagination } from './utils';

const c = initContract();

const SelectAssetWithTagsSchema = SelectAssetSchema.extend({
  tags: z.array(SelectTagSchema).optional(),
});

const SelectAssetWithTagsSchemaList = z.object({
  data: z.array(SelectAssetWithTagsSchema),
  pagination
})

export const assetsContract = c.router({
  createAsset: {
    method: 'POST',
    path: '/asset',
    responses: {
      201: z.object({
        id: z.string(),
      }),
    },
    body: z.object({
      tenant: z.string(),
      asset: InsertAssetSchema.omit({ tenantId: true }),
      tagIds: z.array(z.number()).optional(),
    }),
    summary: 'Create a new asset',
  },
  getAssets: {
    method: 'GET',
    path: '/asset',
    responses: {
      200: z.array(SelectAssetWithTagsSchema),
    },
    query: z.object({
      search: z.string().optional(),
      userId: z.string().optional(),
    }),
    summary: 'Get all assets',
  },
  getAsset: {
    method: 'GET',
    path: '/asset/:id',
    responses: {
      200: SelectAssetWithTagsSchema,
      404: z.undefined(),
    },
    pathParams: z.object({
      id: z.string(),
    }),
    summary: 'Get an asset by id',
  },
  updateAsset: {
    method: 'PUT',
    path: '/asset/:id',
    responses: {
      200: SelectAssetWithTagsSchema,
    },
    pathParams: z.object({
      id: z.string(),
    }),
    body: InsertAssetSchema.partial(),
    summary: 'Update an asset by id',
  },
  deleteAsset: {
    method: 'DELETE',
    path: '/asset/:id',
    body: z.object({}).optional(),
    responses: {
      204: z.undefined()
    },
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
    pathParams: z.object({
      id: z.string()
    }),
    body: z.object({
      properties: z.array(z.object({
        propertyId: z.coerce.number(),
        value: z.string()
      }))
    }),
    summary: 'Add properties to an asset'
  },
  getAssetProperties: {
    method: 'GET',
    path: '/asset/:id/properties',
    responses: {
      200: z.array(SelectAssetHasPropertiesSchema.omit({ assetPropertyId: true }).extend({ assetPropertyId: z.number(), assetProperty: SelectAssetPropertySchema }))
    },
    pathParams: z.object({
      id: z.string()
    }),
    summary: 'Get properties for an asset'
  },
  uploadAssetImages: {
    method: 'POST',
    path: '/asset/:id/images',
    responses: {
      200: z.object({
        message: z.string(),
      })
    },
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.object({
      images: z.any()
    }),
    summary: 'Upload images for a property'
  },
  getAssetsWithDetails: {
    method: 'GET',
    path: '/asset-details',
    responses: {
      200: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        images: z.array(z.string()),
        properties: z.array(z.object({
          id: z.number(),
          name: z.string(),
          value: z.string()
        })),
        tags: z.array(z.object({
          id: z.number(),
          name: z.string()
        }))
      }))
    },
    query: z.object({
      assetTypes: z.array(z.coerce.number()).optional(),
    })
  },
  getAssetImages: {
    method: 'GET',
    path: '/asset/:id/images',
    responses: {
      200: z.array(SelectAssetImagesSchema)
    },
    pathParams: z.object({
      id: z.string()
    }),
    summary: 'Get images for an asset'
  },
  deleteAssetImages: {
    method: 'DELETE',
    path: '/asset/:id/images',
    responses: {
      200: z.object({
        failedIds: z.array(z.number()),
        message: z.string(),
      }),
      204: z.undefined()
    },
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.object({
      images: z.array(z.coerce.number())
    }),
    summary: 'Delete images for an asset'
  },
  getAvailableAssets: {
    method: 'GET',
    path: '/assets/available',
    summary: 'Get all assets available between a date range',
    query: z.object({
      startDate: z.coerce.date(), // ISO date
      endDate: z.coerce.date()
    }),
    responses: {
      200: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        })
      )
    }
  },

  getAssetsBySubdomain: {
    method: 'GET',
    path: 'assets-by-sub/:subdomain',
    pathParams: z.object({
      subdomain: z.string()
    }),
    query: z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional()
    }),
    responses: {
      200: z.object({
        data: z.array(z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          images: z.array(z.string()),
          properties: z.array(z.object({
            id: z.number(),
            name: z.string(),
            value: z.string()
          })),
          tags: z.array(z.object({
            id: z.number(),
            name: z.string()
          })),
          pagination
        })),

      })
    },
    summary: 'Get assets by tenant subdomain (public)'
  },
  getAssetDetailsBySubdomain: {
    method: 'GET',
    path: 'assets-by-sub/:subdomain/:assetId',
    pathParams: z.object({
      subdomain: z.string(),
      assetId: z.string()
    }),
    responses: {
      200: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        tenantId: z.string(),
        assetTypeId: z.number().nullable(),
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date().nullable(),
        tags: z.array(SelectTagSchema),
        images: z.array(SelectAssetImagesSchema),
        properties: z.array(SelectAssetHasPropertiesSchema.omit({ assetPropertyId: true }).extend({
          assetPropertyId: z.number(),
          assetProperty: SelectAssetPropertySchema
        }))
      }),
      404: z.undefined()
    },
    summary: 'Get asset details with images and properties (public)'
  }
})