import { relations, sql } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, json, timestamp, index, int, uniqueIndex, boolean, bigint,mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { Tenant } from "../tenant";
import {GroupHasAssets} from "../asset";
import { z } from "zod";



export const Category = mysqlTable("category", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    assetTypeId: bigint("asset_type_id", { mode: 'bigint', unsigned: true}).references(() => AssetType.id).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
}));

export const CategoryRelations = relations(Category, ({ one }) => ({
    assetType: one(AssetType, {
        fields: [Category.assetTypeId],
        references: [AssetType.id],
    })
}));

// GroupType Model
export const GroupType = mysqlTable("group_type", {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt'),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
});

export const GroupTypeRelations = relations(GroupType, ({ one, many }) => ({
    groups: many(Group),
    tenant: one(Tenant,{
        fields: [GroupType.tenantId],
        references: [Tenant.id]
    }),
}));

// Group Model
export const Group = mysqlTable("group", {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    groupTypeId: bigint("group_type_id", { mode: 'bigint', unsigned: true}).notNull().references(() => GroupType.id),
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
   groupHasAssets: one(GroupHasAssets),
}));


// AssetType Model
export const AssetType = mysqlTable("asset_type", {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt'),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
}, (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
}));

export const InsertAssetTypeSchema = createInsertSchema(AssetType);
export const SelectAssetTypeSchema = createInsertSchema(AssetType);
export const UpdateAssetTypeSchema = InsertAssetTypeSchema.partial();

export type InsertAssetType = z.infer<typeof InsertAssetTypeSchema>;
export type SelectAssetType = z.infer<typeof SelectAssetTypeSchema>;
export type UpdateAssetType = z.infer<typeof UpdateAssetTypeSchema>;

export const AssetTypeRelations = relations(AssetType, ({ one, many }) => ({
    assetTypeHasProperties: many(AssetTypeHasProperties),
    tenant: one(Tenant,{
        fields: [AssetType.tenantId],
        references: [Tenant.id]
    })
}));


// AssetProperty Model
export const assetProperty = mysqlTable("asset_properties", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    propertyType: mysqlEnum(['number','string','textbox']).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt'),
}, (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name),
}));

export const InsertAssetPropertySchema = createInsertSchema(assetProperty);
export const SelectAssetPropertySchema = createInsertSchema(assetProperty);
export const UpdateAssetPropertySchema = InsertAssetPropertySchema.partial();

export type InsertAssetProperty = z.infer<typeof InsertAssetPropertySchema>;
export type SelectAssetProperty = z.infer<typeof SelectAssetPropertySchema>;
export type UpdateAssetProperty = z.infer<typeof UpdateAssetPropertySchema>;

export const AssetPropertyRelations = relations(assetProperty, ({ one }) => ({
    assetTypeHasProperties: one(AssetTypeHasProperties),
    tenant: one(Tenant,{
        fields: [assetProperty.tenantId],
        references: [Tenant.id]
    }),
}));



// AssetTypeHasProperties Model
export const AssetTypeHasProperties = mysqlTable("asset_type_propertys", {
    id: serial("id").primaryKey(),
    assetTypeId: bigint("asset_type_id", { mode: 'bigint', unsigned: true}).notNull().references(() => AssetType.id, { onDelete: 'cascade' }),
    assetPropertyId: bigint("asset_property_id", { mode: 'bigint', unsigned: true}).notNull().references(() => assetProperty.id, { onDelete: 'cascade' }),
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
}));


// BookingForm Model
export const BookingForm = mysqlTable("booking_forms", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
});

export const InsertBookingFormSchema = createInsertSchema(BookingForm);
export const SelectBookingFormSchema = createInsertSchema(BookingForm);
export const UpdateBookingFormSchema = InsertBookingFormSchema.partial();

export type InsertBookingForm = z.infer<typeof InsertBookingFormSchema>;
export type SelectBookingForm = z.infer<typeof SelectBookingFormSchema>;
export type UpdateBookingForm = z.infer<typeof UpdateBookingFormSchema>;

export const BookingFormField = mysqlTable("booking_form_fields", {
    id: serial("id").primaryKey(),
    formId: bigint("form_id",{ mode: 'bigint', unsigned: true}).notNull().references(() => BookingForm.id),
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

export const BookingFormRelations = relations(BookingForm, ({ one,many }) => ({
    fields: many(BookingFormField),
    tenant: one(Tenant,{
        fields:[BookingForm.tenantId],
        references: [Tenant.id]
    })
}));


