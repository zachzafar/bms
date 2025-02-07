import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, int, timestamp, index, uniqueIndex, boolean, bigint } from "drizzle-orm/mysql-core";
import { AssetType,assetProperty, BookingForm, Tags } from "../settings";
import { Tenant } from "../tenant";
import { Owner, User } from "../users";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Asset Model
export const Asset = mysqlTable("assets", {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    available: boolean("available").default(true).notNull(),
    requiresApproval: boolean("requires_approval").default(false).notNull(),
    assetTypeId: bigint("asset_type_id", { mode: 'bigint', unsigned: true}).references(() => AssetType.id),
    bookingFormId: bigint("booking_form_id",{ mode: 'bigint', unsigned: true}).references(() => BookingForm.id),
    userId: varchar("user_id",{length: 255}).references(() => User.id),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
    bookingformIdx: index("booking_form_idx").on(table.bookingFormId),
    userIdx: index("owner_idx").on(table.userId),
}));

export const SelectAssetSchema = createSelectSchema(Asset);
export const InsertAssetSchema = createSelectSchema(Asset);
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
    bookingForm: one(BookingForm, {
        fields: [Asset.bookingFormId],
        references: [BookingForm.id],
    }),
    user: many(User),
    tags: many(Tags),
    bookingForms: many(BookingForm),
    assetImages: many(AssetImages),
    properties: many(AssetHasProperties),
})
)

export const AssetImages = mysqlTable("asset_images",{
    id: serial("id").primaryKey(),
    assetId: varchar("tenant_id", { length: 255 }).notNull().references(() => Asset.id),
    filePath: varchar("tenant_id", { length: 255 }).notNull()
})

// AssetHasProperties Model
export const AssetHasProperties = mysqlTable("asset_has_properties", {
    id: serial("id").primaryKey(),
    assetId: varchar("tenant_id", { length: 255 }).notNull().references(() => Asset.id),
    assetPropertyId: bigint("asset_property_id", { mode: 'bigint', unsigned: true}).notNull().references(() => assetProperty.id),
    value: varchar("value", { length: 255 }).notNull(),
}, (table) => ({
    assetPropertyUniqueIdx: uniqueIndex("asset_property_unique").on(table.assetId, table.assetPropertyId),
}));

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

export const AssetHasTags = mysqlTable("asset_has_tags",{
    id: serial("id").primaryKey(),
    tagId: bigint("tag_id",{mode: 'bigint', unsigned: true}).references(() => Tags.id),
    assetId: varchar("asset_id", {length: 255}).notNull().references(() => Asset.id)
})

export const AssetHasBookingForms = mysqlTable("asset_has_booking_forms", {
    id: serial("id").primaryKey(),
    assetId: varchar("tenant_id", { length: 255 }).notNull().references(() => Asset.id),
    bookingFormId: bigint("booking_form_id",{mode: 'bigint', unsigned: true}).references(() => BookingForm.id)
})

