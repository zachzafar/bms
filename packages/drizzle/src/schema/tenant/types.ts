import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { z } from "zod";
import { Tenant } from ".";

export const insertTenantSchema = createInsertSchema(Tenant).omit({ id: true, createdAt: true, updatedAt: true })
export const selectTenantSchema = createSelectSchema(Tenant)

export type InsertTenant = z.infer<typeof insertTenantSchema>
export type SelectTenant = z.infer<typeof selectTenantSchema>