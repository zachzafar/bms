import { relations } from "drizzle-orm";
import { bigint, datetime, index, int, json, mysqlEnum, mysqlTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { Tenant } from "../tenant";


// User Model
export const User = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey().$default(() => uuid()),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(), // Enum as string
    userType: mysqlEnum("user_type", ["system","admin"]).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
}));

export const userRelations = relations(User, ({ one, many }) => ({
    userToRoles: many(UserHasRoles),
}));

export const InsertUserSchema = createInsertSchema(User)
export const SelectUserSchema = createSelectSchema(User).extend({ roles: z.array(z.object({ roleId: z.number(), roleName: z.string() }))});
export const UpdateUserSchema = InsertUserSchema.partial();

export type InsertUser = z.infer<typeof InsertUserSchema>
export type SelectUser = z.infer<typeof SelectUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>

export const OwnerHasAssets = mysqlTable("owner_has_assets", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    ownerId: bigint("owner_id", { mode: "number", unsigned: true }).notNull().references(() => Owner.id, { onDelete: 'cascade' }).notNull(),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
})

export const InsertOwnerHasAssetsSchema = createInsertSchema(OwnerHasAssets);
export const SelectOwnerHasAssetsSchema = createSelectSchema(OwnerHasAssets);

export type InsertOwnerHasAssets = z.infer<typeof InsertOwnerHasAssetsSchema>
export type SelectOwnerHasAssets = z.infer<typeof SelectOwnerHasAssetsSchema>

export const OwnerHasAssetsRelations = relations(OwnerHasAssets, ({ one }) => ({
    one: one(Owner, {
        fields: [OwnerHasAssets.ownerId],
        references: [Owner.id]
    }),
    asset: one(Asset, {
        fields: [OwnerHasAssets.assetId],
        references: [Asset.id]
    })
}))

// CustomerType Model - defines types of customers for a tenant
export const CustomerType = mysqlTable("customer_types", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
}, (table) => ({
    tenantNameIdx: uniqueIndex("customer_type_tenant_name_idx").on(table.tenantId, table.name),
    deletedAtIdx: index("customer_type_deleted_at_idx").on(table.deletedAt),
}));

export const InsertCustomerTypeSchema = createInsertSchema(CustomerType);
export const SelectCustomerTypeSchema = createSelectSchema(CustomerType);
export const UpdateCustomerTypeSchema = InsertCustomerTypeSchema.partial().required({ id: true });

export type InsertCustomerType = z.infer<typeof InsertCustomerTypeSchema>;
export type SelectCustomerType = z.infer<typeof SelectCustomerTypeSchema>;
export type UpdateCustomerType = z.infer<typeof UpdateCustomerTypeSchema>;

export const customerTypeRelations = relations(CustomerType, ({ one, many }) => ({
    tenant: one(Tenant, {
        fields: [CustomerType.tenantId],
        references: [Tenant.id],
    }),
    customers: many(Customer),
}));

// Customer Model
export const Customer = mysqlTable("customer_details", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    customerTypeId: bigint("customer_type_id", { mode: 'number', unsigned: true })
      .references(() => CustomerType.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
}, (table) => ({
    tenantEmailIdx: uniqueIndex("tenant_email_idx").on(table.tenantId, table.email),
}));

export const InsertCustomerSchema = createInsertSchema(Customer);
export const SelectCustomerSchema = createSelectSchema(Customer);
export const UpdateCustomerSchema = InsertCustomerSchema.partial().required({ id: true });

export type InsertCustomer = z.infer<typeof InsertCustomerSchema>;
export type SelectCustomer = z.infer<typeof SelectCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

export const customerRelations = relations(Customer, ({ one }) => ({
    customerType: one(CustomerType, {
        fields: [Customer.customerTypeId],
        references: [CustomerType.id],
    }),
}));


// Owner Model
export const Owner = mysqlTable("owner_details", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
}, (table) => ({
    deletedAtIdx: index("owner_deleted_at_idx").on(table.deletedAt),
}));

export const InsertOwnerSchema = createInsertSchema(Owner);
export const SelectOwnerSchema = createSelectSchema(Owner);
export const UpdateOwnerSchema = InsertOwnerSchema.partial()
export type InsertOwner = z.infer<typeof InsertOwnerSchema>;
export type SelectOwner = z.infer<typeof SelectOwnerSchema>;
export type UpdateOwner = z.infer<typeof UpdateOwnerSchema>;

export const ownerRelations = relations(Owner, ({ one, many }) => ({
    tenantId: one(Tenant, {
        fields: [Owner.tenantId],
        references: [Tenant.id],
    }),
}))


export const Roles = mysqlTable("roles", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
    tenantId: varchar("tenant_id", { length: 255 }).references(() => Tenant.id),
}, (table) => ({
    deletedAtIdx: index("roles_deleted_at_idx").on(table.deletedAt),
}))

export const InsertRoleSchema = createInsertSchema(Roles);
export const SelectRoleSchema = createSelectSchema(Roles);

export type InsertRole = z.infer<typeof InsertRoleSchema>
export type SelectRole = z.infer<typeof SelectRoleSchema>

export const RoleRelations = relations(Roles, ({ many }) => ({
    rolesToPermissions: many(RoleHasPermissions),
    usersToRoles: many(UserHasRoles),
}));


export const UserHasRoles = mysqlTable("user_has_roles", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    roleId: bigint("roles_id", { mode: 'number', unsigned: true }).notNull().references(() => Roles.id, { onDelete: 'cascade' }),
    userId: varchar("user_id", { length: 255 }).references(() => User.id, { onDelete: 'cascade' }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id), // Add tenantId here als
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
})

export const InsertUserHasRolesSchema = createInsertSchema(UserHasRoles);
export const SelectUserHasRolesSchema = createSelectSchema(UserHasRoles);

export type InsertUserHasRoles = z.infer<typeof InsertUserHasRolesSchema>
export type SelectUserHasRoles = z.infer<typeof SelectUserHasRolesSchema>

export const UserHasRolesRelations = relations(UserHasRoles, ({ one }) => ({
    role: one(Roles, {
        fields: [UserHasRoles.roleId],
        references: [Roles.id]
    }),
    user: one(User, {
        fields: [UserHasRoles.userId],
        references: [User.id]
    })
}))


export const RoleHasPermissions = mysqlTable("role_has_permissions", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    roleId: bigint("role_id", { mode: 'number', unsigned: true }).references(() => Roles.id, { onDelete: 'cascade' }).notNull(),
    permission: varchar("permission", { length: 255 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
})

export const RoleHasPermissionsRelations = relations(RoleHasPermissions, ({ one }) => ({
    role: one(Roles, {
        fields: [RoleHasPermissions.roleId],
        references: [Roles.id]
    })
}))

export const InsertRoleHasPermissionsSchema = createInsertSchema(RoleHasPermissions);
export const SelectRoleHasPermissionsSchema = createSelectSchema(RoleHasPermissions);

export type InsertRoleHasPermissions = z.infer<typeof InsertRoleHasPermissionsSchema>
export type SelectRoleHasPermissions = z.infer<typeof SelectRoleHasPermissionsSchema>



