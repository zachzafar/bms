
import { initContract } from "@ts-rest/core";
import { InsertTenantSchema, InsertUserSchema, SelectTenantSchema, SelectUserSchema, UpdateTenantSchema } from "../database-schema"
import { z } from "zod";
import { pagination } from "./utils";

// export const TenantInsertSchema = z.object({
//   id: z.string().max(36),
//   name: z.string().max(255),
//   subdomain: z.string().max(255),
//   createdAt: z.string().optional(),
//   updatedAt: z.string().optional(),
// });

// export const SelectTenantSchema = TenantInsertSchema.extend({
//   createdAt: z.string(),
//   updatedAt: z.string(),
// });

// export type InsertTenant = z.infer<typeof TenantInsertSchema>
// export type SelectTenant = z.infer<typeof SelectTenantSchema>

const c = initContract();

export const tenantsContract = c.router({
  create: {
    method: 'POST',
    path: '/tenant',
    responses: {
        201: z.object({
          tenantId: z.string(),
          adminUserId: z.string()
        })
      },
    body: z.object({
      tenant: InsertTenantSchema,
      adminUser: InsertUserSchema
    }).required({ tenant: true, adminUser: true }),
    summary: 'Create a new tenant with an admin user'
  },
  getTenantsDetails: {
    method: 'GET',
    path: '/tenant',
    responses: {
      200: z.array(SelectTenantSchema),
    },
    query: z.object({
      tenants: z.array(z.string())
    }),
    summary: 'Get all tenants'
  },
  getTenants: {
    method: 'GET',
    path: '/tenant',
    responses: {
      200: z.object({
        data: z.array(SelectTenantSchema),
        pagination
      })
    },
    query: z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    }),
  },
  update: {
    method: 'PUT',
    path: '/tenant/:id',
    responses: {
      200: z.object({
        message: z.string()
      })
    },
    pathParams: z.object({
      id: z.string()
    }),
    body: UpdateTenantSchema
  },
  getTenantBySubdomain: {
    method: 'GET',
    path: '/tenant-by-sub/:subdomain',
    pathParams: z.object({
      subdomain: z.string()
    }),
    responses: {
      200: z.object({
        id: z.string(),
        name: z.string(),
        subdomain: z.string().nullable(),
        enableAutomaticConfirmation: z.boolean(),
        booksByTagOnCustomerPage: z.boolean(),
      }),
      404: z.object({
        message: z.string()
      })
    },
    summary: 'Get tenant settings by subdomain (public)'
  }
});