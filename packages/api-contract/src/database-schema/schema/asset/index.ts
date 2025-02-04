import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, int, timestamp, index, uniqueIndex, boolean, mysqlEnum, bigint } from "drizzle-orm/mysql-core";
import { AssetType, Group, assetProperty, BookingForm } from "../settings";
import { Tenant } from "../tenant";
import { Owner, User } from "../users";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Asset Model
export const Asset = mysqlTable("assets", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    available: boolean("available").default(true).notNull(),
    requiresApproval: boolean("requires_approval").default(false).notNull(),
    assetTypeId: bigint("asset_type_id", { mode: 'bigint', unsigned: true}).references(() => AssetType.id),
    bookingFormId: bigint("booking_form_id",{ mode: 'bigint', unsigned: true}).references(() => BookingForm.id),
    ownerId: bigint("owner_id",{mode: 'bigint', unsigned: true}).references(() => Owner.id),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
    bookingformIdx: index("booking_form_idx").on(table.bookingFormId),
    ownerIdx: index("owner_idx").on(table.ownerId),
}));

export const SelectAssetSchema = createSelectSchema(Asset);
export const InsertAssetSchema = createSelectSchema(Asset);
export const UpdateAssetSchema = InsertAssetSchema.partial();

export type SelectAsset = z.infer<typeof SelectAssetSchema>;
export type InsertAsset = z.infer<typeof InsertAssetSchema>;
export type UpdateAsset = z.infer<typeof UpdateAssetSchema>;

export const AssetRelations = relations(Asset, ({ one }) => ({
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
    owner: one(Owner, {
        fields: [Asset.ownerId],
        references: [Owner.id],
    }),
})
)

// AssetHasProperties Model
export const AssetHasProperties = mysqlTable("asset_has_properties", {
    id: serial("id").primaryKey(),
    assetId: bigint("asset_id", { mode: 'bigint', unsigned: true}).notNull().references(() => Asset.id),
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
})
)

export const GroupHasAssets = mysqlTable("group_has_assets", {
    id: serial("id").primaryKey(),
    groupId: bigint("group_id", { mode: 'bigint', unsigned: true}).notNull().references(() => Group.id),
    assetId: bigint("asset_id", { mode: 'bigint', unsigned: true}).notNull().references(() => Asset.id),
}, (table) => ({
    groupIdx: index("group_idx").on(table.groupId),
    assetIdx: index("asset_idx").on(table.assetId),
}));

export const InsertGroupHasAssetsSchema = createSelectSchema(GroupHasAssets);
export const SelectGroupHasAssetsSchema = InsertGroupHasAssetsSchema.required({ id: true });
export const UpdateGroupHasAssetsSchema = InsertGroupHasAssetsSchema.partial();

export type InsertGroupHasAssets = z.infer<typeof InsertGroupHasAssetsSchema>;
export type SelectGroupHasAssets = z.infer<typeof SelectGroupHasAssetsSchema>;
export type UpdateGroupHasAssets = z.infer<typeof UpdateGroupHasAssetsSchema>;

export const GroupHasAssetsRelations = relations(GroupHasAssets, ({ one }) => ({
    group: one(Group, {
        fields: [GroupHasAssets.groupId],
        references: [Group.id],
    }),
    asset: one(Asset, {
        fields: [GroupHasAssets.assetId],
        references: [Asset.id],
    }),
})
)