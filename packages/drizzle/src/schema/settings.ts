import { relations, sql } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, json, timestamp, index, int, uniqueIndex, boolean } from "drizzle-orm/mysql-core";
import { Tenant } from "./tenant.js";



export const Category = mysqlTable("category", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    schema: json("schema").notNull(),
    assetTypeId: varchar("asset_type_id", { length: 255 }),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
}));

// GroupType Model
export const GroupType = mysqlTable("group_type", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
});

// Group Model
export const Group = mysqlTable("group", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    groupTypeId: int("group_type_id").notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
    groupTypeIdx: index("group_type_idx").on(table.groupTypeId),
}));


// AssetType Model
export const AssetType = mysqlTable("asset_type", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    bookingFormId: varchar("booking_form_id", { length: 255 }),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
    bookingFormUniqueIdx: uniqueIndex("booking_form_unique").on(table.bookingFormId),
}));

// AssetProperty Model
export const assetProperty = mysqlTable("asset_property", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    propertyType: varchar("property_type", { length: 255 }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
}));




// AssetTypeHasProperties Model
export const AssetTypeHasProperties = mysqlTable("asset_type_has_properties", {
    id: serial("id").primaryKey(),
    assetTypeId: int("asset_type_id").notNull(),
    assetPropertyId: int("asset_property_id").notNull(),
    required: boolean("required").default(false).notNull(),
}, (table) => ({
    assetTypePropertyUniqueIdx: uniqueIndex("asset_type_property_unique").on(table.assetTypeId, table.assetPropertyId),
}));


// BookingForm Model
export const BookingForm = mysqlTable("booking_form", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    fields: json("fields").notNull(),
    conditions: json("conditions"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    assetTypeId: int("asset_type_id"),
    tenantId: varchar("tenant_id", { length: 255 }),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
}));


export const AssetTypeRelations = relations(AssetType, ({ one, many }) => ({
    tenant: one(Tenant, {
        fields: [AssetType.tenantId],
        references: [Tenant.id],
    }),
    assetTypeHasProperties: many(AssetTypeHasProperties),
}));
