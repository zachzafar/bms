import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, timestamp, index, uniqueIndex, boolean, bigint,mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema,  } from "drizzle-zod";
import { Tenant } from "../tenant";

import { z } from "zod";
import { AssetHasBookingForms, AssetHasTags } from "../asset";



export const Tags = mysqlTable(
  "tags",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    tagImage: varchar("tag_image", { length: 255 }),
    tenantId: varchar("tenant_id", { length: 255 }).references(() => Tenant.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name, table.tenantId),
    deletedAtIdx: index("tags_deleted_at_idx").on(table.deletedAt),
  })
);

// Define InsertTag schema, tenantId is optional, backend will fill it
export const InsertTagSchema = createInsertSchema(Tags).extend({
  name: z.string().min(1, "Tag name is required"),  // Ensure that name is always required
  description: z.string().optional(),  // Optional field for description
  tenantId: z.string().optional(),  // Optional as it's automatically filled by backend
});
export const SelectTagSchema = createSelectSchema(Tags);

export type InsertTag = z.infer<typeof InsertTagSchema>;
export type SelectTag = z.infer<typeof SelectTagSchema>;

export const TagsRelations = relations(Tags, ({ many, one }) => ({
  asset: many(AssetHasTags),
  bookingForms: many(TagHasBookingForms),
  tenant: one(Tenant, {
    fields: [Tags.tenantId],
    references: [Tenant.id],
  }),
}));


// AssetType Model
export const AssetType = mysqlTable("asset_type", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt'),
    deletedAt: timestamp('deleted_at'),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
}, (table) => ({
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name, table.tenantId),
    deletedAtIdx: index("asset_type_deleted_at_idx").on(table.deletedAt),
}));

export const InsertAssetTypeSchema = createInsertSchema(AssetType);
export const SelectAssetTypeSchema = createSelectSchema(AssetType);
export const UpdateAssetTypeSchema = InsertAssetTypeSchema.partial();

export type InsertAssetType = z.infer<typeof InsertAssetTypeSchema>;
export type SelectAssetType = z.infer<typeof SelectAssetTypeSchema>;
export type UpdateAssetType = z.infer<typeof UpdateAssetTypeSchema>;

export const AssetTypeRelations = relations(AssetType, ({ one, many }) => ({
    assetTypeHasProperties: many(AssetTypeHasProperties),
    bookingForms: many(AssetTypeHasBookingForms),
    tenant: one(Tenant,{
        fields: [AssetType.tenantId],
        references: [Tenant.id]
    })
}));


// AssetProperty Model
export const assetProperty = mysqlTable("asset_properties", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    propertyType: mysqlEnum(['number','string','textbox','list']).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt'),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    // Change the unique index to include both name and tenantId
    nameUniqueIdx: uniqueIndex("name_unique").on(table.name, table.tenantId),
    deletedAtIdx: index("asset_property_deleted_at_idx").on(table.deletedAt),
}));

export const InsertAssetPropertySchema = createInsertSchema(assetProperty);
export const SelectAssetPropertySchema = createSelectSchema(assetProperty);
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
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    assetTypeId: bigint("asset_type_id", { mode: 'number', unsigned: true}).notNull().references(() => AssetType.id, { onDelete: 'cascade' }),
    assetPropertyId: bigint("asset_property_id", { mode: 'number', unsigned: true}).notNull().references(() => assetProperty.id, { onDelete: 'cascade' }),
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
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
}, (table) => ({
    deletedAtIdx: index("booking_form_deleted_at_idx").on(table.deletedAt),
}));

export const InsertBookingFormSchema = createInsertSchema(BookingForm);
export const SelectBookingFormSchema = createSelectSchema(BookingForm);
export const UpdateBookingFormSchema = InsertBookingFormSchema.partial();

export type InsertBookingForm = z.infer<typeof InsertBookingFormSchema>;
export type SelectBookingForm = z.infer<typeof SelectBookingFormSchema>;
export type UpdateBookingForm = z.infer<typeof UpdateBookingFormSchema>;

export const BookingFormRelations = relations(BookingForm, ({ one,many }) => ({
    fields: many(BookingFormField),
    tenant: one(Tenant,{
        fields:[BookingForm.tenantId],
        references: [Tenant.id]
    }),
    assetsToForms: many(AssetHasBookingForms),
    assetTypesToForms: many(AssetTypeHasBookingForms),
    tagsToForms: many(TagHasBookingForms)
}));

export const BookingFormField = mysqlTable("booking_form_fields", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    formId: bigint("form_id",{ mode: 'number', unsigned: true}).notNull().references(() => BookingForm.id),
    name: varchar("name", { length: 255 }).notNull(),
    type: mysqlEnum(['number','text','textarea','date','time',"date_range","range","boolean","select"]).notNull(),
    required: boolean("required").notNull(),
    placeholder: varchar("placeholder", { length: 255 }),
    helpText: text("help_text"),
    minValue: varchar("min_value", { length: 100 }),
    maxValue: varchar("max_value", { length: 100 }),
    options: text("options"), // JSON array of options for select type
    allowMultiple: boolean("allow_multiple").default(false), // true for checkbox (multi-select), false for radio (single-select)
    displayOrder: bigint("display_order", { mode: 'number', unsigned: true }).default(0).notNull(),
}, (table) => ({
    formIdx: index("form_idx").on(table.formId),
}));

export const InsertBookingFormFieldSchema = createInsertSchema(BookingFormField).extend({
    options: z.string().optional().refine((val) => {
        if (!val) return true;
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) && parsed.every(item => typeof item === 'string');
        } catch {
            return false;
        }
    }, { message: "Options must be a valid JSON array of strings" }),
});
export const SelectBookingFormFieldSchema = createSelectSchema(BookingFormField);
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


// AssetType has booking forms junction table
export const AssetTypeHasBookingForms = mysqlTable("asset_type_has_booking_forms", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    assetTypeId: bigint("asset_type_id", { mode: 'number', unsigned: true}).notNull().references(() => AssetType.id, { onDelete: 'cascade' }),
    bookingFormId: bigint("booking_form_id", { mode: 'number', unsigned: true}).notNull().references(() => BookingForm.id, { onDelete: 'cascade' }),
}, (table) => ({
    assetTypeFormUniqueIdx: uniqueIndex("asset_type_form_unique").on(table.assetTypeId, table.bookingFormId),
}));

export const InsertAssetTypeHasBookingFormsSchema = createInsertSchema(AssetTypeHasBookingForms);
export const SelectAssetTypeHasBookingFormsSchema = createSelectSchema(AssetTypeHasBookingForms);

export type InsertAssetTypeHasBookingForms = z.infer<typeof InsertAssetTypeHasBookingFormsSchema>;
export type SelectAssetTypeHasBookingForms = z.infer<typeof SelectAssetTypeHasBookingFormsSchema>;

export const AssetTypeHasBookingFormsRelations = relations(AssetTypeHasBookingForms, ({ one }) => ({
    assetType: one(AssetType, {
        fields: [AssetTypeHasBookingForms.assetTypeId],
        references: [AssetType.id],
    }),
    bookingForm: one(BookingForm, {
        fields: [AssetTypeHasBookingForms.bookingFormId],
        references: [BookingForm.id],
    }),
}));


// Tag has booking forms junction table
export const TagHasBookingForms = mysqlTable("tag_has_booking_forms", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    tagId: bigint("tag_id", { mode: 'number', unsigned: true}).notNull().references(() => Tags.id, { onDelete: 'cascade' }),
    bookingFormId: bigint("booking_form_id", { mode: 'number', unsigned: true}).notNull().references(() => BookingForm.id, { onDelete: 'cascade' }),
}, (table) => ({
    tagFormUniqueIdx: uniqueIndex("tag_form_unique").on(table.tagId, table.bookingFormId),
}));

export const InsertTagHasBookingFormsSchema = createInsertSchema(TagHasBookingForms);
export const SelectTagHasBookingFormsSchema = createSelectSchema(TagHasBookingForms);

export type InsertTagHasBookingForms = z.infer<typeof InsertTagHasBookingFormsSchema>;
export type SelectTagHasBookingForms = z.infer<typeof SelectTagHasBookingFormsSchema>;

export const TagHasBookingFormsRelations = relations(TagHasBookingForms, ({ one }) => ({
    tag: one(Tags, {
        fields: [TagHasBookingForms.tagId],
        references: [Tags.id],
    }),
    bookingForm: one(BookingForm, {
        fields: [TagHasBookingForms.bookingFormId],
        references: [BookingForm.id],
    }),
}));



