import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, int, timestamp, index, uniqueIndex, boolean, mysqlEnum, bigint } from "drizzle-orm/mysql-core";
import { AssetType, Group, assetProperty } from "../settings";
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
    groupId: bigint("group_id",{ mode: 'bigint', unsigned: true}).references(() => Group.id),
    ownerId: bigint("owner_id",{mode: 'bigint', unsigned: true}).references(() => Owner.id),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    assetTypeIdx: index("asset_type_idx").on(table.assetTypeId),
    groupIdx: index("group_idx").on(table.groupId),
    ownerIdx: index("owner_idx").on(table.ownerId),
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
    group: one(Group, {
        fields: [Asset.groupId],
        references: [Group.id],
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