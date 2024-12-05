import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";
import { Asset, AssetHasProperties } from "../asset";
import { AssetType, assetProperty, Category, GroupType, BookingForm, AssetTypeHasProperties } from "../settings";
import { Customer, Owner, User } from "../users";
import { MaintenanceTask } from "../maintenance";
import { File } from "../file";

// Tenant Model
export const Tenant = mysqlTable("tenant", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    subdomain: varchar("subdomain", { length: 255 }).notNull(),
    createdAt: timestamp('createdAt',{mode: 'string'}).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt',{mode: 'string'}).notNull().onUpdateNow()
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
    customers: many(Customer),
    owners: many(Owner),
    maintenance: many(MaintenanceTask),
    assetTypeHasProperties: many(AssetTypeHasProperties),
    file: many(File),
    assetHasProperties: many(AssetHasProperties)
}));