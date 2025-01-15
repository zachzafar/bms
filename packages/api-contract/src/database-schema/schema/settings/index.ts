import { relations, sql } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, json, timestamp, index, int, uniqueIndex, boolean } from "drizzle-orm/mysql-core";
import { Tenant } from "../tenant";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";



export const Category = mysqlTable("category", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    assetTypeId: varchar("asset_type_id", { length: 255 }),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
}));

export const CategoryRelations = relations(Category, ({ one }) => ({
    tenant: one(Tenant, {
        fields: [Category.tenantId],
        references: [Tenant.id],
    }),
    assetType: one(AssetType, {
        fields: [Category.assetTypeId],
        references: [AssetType.id],
    })
}));

// GroupType Model
export const GroupType = mysqlTable("group_type", {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt'),
});

export const GroupTypeRelations = relations(GroupType, ({ one, many }) => ({
    tenant: one(Tenant, {
        fields: [GroupType.tenantId],
        references: [Tenant.id],
    }),
    groups: many(Group)
}));

// Group Model
export const Group = mysqlTable("group", {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    groupTypeId: int("group_type_id").notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    groupTypeIdx: index("group_type_idx").on(table.groupTypeId),
}));

export const InsertGroupSchema = createInsertSchema(Group);
export const SelectGroupSchema = createInsertSchema(Group).required( { id: true });
export const UpdateGroupSchema = InsertGroupSchema.partial();

export type InsertGroup = z.infer<typeof InsertGroupSchema>;
export type SelectGroup = z.infer<typeof SelectGroupSchema>;
export type UpdateGroup = z.infer<typeof UpdateGroupSchema>;


export const GroupRelations = relations(Group, ({ one }) => ({
    groupType: one(GroupType, {
        fields: [Group.groupTypeId],
        references: [GroupType.id],
    }),
}));


// AssetType Model
export const AssetType = mysqlTable("asset_type", {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    bookingFormId: varchar("booking_form_id", { length: 255 }),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt'),
}, (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
    bookingFormUniqueIdx: uniqueIndex("booking_form_unique").on(table.bookingFormId),
}));

export const InsertAssetTypeSchema = createInsertSchema(AssetType);
export const SelectAssetTypeSchema = createInsertSchema(AssetType);
export const UpdateAssetTypeSchema = InsertAssetTypeSchema.partial();

export type InsertAssetType = z.infer<typeof InsertAssetTypeSchema>;
export type SelectAssetType = z.infer<typeof SelectAssetTypeSchema>;
export type UpdateAssetType = z.infer<typeof UpdateAssetTypeSchema>;

export const AssetTypeRelations = relations(AssetType, ({ one, many }) => ({
    tenant: one(Tenant, {
        fields: [AssetType.tenantId],
        references: [Tenant.id],
    }),
    assetTypeHasProperties: many(AssetTypeHasProperties),
}));


// AssetProperty Model
export const assetProperty = mysqlTable("asset_property", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    propertyType: varchar("property_type", { length: 255 }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt'),
}, (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
}));

export const AssetPropertyRelations = relations(assetProperty, ({ one }) => ({
    tenant: one(Tenant, {
        fields: [assetProperty.tenantId],
        references: [Tenant.id],
    }),
}));


// AssetTypeHasProperties Model
export const AssetTypeHasProperties = mysqlTable("asset_type_has_properties", {
    id: serial("id").primaryKey(),
    assetTypeId: int("asset_type_id").notNull(),
    tenantId: varchar("tenant_id", { length: 255 }),
    assetPropertyId: int("asset_property_id").notNull(),
    required: boolean("required").default(false).notNull(),
}, (table) => ({
    assetTypePropertyUniqueIdx: uniqueIndex("asset_type_property_unique").on(table.assetTypeId, table.assetPropertyId),
}));

export const AssetTypeHasPropertiesRelations = relations(AssetTypeHasProperties, ({ one }) => ({
    assetType: one(AssetType, {
        fields: [AssetTypeHasProperties.assetTypeId],
        references: [AssetType.id],
    }),
    assetProperty: one(assetProperty, {
        fields: [AssetTypeHasProperties.assetPropertyId],
        references: [assetProperty.id],
    }),
    tenant: one(Tenant, {
        fields: [AssetTypeHasProperties.tenantId],
        references: [Tenant.id],
    })
}));


// BookingForm Model
export const BookingForm = mysqlTable("booking_form", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    assetTypeId: int("asset_type_id"),
    tenantId: varchar("tenant_id", { length: 255 }),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
}));

export const InsertBookingFormSchema = createInsertSchema(BookingForm);
export const SelectBookingFormSchema = createInsertSchema(BookingForm);
export const UpdateBookingFormSchema = InsertBookingFormSchema.partial();

export type InsertBookingForm = z.infer<typeof InsertBookingFormSchema>;
export type SelectBookingForm = z.infer<typeof SelectBookingFormSchema>;
export type UpdateBookingForm = z.infer<typeof UpdateBookingFormSchema>;

export const BookingFormField = mysqlTable("booking_form_field", {
    id: serial("id").primaryKey(),
    formId: int("form_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    required: boolean("required").notNull(),
}, (table) => ({
    formIdx: index("form_idx").on(table.formId),
}));

export const InsertBookingFormFieldSchema = createInsertSchema(BookingFormField);
export const SelectBookingFormFieldSchema = createInsertSchema(BookingFormField);
export const UpdateBookingFormFieldSchema = InsertBookingFormFieldSchema.partial();

export type InsertBookingFormField = z.infer<typeof InsertBookingFormFieldSchema>;
export type SelectBookingFormField = z.infer<typeof SelectBookingFormFieldSchema>;
export type UpdateBookingFormField = z.infer<typeof UpdateBookingFormFieldSchema>;

export const BookingFormFieldRelations = relations(BookingFormField, ({ one }) => ({
    bookingForm: one(BookingForm, {
        fields: [BookingFormField.formId],
        references: [BookingForm.id],
    }),
}))

export const BookingFormRelations = relations(BookingForm, ({ one }) => ({
    tenant: one(Tenant, {
        fields: [BookingForm.tenantId],
        references: [Tenant.id],
    }),
    assetType: one(AssetType, {
        fields: [BookingForm.assetTypeId],
        references: [AssetType.id],
    }),
    fields: one(BookingFormField),
}));


