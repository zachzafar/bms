import { relations} from "drizzle-orm";
import { mysqlTable, varchar, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { AssetType, assetProperty, GroupType, BookingForm } from "../settings";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Tenant Model
export const Tenant = mysqlTable("tenants", {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    name: varchar("name", { length: 255 }).notNull(),
    subdomain: varchar("subdomain", { length: 255 }).notNull(),
    createdAt: timestamp('createdAt',{mode: 'string'}).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt',{mode: 'string'}).defaultNow().onUpdateNow()
}, (tenant) => ({
    subdomainUniqueIdx: uniqueIndex("subdomain_unique").on(tenant.subdomain),
}));

export const InsertTenantSchema = createInsertSchema(Tenant);
export const SelectTenantSchema = createSelectSchema(Tenant);

export type InsertTenant = z.infer<typeof InsertTenantSchema>
export type SelectTenant = z.infer<typeof SelectTenantSchema>



// Relationships using Drizzle's relations function
export const TenantRelations = relations(Tenant, ({ one, many }) => ({
    assets: many(Asset),
    forms: many(BookingForm),
    assetTypes: many(AssetType),
    assetProperties: many(assetProperty),
    groupTypes: many(GroupType),
}));