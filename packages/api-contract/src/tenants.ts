import { UserInsertSchema,UserSelectSchema } from "./users";
import { initContract } from "@ts-rest/core";
import { z } from "zod";

export const TenantInsertSchema = z.object({
  id: z.string().max(36),
  name: z.string().max(255),
  subdomain: z.string().max(255),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const TenantSelectSchema = TenantInsertSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InsertTenant = z.infer<typeof TenantInsertSchema>
export type SelectTenant = z.infer<typeof TenantSelectSchema>

const c = initContract();

export const tenantsContract = c.router({
  create: {
    method: 'POST',
    path: '/tenants',
    responses: {
        201: z.object({
          tenant: TenantSelectSchema,
          adminUser: UserSelectSchema.omit({ password: true })
        })
      },
    body: z.object({
      tenant: TenantInsertSchema,
      adminUser: UserInsertSchema
    }).required({ tenant: true, adminUser: true }),
    summary: 'Create a new tenant with an admin user'
  }
});