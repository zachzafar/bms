import { insertTenantSchema, selectTenantSchema } from "@repo/drizzle/src/schema/tenant";
import { insertUserSchema, selectUserSchema } from "@repo/drizzle/src/schema/users";
import { initContract } from "@ts-rest/core";
import { z } from "zod";


const c = initContract();

export const tenantsContract = c.router({
  create: {
    method: 'POST',
    path: '/tenants',
    responses: {
        201: z.object({
          tenant: selectTenantSchema,
          adminUser: selectUserSchema.omit({ password: true })
        })
      },
    body: z.object({
      tenant: insertTenantSchema,
      adminUser: insertUserSchema
    }).required({ tenant: true, adminUser: true }),
    summary: 'Create a new tenant with an admin user'
  }
});