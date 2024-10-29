import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, int, timestamp, index, uniqueIndex, boolean } from "drizzle-orm/mysql-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Group,Tenant, AssetType, Owner, Booking, MaintenanceTask, AssetHasCategories, File, AssetProperty } from ".";


export const Status = {
    Available: 'Available',
    Used: 'Used',
    Maintenance: 'Maintenance',
  } as const;
  
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
  
  export const AssetRelations = relations(Asset, ({ one, many }) => ({
    tenant: one(Tenant, { fields: [Asset.tenantId], references: [Tenant.id] }),
    assetType: one(AssetType, { fields: [Asset.assetTypeId], references: [AssetType.id] }),
    group: one(Group, { fields: [Asset.groupId], references: [Group.id] }),
    owner: one(Owner, { fields: [Asset.ownerId], references: [Owner.id] }),
    bookings: many(Booking),
    maintenanceTasks: many(MaintenanceTask),
    files: many(File),
    assetHasProperties: many(AssetHasProperties),
    assetHasCategories: many(AssetHasCategories),
  }));
  
  export const selectAssetSchema = createSelectSchema(Asset);
  export const insertAssetSchema = createInsertSchema(Asset, {
    status: z.enum([Status.Available, Status.Used, Status.Maintenance]),
  }).omit({ id: true, createdAt: true, updatedAt: true });
  
  // AssetHasProperties Model
  export const AssetHasProperties = mysqlTable("asset_has_properties", {
    id: serial("id").primaryKey(),
    assetId: int("asset_id").notNull(),
    assetPropertyId: int("asset_property_id").notNull(),
    value: varchar("value", { length: 255 }).notNull(),
  }, (table) => ({
    assetPropertyUniqueIdx: uniqueIndex("asset_property_unique").on(table.assetId, table.assetPropertyId),
  }));
  
  export const AssetHasPropertiesRelations = relations(AssetHasProperties, ({ one }) => ({
    asset: one(Asset, { fields: [AssetHasProperties.assetId], references: [Asset.id] }),
    assetProperty: one(AssetProperty, { fields: [AssetHasProperties.assetPropertyId], references: [AssetProperty.id] }),
  }));
  
  export const selectAssetHasPropertiesSchema = createSelectSchema(AssetHasProperties);
  export const insertAssetHasPropertiesSchema = createInsertSchema(AssetHasProperties).omit({ id: true });
  