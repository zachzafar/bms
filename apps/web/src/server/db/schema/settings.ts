import { relations, sql } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, json, timestamp, index, int, uniqueIndex, boolean } from "drizzle-orm/mysql-core";
import { Tenant } from "./tenant";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { Booking } from "./booking";
import { AssetHasCategories, AssetHasProperties } from ".";
import { z } from "zod";
import { Asset } from "./asset";

export const PropertyType = {
    text: 'text',
    number: 'number',
    list: 'list',
    truthy: 'truthy',
    date: 'date',
    textarea: 'textarea',
  } as const;
  

// Category Model
export const Category = mysqlTable("category", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    schema: json("schema").notNull(),
    assetTypeId: int("asset_type_id").notNull(),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  }, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
  }));
  
  export const CategoryRelations = relations(Category, ({ one, many }) => ({
    tenant: one(Tenant, { fields: [Category.tenantId], references: [Tenant.id] }),
    assetType: one(AssetType, { fields: [Category.assetTypeId], references: [AssetType.id] }),
    assetHasCategories: many(AssetHasCategories),
    categoryHasProperties: many(CategoryHasProperties),
  }));
  
  export const selectCategorySchema = createSelectSchema(Category);
  export const insertCategorySchema = createInsertSchema(Category).omit({ id: true, createdAt: true, updatedAt: true });
  
  // CategoryHasProperties Model
  export const CategoryHasProperties = mysqlTable("category_has_properties", {
    id: serial("id").primaryKey(),
    categoryId: int("category_id").notNull(),
    assetPropertyId: int("asset_property_id").notNull(),
  }, (table) => ({
    categoryPropertyUniqueIdx: uniqueIndex("category_property_unique").on(table.categoryId, table.assetPropertyId),
  }));
  
  export const CategoryHasPropertiesRelations = relations(CategoryHasProperties, ({ one }) => ({
    category: one(Category, { fields: [CategoryHasProperties.categoryId], references: [Category.id] }),
    assetProperty: one(AssetProperty, { fields: [CategoryHasProperties.assetPropertyId], references: [AssetProperty.id] }),
  }));
  
  export const selectCategoryHasPropertiesSchema = createSelectSchema(CategoryHasProperties);
  export const insertCategoryHasPropertiesSchema = createInsertSchema(CategoryHasProperties).omit({ id: true });
  
  // GroupType Model
  export const GroupType = mysqlTable("group_type", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  });
  
  export const GroupTypeRelations = relations(GroupType, ({ one, many }) => ({
    tenant: one(Tenant, { fields: [GroupType.tenantId], references: [Tenant.id] }),
    groups: many(Group),
  }));
  
  export const selectGroupTypeSchema = createSelectSchema(GroupType);
  export const insertGroupTypeSchema = createInsertSchema(GroupType).omit({ id: true, createdAt: true, updatedAt: true });
  
  // Group Model
  export const Group = mysqlTable("group", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    groupTypeId: int("group_type_id").notNull(),
    createdAt:  timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  }, (table) => ({
    groupTypeIdx: index("group_type_idx").on(table.groupTypeId),
  }));
  
  export const GroupRelations = relations(Group, ({ one, many }) => ({
    groupType: one(GroupType, { fields: [Group.groupTypeId], references: [GroupType.id] }),
    assets: many(Asset),
  }));
  
  export const selectGroupSchema = createSelectSchema(Group);
  export const insertGroupSchema = createInsertSchema(Group).omit({ id: true, createdAt: true, updatedAt: true });
  

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
  
  export const AssetTypeRelations = relations(AssetType, ({ one, many }) => ({
    tenant: one(Tenant, { fields: [AssetType.tenantId], references: [Tenant.id] }),
    bookingForm: one(BookingForm, { fields: [AssetType.bookingFormId], references: [BookingForm.id] }),
    assetTypeHasProperties: many(AssetTypeHasProperties),
    assets: many(Asset),
  }));
  
  export const selectAssetTypeSchema = createSelectSchema(AssetType);
  export const insertAssetTypeSchema = createInsertSchema(AssetType).omit({ id: true, createdAt: true, updatedAt: true });
  export const patchAssetTypeSchema = insertAssetTypeSchema.partial();
// AssetProperty Model

export const AssetProperty = mysqlTable("asset_property", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    propertyType: varchar("property_type", { length: 255 }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  }, (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
  }));
  
  export const AssetPropertyRelations = relations(AssetProperty, ({ one, many }) => ({
    tenant: one(Tenant, { fields: [AssetProperty.tenantId], references: [Tenant.id] }),
    assetTypeHasProperties: many(AssetTypeHasProperties),
    assetHasProperties: many(AssetHasProperties),
    categoryHasProperties: many(CategoryHasProperties),
  }));
  
  export const selectAssetPropertySchema = createSelectSchema(AssetProperty);
  export const insertAssetPropertySchema = createInsertSchema(AssetProperty, {
    propertyType: z.enum([PropertyType.text, PropertyType.number, PropertyType.list, PropertyType.truthy, PropertyType.date, PropertyType.textarea]),
  }).omit({ id: true, createdAt: true, updatedAt: true });
  export const patchAssetPropertySchema = insertAssetPropertySchema.partial();
  

// AssetTypeHasProperties Model

export const AssetTypeHasProperties = mysqlTable("asset_type_has_properties", {
    id: serial("id").primaryKey(),
    assetTypeId: int("asset_type_id").notNull(),
    assetPropertyId: int("asset_property_id").notNull(),
    required: boolean("required").default(false).notNull(),
  }, (table) => ({
    assetTypePropertyUniqueIdx: uniqueIndex("asset_type_property_unique").on(table.assetTypeId, table.assetPropertyId),
  }));
  
  export const AssetTypeHasPropertiesRelations = relations(AssetTypeHasProperties, ({ one }) => ({
    assetType: one(AssetType, { fields: [AssetTypeHasProperties.assetTypeId], references: [AssetType.id] }),
    assetProperty: one(AssetProperty, { fields: [AssetTypeHasProperties.assetPropertyId], references: [AssetProperty.id] }),
  }));
  
  export const selectAssetTypeHasPropertiesSchema = createSelectSchema(AssetTypeHasProperties);
  export const insertAssetTypeHasPropertiesSchema = createInsertSchema(AssetTypeHasProperties).omit({ id: true });
  
  // Category Model

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
  
  export const BookingFormRelations = relations(BookingForm, ({ one, many }) => ({
    tenant: one(Tenant, { fields: [BookingForm.tenantId], references: [Tenant.id] }),
    assetType: one(AssetType, { fields: [BookingForm.assetTypeId], references: [AssetType.id] }),
    bookings: many(Booking),
  }));
  
  export const selectBookingFormSchema = createSelectSchema(BookingForm);
  export const insertBookingFormSchema = createInsertSchema(BookingForm).omit({ id: true, createdAt: true, updatedAt: true });
  
