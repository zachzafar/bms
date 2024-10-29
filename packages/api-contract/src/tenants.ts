import { Tenant } from "@repo/drizzle/src/schema/tenant";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { initContract } from "@ts-rest/core"


export const selectTenantSchema = createSelectSchema(Tenant);
export const insertTenantSchema = createInsertSchema(Tenant).omit({ id: true, createdAt: true, updatedAt: true })

const c = initContract 