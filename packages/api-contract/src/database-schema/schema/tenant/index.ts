import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";
import { Asset, AssetHasProperties } from "../asset";
import { AssetType, assetProperty, Category, GroupType, BookingForm, AssetTypeHasProperties } from "../settings";
import { Customer, Owner, User } from "../users";
import { MaintenanceTask } from "../maintenance";
import { File } from "../file";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Tenant Model
export const Tenant = mysqlTable("tenant", {
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
    users: many(User),
    assetTypes: many(AssetType),
    assetProperties: many(assetProperty),
    categories: many(Category),
    groupTypes: many(GroupType),
    bookingForms: many(BookingForm),
    assets: many(Asset),
    customers: many(Customer),
    owners: many(Owner),
    maintenance: many(MaintenanceTask),
    assetTypeHasProperties: many(AssetTypeHasProperties),
    file: many(File),
    assetHasProperties: many(AssetHasProperties)
}));