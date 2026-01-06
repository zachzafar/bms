import { relations} from "drizzle-orm";
import { mysqlTable, varchar, timestamp, uniqueIndex, serial, bigint, boolean } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { AssetType, assetProperty, BookingForm } from "../settings";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { User } from "../users";
import { v4 as uuid } from "uuid";

// Tenant Model
export const Tenant = mysqlTable("tenants", {
    id: varchar("id", { length: 36 }).primaryKey().$default(() => uuid()),
    name: varchar("name", { length: 255 }).notNull(),
    subdomain: varchar("subdomain", { length: 255 }).unique(),
    createdAt: timestamp('createdAt',{mode: 'string'}).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt',{mode: 'string'}).defaultNow().onUpdateNow()
}, (tenant) => ({
    subdomainUniqueIdx: uniqueIndex("subdomain_unique").on(tenant.subdomain),
}));

export const InsertTenantSchema = createInsertSchema(Tenant);
export const SelectTenantSchema = createSelectSchema(Tenant);

export type InsertTenant = z.infer<typeof InsertTenantSchema>
export type SelectTenant = z.infer<typeof SelectTenantSchema>

export const TenantRelations = relations(Tenant, ({ one, many }) => ({
    forms: many(BookingForm),
    assetTypes: many(AssetType),
    assetProperties: many(assetProperty),
    tenanTeams: many(TenantTeams),
}));


export const TenantTeams = mysqlTable("tenant_teams",{
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    name: varchar("name", { length: 255 }).notNull(),
})

export const InsertTenantTeamSchema = createInsertSchema(TenantTeams)
export const SelectTenantTeamSchema = createSelectSchema(TenantTeams)

export type InsertTenanTeam = z.infer<typeof InsertTenantTeamSchema>
export type SelectTenantTeam = z.infer<typeof SelectTenantTeamSchema>

export const TenantTeamRelations = relations(TenantTeams, ({ one ,many}) => ({
    tenant: one(Tenant, {
        fields: [TenantTeams.tenantId],
        references: [Tenant.id],
    }),
    tenantTeamToAsset: many(TenantTeamHasAssets),
    tenantTeamToUsers: many(TenantTeamHasUsers),
}))


export const TenantTeamHasUsers = mysqlTable("tennat_team_has_users",{
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    teamId: bigint("team_id", { mode: 'number', unsigned: true}).notNull().references(() => TenantTeams.id),
    userId: varchar("user_id",{length: 255}).notNull().references(() => User.id),
})

export const InsertTenantTeamHasUsersSchema = createInsertSchema(TenantTeamHasUsers);
export const SelectTenantTeamHasUsersSchema = createSelectSchema(TenantTeamHasUsers);

export type InsertTenantTeamHasUsers = z.infer<typeof InsertTenantTeamHasUsersSchema>
export type SelectTenantTeamHasUsers = z.infer<typeof SelectTenantTeamHasUsersSchema>

export const TenantTeamHasUsersRelations = relations(TenantTeamHasUsers, ({ one }) => ({
    team: one(TenantTeams, {
        fields: [TenantTeamHasUsers.teamId],
        references: [TenantTeams.id]
    }),
    user: one(User, {
        fields: [TenantTeamHasUsers.userId],
        references: [User.id]
    })
}))

export const TenantTeamHasAssets = mysqlTable("tenant_team_has_assets",{
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    teamId: bigint("team_id", { mode: 'number', unsigned: true}).notNull().references(() => TenantTeams.id),
    assetId: varchar("asset_id",{ length: 255}).notNull().references(() => Asset.id)
})

export const InsertTenantTeamHasAssetsSchema = createInsertSchema(TenantTeamHasAssets);
export const SelectTenantTeamHasAssetsSchema = createSelectSchema(TenantTeamHasAssets);

export type InsertTenantTeamHasAssets = z.infer<typeof InsertTenantTeamHasAssetsSchema>
export type SelectTenantTeamHasAssets = z.infer<typeof SelectTenantTeamHasAssetsSchema>

export const TenantTeamHasAssetsRelations = relations(TenantTeamHasAssets, ({ one }) => ({
    team: one(TenantTeams, {
        fields: [TenantTeamHasAssets.teamId],
        references: [TenantTeams.id]
    }),
    asset: one(Asset, {
        fields: [TenantTeamHasAssets.assetId],
        references: [Asset.id]
    })
}))

export const TenantHasUsers = mysqlTable("tenant_has_users", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => User.id),
    isAdmin: boolean("is_admin").default(false)
}, (table) => ({
    tenantIdx: uniqueIndex("tenant_idx").on(table.tenantId, table.userId),
}));

export const TenantHasUsersRelations = relations(TenantHasUsers, ({ one }) => ({
  user: one(User, {
    fields: [TenantHasUsers.userId],
    references: [User.id],
  }),
  tenant: one(Tenant, {
    fields: [TenantHasUsers.tenantId],
    references: [Tenant.id],
  }),
}));

export const InsertTenantHasUsersSchema = createInsertSchema(TenantHasUsers);
export const SelectTenantHasUsersSchema = createSelectSchema(TenantHasUsers)

export type InsertTenantHasUsers = z.infer<typeof InsertTenantHasUsersSchema>
export type SelectTenantHasUsers = z.infer<typeof SelectTenantHasUsersSchema>
