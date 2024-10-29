import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";
import { Asset } from "./asset.js";
import { AssetType, assetProperty, Category, GroupType, BookingForm } from "./settings.js";
import { User } from "./users.js";




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


// Relationships using Drizzle's relations function
export const TenantRelations = relations(Tenant, ({ one, many }) => ({
    users: many(User),
    assetTypes: many(AssetType),
    assetProperties: many(assetProperty),
    categories: many(Category),
    groupTypes: many(GroupType),
    bookingForms: many(BookingForm),
    assets: many(Asset),
}));