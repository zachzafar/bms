import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, timestamp, index, uniqueIndex, boolean, bigint, mysqlEnum } from "drizzle-orm/mysql-core";
import { AssetType,assetProperty, BookingForm, Tags } from "../settings";
import { Tenant, TenantTeamHasAssets } from "../tenant";
import { User, UserHasAssets } from "../users";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { MaintenanceTask } from "../maintenance";
import { Rate } from "../booking";

// Asset Model
export const Asset = mysqlTable("assets", {
    id: varchar("id", { length: 36 }).primaryKey().$default(() => uuid()),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    available: boolean("available").default(true).notNull(),
    requiresApproval: boolean("requires_approval").default(false).notNull(),
    assetTypeId: bigint("asset_type_id", { mode: 'number', unsigned: true}).references(() => AssetType.id).notNull(),
    userId: varchar("user_id",{length: 255}).references(() => User.id),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
    userIdx: index("owner_idx").on(table.userId),
}));

export const SelectAssetSchema = createSelectSchema(Asset)

export const InsertAssetSchema = createInsertSchema(Asset)

export const UpdateAssetSchema = InsertAssetSchema.partial();

export type SelectAsset = z.infer<typeof SelectAssetSchema>;
export type InsertAsset = z.infer<typeof InsertAssetSchema>;
export type UpdateAsset = z.infer<typeof UpdateAssetSchema>;

export const AssetRelations = relations(Asset, ({ one, many }) => ({
  tenant: one(Tenant, {
    fields: [Asset.tenantId],
    references: [Tenant.id],
  }),
  assetType: one(AssetType, {
    fields: [Asset.assetTypeId],
    references: [AssetType.id],
  }),
  maintenances: many(MaintenanceTask),
  user: many(UserHasAssets),
  tags: many(AssetHasTags),
  bookingForms: many(AssetHasBookingForms),
  assetImages: many(AssetImages),
  properties: many(AssetHasProperties),
  tenantTeamToAsset: many(TenantTeamHasAssets),
  rates: many(AssetHasRates),
}));



export const AssetImages = mysqlTable("asset_images",{
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
    filePath: varchar("file_path", { length: 255 }).notNull(),
    imageType: mysqlEnum("image_type", ["primary", "secondary","gallery"]).notNull().default("gallery"),
})

export const SelectAssetImagesSchema = createSelectSchema(AssetImages)
export type SelectAssetImages = z.infer<typeof SelectAssetImagesSchema>;

export const AssetImagesRelations = relations(AssetImages, ({ one }) => ({
    asset: one(Asset, {
        fields: [AssetImages.assetId],
        references: [Asset.id],
    }),
}))

// AssetHasProperties Model
export const AssetHasProperties = mysqlTable("asset_has_properties", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    assetId: varchar("tenant_id", { length: 255 }).notNull().references(() => Asset.id),
    assetPropertyId: bigint("asset_property_id", { mode: 'number', unsigned: true}).notNull().references(() => assetProperty.id),
    value: text("value").notNull(),
}, (table) => ({
    assetPropertyUniqueIdx: uniqueIndex("asset_property_unique").on(table.assetId, table.assetPropertyId),
}));

export const SelectAssetHasPropertiesSchema = createSelectSchema(AssetHasProperties)

export type SelectAssetHasProperties = z.infer<typeof SelectAssetHasPropertiesSchema>;

export const AssetHasPropertiesRelations = relations(AssetHasProperties, ({ one }) => ({
    asset: one(Asset, {
        fields: [AssetHasProperties.assetId],
        references: [Asset.id],
    }),
    assetProperty: one(assetProperty, {
        fields: [AssetHasProperties.assetPropertyId],
        references: [assetProperty.id],
    }),
}))

export const AssetHasTags = mysqlTable("asset_has_tags", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    tagId: bigint("tag_id", { mode: 'number', unsigned: true })
        .notNull()
        .references(() => Tags.id, { onDelete: 'cascade' }), // lowercase 'cascade'
    assetId: varchar("asset_id", { length: 255 })
        .notNull()
        .references(() => Asset.id, { onDelete: 'cascade' }), // lowercase 'cascade'
});



export const AssetHasTagsRelations = relations(AssetHasTags, ({ one }) => ({
    asset: one(Asset, {
        fields: [AssetHasTags.assetId],
        references: [Asset.id],
    }),
    tag: one(Tags, {
        fields: [AssetHasTags.tagId],
        references: [Tags.id],
    }),
}))

export const AssetHasBookingForms = mysqlTable("asset_has_booking_forms", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id, { onDelete: 'cascade' }),
    bookingFormId: bigint("booking_form_id",{mode: 'number', unsigned: true}).notNull().references(() => BookingForm.id, { onDelete: 'cascade' })
}, (table) => ({
    assetFormUniqueIdx: uniqueIndex("asset_form_unique").on(table.assetId, table.bookingFormId),
}))

export const AssetHasBookingFormsRelations = relations(AssetHasBookingForms, ({ one }) => ({
    asset: one(Asset, {
        fields: [AssetHasBookingForms.assetId],
        references: [Asset.id],
    }),
    bookingForm: one(BookingForm, {
        fields: [AssetHasBookingForms.bookingFormId],
        references: [BookingForm.id],
    }),
}))

export const AssetHasRates = mysqlTable("asset_has_rates", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  rateId: bigint("rate_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => Rate.id),
  assetId: varchar("asset_id", { length: 255 })
    .notNull()
    .references(() => Asset.id),
});

export const AssetHasRatesRelations = relations(AssetHasRates, ({ one }) => ({
  asset: one(Asset, {
    fields: [AssetHasRates.assetId],
    references: [Asset.id],
  }),
  rate: one(Rate, {
    fields: [AssetHasRates.rateId],
    references: [Rate.id],
  }),
}));




