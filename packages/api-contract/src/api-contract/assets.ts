import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  assetProperty,
  InsertAssetSchema,
  SelectAssetHasPropertiesSchema,
  SelectAssetImagesSchema,
  SelectAssetPropertySchema,
  SelectAssetSchema,
  SelectAssetLocationSchema,
  SelectTagSchema, // import tag schema
} from '../database-schema';
import { pagination } from './utils';

const c = initContract();

 

const SelectAssetList = z.object({
  data: z.array(SelectAssetSchema),
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
      formIds: z.array(z.number()).optional(),
    }),
    summary: 'Create a new asset',
  },
  getAssets: {
    method: 'GET',
    path: '/asset',
    responses: {
      200: z.object({
        data: z.array(SelectAssetSchema),
        pagination
      }),
    },
    query: z.object({
      assetTypeId: z.coerce.number().optional(),
      search: z.string().optional(),
      userId: z.string().optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    summary: 'Get all assets',
  },
  getAsset: {
    method: 'GET',
    path: '/asset/:id',
    responses: {
      200: SelectAssetSchema.extend({
        bookingForms: z.array(z.object({
          id: z.number(),
          name: z.string(),
        }))
      }),
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
      200: SelectAssetSchema,
    },
    pathParams: z.object({
      id: z.string(),
    }),
    body: InsertAssetSchema.partial().extend({
      formIds: z.array(z.number()).optional(),
    }),
    summary: 'Update an asset by id',
  },
  deleteAsset: {
    method: 'DELETE',
    path: '/asset/:id',
    body: z.object({}).optional(),
    responses: {
      204: z.undefined(),
      400: z.object({
        message: z.string()
      })
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
        })),
        pagination
      })
    },
    query: z.object({
      assetTypes: z.array(z.coerce.number()).optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
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
      endDate: z.coerce.date(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
          })
        ),
        pagination
      })
    }
  },

  getAssetsBySubdomain: {
    method: 'GET',
    path: '/assets-by-sub/:subdomain',
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
          slug: z.string().nullable().optional(),
          name: z.string(),
          description: z.string().optional(),
          images: z.array(z.string()),
          properties: z.array(z.object({
            id: z.number(),
            name: z.string(),
            value: z.string()
          })),
          pagination
        })),

      })
    },
    summary: 'Get assets by tenant subdomain (public)'
  },
  getAssetDetailsBySubdomain: {
    method: 'GET',
    path: '/assets-by-sub/:subdomain/:slug',
    pathParams: z.object({
      subdomain: z.string(),
      slug: z.string()
    }),
    responses: {
      200: z.object({
        id: z.string(),
        slug: z.string().nullable().optional(),
        name: z.string(),
        description: z.string().nullable(),
        tenantId: z.string(),
        assetTypeId: z.number().nullable(),
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date().nullable(),
        images: z.array(SelectAssetImagesSchema),
        properties: z.array(SelectAssetHasPropertiesSchema.omit({ assetPropertyId: true }).extend({
          assetPropertyId: z.number(),
          assetProperty: SelectAssetPropertySchema
        }))
      }),
      404: z.undefined()
    },
    summary: 'Get asset details with images and properties (public)'
  },
  updateAssetIsAvailable: {
    method: "PUT",
    path: "/assets/availability/:id",
    pathParams: z.object({
      id: z.string()
    }),
    body: z.object({
      available: z.boolean(),
    }),
    responses: {
      201: z.object({ mesage: z.string()})
    }


  },

  // Owner-specific endpoints
  getOwnerAssets: {
    method: 'GET',
    path: '/owner/assets',
    responses: {
      200: z.object({
        data: z.array(SelectAssetSchema.extend({
          images: z.array(SelectAssetImagesSchema),
          propertyValues: z.array(SelectAssetHasPropertiesSchema.omit({ assetPropertyId: true }).extend({
            assetPropertyId: z.number(),
            assetProperty: SelectAssetPropertySchema
          }))
        })),
        pagination
      })
    },
    query: z.object({
      search: z.string().optional(),
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
    summary: 'Get assets for owner only (read-only)'
  },

  getOwnerAsset: {
    method: 'GET',
    path: '/owner/assets/:id',
    responses: {
      200: SelectAssetSchema.extend({
        images: z.array(SelectAssetImagesSchema),
        propertyValues: z.array(SelectAssetHasPropertiesSchema.omit({ assetPropertyId: true }).extend({
          assetPropertyId: z.number(),
          assetProperty: SelectAssetPropertySchema
        }))
      }),
      403: z.undefined(),
      404: z.undefined()
    },
    pathParams: z.object({
      id: z.string()
    }),
    summary: 'Get a specific asset if owner owns it (read-only)'
  },

  setAssetLocation: {
    method: 'PUT',
    path: '/asset/:assetId/location',
    pathParams: z.object({ assetId: z.string() }),
    body: z.object({
      address: z.string().nullable().optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    }),
    responses: {
      200: z.object({ id: z.number() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Set or update asset location',
  },

  getAssetLocation: {
    method: 'GET',
    path: '/asset/:assetId/location',
    pathParams: z.object({ assetId: z.string() }),
    responses: {
      200: SelectAssetLocationSchema.nullable(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Get asset location',
  },

  deleteAssetLocation: {
    method: 'DELETE',
    path: '/asset/:assetId/location',
    pathParams: z.object({ assetId: z.string() }),
    body: c.noBody(),
    responses: {
      200: z.object({ success: z.boolean() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Remove asset location',
  },

  checkAssetSlug: {
    method: 'GET',
    path: '/asset/check-slug',
    query: z.object({
      slug: z.string(),
      excludeId: z.string().optional(),
    }),
    responses: {
      200: z.object({ available: z.boolean() }),
    },
    summary: 'Check if an asset slug is available',
  },
})