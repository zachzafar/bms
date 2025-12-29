import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { InsertTenantSchema, SelectTenantSchema, InsertUserSchema, SelectUserSchema,InsertAssetTypeSchema, SelectAssetPropertySchema, SelectAssetTypeSchema, UpdateAssetTypeSchema,InsertAssetPropertySchema, UpdateAssetPropertySchema, InsertTagSchema, SelectTagSchema, InsertBookingFormSchema, SelectBookingFormSchema, InsertBookingFormFieldSchema, SelectBookingFormFieldSchema } from "./zod";

const c = initContract();

 const AssetTypeWithPropertiesSchema = z.object({
    assetType: InsertAssetTypeSchema,
    properties: z.array(z.number())
})

 const SelectAssetTypeWithPropertiesSchema = z.object({
    assetType: SelectAssetTypeSchema,
    properties: z.array(z.number())
})


export const systemAdminContract = c.router({
  // System Admin User Management
  createSystemAdmin: {
    method: 'POST',
    path: '/system-admin/users',
    body: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
    }).required({ name: true, email: true, password: true }),
    responses: {
      201: z.object({
        userId: z.string(),
        message: z.string(),
      }),
    },
    summary: 'Create a new system admin user',
  },

  getSystemAdmins: {
    method: 'GET',
    path: '/system-admin/users',
    responses: {
      200: z.array(SelectUserSchema.omit({ password: true })),
    },
    summary: 'Get all system admin users',
  },

  // Tenant Management
  createTenant: {
    method: 'POST',
    path: '/system-admin/tenants',
    body: z.object({
      tenant: InsertTenantSchema,
      adminUser: InsertUserSchema,
    }).required({ tenant: true, adminUser: true }),
    responses: {
      201: z.object({
        tenantId: z.string(),
        adminUserId: z.string(),
        message: z.string(),
      }),
    },
    summary: 'Create a new tenant with admin user',
  },

  getTenants: {
    method: 'GET',
    path: '/system-admin/tenants',
    responses: {
      200: z.array(SelectTenantSchema),
    },
    summary: 'Get all tenants',
  },

  getTenant: {

    method: 'GET',
    path: '/system-admin/tenants/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({
        tenant: SelectTenantSchema,
        userCount: z.number(),
        roleCount: z.number(),
        apiKeyCount: z.number(),
      }),
    },
  },

  updateTenant: {
    method: 'PUT',
    path: '/system-admin/tenants/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.object({
      tenant: InsertTenantSchema.partial(),
    }).required({ tenant: true }),
    responses: {
      200: z.object({
        message: z.string(),
      }),
    },
    summary: 'Update tenant information',
  },

  deleteTenant: {
    method: 'DELETE',
    path: '/system-admin/tenants/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      204: z.object({
        message: z.string(),
      }),
    },
    summary: 'Delete a tenant',
  },

  getTenantDetails: {
    method: 'GET',
    path: '/system-admin/tenants/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({
        tenant: SelectTenantSchema,
        userCount: z.number(),
        roleCount: z.number(),
        apiKeyCount: z.number(),
      }),
    },
    summary: 'Get detailed tenant information',
  },

  // Role Management
  createTenantRole: {
    method: 'POST',
    path: '/system-admin/tenants/:tenantId/roles',
    pathParams: z.object({
      tenantId: z.string(),
    }),
    body: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      permissions: z.array(z.string()),
    }).required({ name: true, permissions: true }),
    responses: {
      201: z.object({
        roleId: z.number(),
        message: z.string(),
      }),
    },
    summary: 'Create a new role for a tenant',
  },

  updateTenantRole: {
    method: 'PUT',
    path: '/system-admin/tenants/:tenantId/roles/:roleId',
    pathParams: z.object({
      tenantId: z.string(),
      roleId: z.string(),
    }),
    body: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      permissions: z.array(z.string()),
    }).required({ name: true, permissions: true }),
    responses: {
      200: z.object({
        message: z.string(),
      }),
    },
    summary: 'Update a tenant role',
  },

  deleteTenantRole: {
    method: 'DELETE',
    path: '/system-admin/tenants/:tenantId/roles/:roleId',
    pathParams: z.object({
      tenantId: z.string(),
      roleId: z.string(),
    }),
    responses: {
      204: z.object({
        message: z.string(),
      }),
    },
    summary: 'Delete a tenant role',
  },

  getTenantRoles: {
    method: 'GET',
    path: '/system-admin/tenants/:tenantId/roles',
    pathParams: z.object({
      tenantId: z.string(),
    }),
    responses: {
      200: z.array(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().nullable(),
        permissions: z.array(z.string()),
        userCount: z.number(),
      })),
    },
    summary: 'Get all roles for a tenant',
  },
  getPermissions: {
      method: 'GET',
      path: '/system-admin/permissions',
      responses: {
          200: z.array(z.string())
      },
      summary: 'Get all roles'
  },

  // User Assignment to Tenants
  assignUserToTenant: {
    method: 'POST',
    path: '/system-admin/tenants/:tenantId/users',
    pathParams: z.object({
      tenantId: z.string(),
    }),
    body: z.object({
      userId: z.string(),
      roleIds: z.array(z.number()),
      isAdmin: z.boolean().default(false),
    }).required({ userId: true, roleIds: true }),
    responses: {
      201: z.object({
        message: z.string(),
      }),
    },
    summary: 'Assign a user to a tenant with roles',
  },

  removeUserFromTenant: {
    method: 'DELETE',
    path: '/system-admin/tenants/:tenantId/users/:userId',
    pathParams: z.object({
      tenantId: z.string(),
      userId: z.string(),
    }),
    responses: {
      204: z.object({
        message: z.string(),
      }),
    },
    summary: 'Remove a user from a tenant',
  },

  getTenantUsers: {
    method: 'GET',
    path: '/system-admin/tenants/:tenantId/users',
    pathParams: z.object({
      tenantId: z.string(),
    }),
    responses: {
      200: z.array(z.object({
        user: SelectUserSchema.omit({ password: true }),
        roles: z.array(z.object({
          id: z.number(),
          name: z.string(),
        })),
        isAdmin: z.boolean(),
        assignedAt: z.string(),
      })),
    },
  summary: 'Get all users assigned to a tenant',
  },

  createUserForTenant: {
    method: 'POST',
    path:'/system-admin/tenants/:tenantId/users',
    body: z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(8),
      roleIds: z.array(z.number()),
    }).required({ email: true, name: true, password: true, roleIds: true }),
    responses: {
      201: z.object({
        userId: z.string(),
        message: z.string(),
      }),
    },
    summary: 'Create a new user for a tenant',
  },

  // API Key Management
  createTenantApiKey: {
    method: 'POST',
    path: '/system-admin/tenants/:tenantId/api-keys',
    pathParams: z.object({
      tenantId: z.string(),
    }),
    body: z.object({
      name: z.string().min(1),
      scopes: z.array(z.string()).default([]),
    }).required({ name: true }),
    responses: {
      201: z.object({
        apiKey: z.string(),
        message: z.string(),
      }),
    },
    summary: 'Create a new API key for a tenant',
  },

  getTenantApiKeys: {
    method: 'GET',
    path: '/system-admin/tenants/:tenantId/api-keys',
    pathParams: z.object({
      tenantId: z.string(),
    }),
    responses: {
      200: z.array(z.object({
        id: z.string(),
        name: z.string(),
        key: z.string(),
        scopes: z.array(z.string()),
        isActive: z.boolean(),
        createdAt: z.string(),
        lastUsed: z.string().nullable(),
      })),
    },
    summary: 'Get all API keys for a tenant',
  },

  deleteTenantApiKey: {
    method: 'DELETE',
    path: '/system-admin/tenants/:tenantId/api-keys/:keyId',
    body: z.undefined(),
    pathParams: z.object({
      tenantId: z.string(),
      keyId: z.string(),
    }),
    responses: {
      204: z.object({
        message: z.string(),
      }),
    },
    summary: 'Delete an API key for a tenant',
  },

  // System-wide operations
  getSystemStats: {
    method: 'GET',
    path: '/system-admin/stats',
    responses: {
      200: z.object({
        totalTenants: z.number(),
        totalUsers: z.number(),
        totalSystemAdmins: z.number(),
        activeTenants: z.number(),
        totalApiKeys: z.number(),
      }),
    },
    summary: 'Get system-wide statistics',
  },

  getSystemLogs: {
    method: 'GET',
    path: '/system-admin/logs',
    query: z.object({
      level: z.enum(['info', 'warn', 'error']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }),
    responses: {
      200: z.array(z.object({
        id: z.string(),
        level: z.string(),
        message: z.string(),
        timestamp: z.string(),
        userId: z.string().nullable(),
        tenantId: z.string().nullable(),
        metadata: z.record(z.any()).optional(),
      })),
    },
    summary: 'Get system logs',
  },

  updateUserRoles: {
    method: 'PUT',
    path: '/system-admin/tenants/:tenantId/users/:userId/roles',
    pathParams: z.object({
      tenantId: z.string(),
      userId: z.string(),
    }),
    body: z.object({
      roleIds: z.array(z.number()),
      isAdmin: z.boolean().default(false),
    }).required({ roleIds: true }),
    responses: {
      201: z.object({
        message: z.string(),
      }),
    },
    summary: 'Update roles for a user in a tenant',
  },
      createAssetType: {
        method: 'POST',
        path: '/system-admin/asset-type',
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
        path: '/system-admin/asset-type/:tenantId',
        responses: {
            200: z.array(SelectAssetTypeSchema)
        },
        pathParams: z.object({
            tenantId: z.string()
        }),
        summary: 'Get all asset types'
    },
    getAssetType: {
        method: 'GET',
        path: '/system-admin/asset-type/:id',
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
        path: '/system-admin/asset-type/:id',
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
        path: '/system-admin/asset-type/:id',
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
        path: '/system-admin/properties/:tenantId',
        responses: {
            200: z.array(SelectAssetPropertySchema)
        },
        pathParams: z.object({
            tenantId: z.string()
        }),
        summary: 'Get all asset properties'
    },
      createProperty: {
        method: 'POST',
        path: '/system-admin/properties',
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
        path: '/system-admin/properties/:id',
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
        path: '/system-admin/properties/:id',
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
        path: '/system-admin/properties/:id',
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
            id: z.string()
        }),
        summary: 'Delete a asset property'
    },
     createTag: {
        method: 'POST',
        path: '/system-admin/tags',
        body: InsertTagSchema,
        responses: {
            201: z.object({
                id: z.string(),
            })
        },
        summary: 'Create a new tag'
    },
    getTag: {
        method: 'GET',
        path: '/system-admin/tags/:id',
        responses: {
            200: SelectTagSchema,
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Get a tag'
    },
    deleteTag: {
        method: 'DELETE',
        path: '/system-admin/tags/:id',
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
            id: z.string()
        }),
        summary: 'Delete a tag'
    },
    getTags: {
        method: 'GET',
        path: '/system-admin/tags/:tenantId',
        responses: {
            200: z.array(SelectTagSchema)
        },
        pathParams: z.object({
            tenantId: z.string()
        }),
        summary: 'Get all tags'
    },
        createForm : {
        method: 'POST',
        path: '/system-admin/form',
        body: z.object({
            form : InsertBookingFormSchema,
            fields: z.array(InsertBookingFormFieldSchema.omit({
                formId: true
            }))
        }),
        responses: {
            201: z.object({
                id: z.number()
            })
        },
        summary: 'Create a new form'
    },
    getForms: {
        method: 'GET',
        path: '/system-admin/form',
        responses: {
            200: z.array(SelectBookingFormSchema)
        },
        summary: 'Get all forms'
    },
    getForm: {
        method: 'GET',
        path: '/system-admin/form/:id',
        responses: {
            200: z.object({
                form: SelectBookingFormSchema,
                fields: z.array(SelectBookingFormSchema)
            }),
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Get a form by id'
    },
    bulkUpload: {
        method: 'POST',
        path: '/system-admin/bulk-upload',
        body: z.object({
            file: z.any(),
            assetTypeId: z.number(),
            tenantId: z.string() ,
        }),
        responses: {
            201: z.object({
                message: z.string()
            })
        },
        summary: 'Bulk upload assets'
    },
});
        