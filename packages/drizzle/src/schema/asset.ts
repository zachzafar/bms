import { mysqlTable, serial, varchar, text, int, timestamp, index, uniqueIndex, boolean } from "drizzle-orm/mysql-core";



// Asset Model
export const Asset = mysqlTable("asset", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).notNull(),
    requiresApproval: boolean("requires_approval").default(false).notNull(),
    assetTypeId: int("asset_type_id").notNull(),
    groupId: int("group_id"),
    ownerId: varchar("owner_id", { length: 255 }),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
    groupIdx: index("group_idx").on(table.groupId),
    ownerIdx: index("owner_idx").on(table.ownerId),
}));

// AssetHasProperties Model
export const AssetHasProperties = mysqlTable("asset_has_properties", {
    id: serial("id").primaryKey(),
    assetId: int("asset_id").notNull(),
    assetPropertyId: int("asset_property_id").notNull(),
    value: varchar("value", { length: 255 }).notNull(),
}, (table) => ({
    assetPropertyUniqueIdx: uniqueIndex("asset_property_unique").on(table.assetId, table.assetPropertyId),
}));