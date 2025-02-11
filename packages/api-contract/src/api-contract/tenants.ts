
import { initContract } from "@ts-rest/core";
import { InsertTenantSchema, InsertUserSchema, SelectTenantSchema, SelectUserSchema } from "../database-schema"
import { z } from "zod";

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
  }
});