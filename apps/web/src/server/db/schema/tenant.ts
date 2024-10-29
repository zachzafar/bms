import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, timestamp, uniqueIndex, serial } from "drizzle-orm/mysql-core";
import { Asset } from "./asset";
import { AssetType, AssetProperty, Category, GroupType, BookingForm } from "./settings";
import { User } from "./users";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";



// Tenant Model
export const Tenant = mysqlTable("tenant", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 255 }).notNull(),
    subdomain: varchar("subdomain", { length: 255 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (tenant) => ({
    subdomainUniqueIdx: uniqueIndex("subdomain_unique").on(tenant.subdomain),
}));

export const selectTenantSchema = createSelectSchema(Tenant);
export const insertTenantSchema = createInsertSchema(Tenant).omit({ id: true, createdAt: true, updatedAt: true })

// Relationships using Drizzle's relations function
export const TenantRelations = relations(Tenant, ({ one, many }) => ({
    users: many(User),
    assetTypes: many(AssetType),
    assetProperties: many(AssetProperty),
    categories: many(Category),
    groupTypes: many(GroupType),
    bookingForms: many(BookingForm),
    assets: many(Asset),
}));