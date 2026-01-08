import { initContract } from '@ts-rest/core';

import { z } from "zod";
import { InsertTenantSchema, SelectTenantSchema, InsertUserSchema, SelectUserSchema } from "../database-schema/schema"
import { create } from 'domain';
import { send } from 'process';


const c = initContract();

export const authContract = c.router({
  registerTenant: {
    method: 'POST',
    path: '/tenant',
    responses: {
      201: z.object({
        tenantId: z.string(),
        userId: z.string()
      })
    },
    body: z.object({
      tenant: InsertTenantSchema,
      adminUser: InsertUserSchema
    }).required({ tenant: true, adminUser: true }),
    summary: 'Create a new tenant with an admin user'
  },
  login: {
    method: 'POST',
    path: '/login',
    responses: {
      200: z.object({
        token: z.string(),
        refreshToken: z.string(),
        user: SelectUserSchema.omit({ password: true }),
        tenants: z.array(SelectTenantSchema)
      })
    },
    body: z.object({
      email: z.string().email(),
      password: z.string().max(255)
    }).required({ email: true, password: true }),
    summary: 'User login'
  },
  refreshToken: {
    method: 'POST',
    path: '/refresh',
    headers: z.object({
      user: z.string().optional(),
    }),
    responses: {
      201: z.object({
        token: z.string(),
        refreshToken: z.string(),
        user: SelectUserSchema.omit({ password: true }),
      })
    },
    body: z.object({
      refresh: z.string().max(255)
    }).required({ refresh: true }),
    summary: 'Refresh token'
  },
  validateToken: {
    method: 'POST',
    path: '/validate-token',
    responses: {
      200: z.object({
        valid: z.boolean(),
        user: SelectUserSchema.omit({ password: true }),
        tenant: SelectTenantSchema
      }),
      401: z.object({
        valid: z.boolean(),
        message: z.string()
      })
    },
    body: z.object({
      token: z.string(),
      tenantId: z.string()
    }).required({ token: true, tenantId: true }),
    summary: 'Validate token for cross-domain authentication'
  },
  sendPasswordResetEmail: {
    method: 'POST',
    path: '/password-reset',
    body: z.object({
      email: z.string().email()
    }).required({ email: true }),
    responses: {
      204: z.object({
        message: z.string()
      })
    },
    summary: 'Send password reset email'
  },
  resetPassword: {
    method: 'POST',
    path: '/password-reset/confirm',
    body: z.object({
      password: z.string().max(255),
      token: z.string().max(255)
    }).required({ password: true }),
    responses: {
      204: z.object({
        message: z.string()
      })
    },
    summary: 'Reset password'
  },
  logout: {
    method: 'POST',
    path: '/logout',
    body: z.object({
      userId: z.string().max(255)
    }),
    responses: {
      204: z.object({
        message: z.string()
      })
    },
    summary: 'Logout'
  },
  createUser: {
    method: 'POST',
    path: '/user',
    body: z.object({
      user: InsertUserSchema
    }).required({ user: true }),
    responses: {
      201: z.object({
        user: SelectUserSchema.omit({ password: true })
      })
    },
    headers: z.object({
      tenant: z.string()
    }),
    summary: 'Create a new user'
  },
  registerAdmin: {
    method: 'POST',
    path: '/admin',
    body: z.object({
      name: z.string(),
      email: z.string().email()
    }).required({ name: true, email: true }),
    responses: {
      201: z.object({
        userId: z.string(),
        email: z.string()
      })
    },
    summary: 'Register a new admin user'
  },
  validateAdmin: {
    method: 'POST',
    path: '/admin/validate',
    body: z.object({
      token: z.string()
    }).required({ token: true }),
    responses: {
      200: z.object({
        isAdmin: z.boolean(),
        valid: z.boolean()
      })
    },
    summary: 'Validate admin token'
  },
  getPermissions: {
    method: 'GET',
    path: '/permissions',
    responses: {
      200: z.array(z.string())
    },
    summary: 'Get all roles'
  },
  getMyPermissions: {
    method: 'GET',
    path: '/me/permissions',
    headers: z.object({
      'x-tenant-id': z.string(),
    }),
    responses: {
      200: z.array(z.string()),
    },
    summary: 'Get current user permissions for active tenant',
  },

  getRoles: {
    method: 'GET',
    path: '/roles',
    responses: {
      200: z.array(z.object({
        roleId: z.string(),
        name: z.string(),
        permissions: z.array(z.string())
      }))
    },
    summary: 'Get all roles'
  },
  createRole: {
    method: 'POST',
    path: '/role',
    body: z.object({
      name: z.string(),
      permissions: z.array(z.string())
    }).required({ name: true, permissions: true }),
    responses: {
      201: z.object({
        message: z.string()
      })
    }
  },
  updateRole: {
    method: 'PUT',
    path: '/role/:roleId',
    body: z.object({
      name: z.string(),
      permissions: z.array(z.string())
    }).required({ name: true, permissions: true }),
    responses: {
      201: z.object({
        message: z.string()
      })
    },
    pathParams: z.object({
      roleId: z.coerce.number()
    })
  },
  deleteRole: {
    method: 'DELETE',
    path: '/role/:roleId',
    body: z.object({}).optional(),
    responses: {
      204: z.object({
        message: z.string()
      })
    },
    pathParams: z.object({
      roleId: z.coerce.number()
    })
  }
})