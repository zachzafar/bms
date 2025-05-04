import { relations } from "drizzle-orm";
import { bigint, datetime, json, mysqlEnum, mysqlTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { Booking } from "../booking";
import { v4 as uuid } from "uuid";
import { Tenant } from "../tenant";


const userTypes = ["customer", "owner","system"] as const;
type UserType = (typeof userTypes)[number]; 

// User Model
export const User = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey().$default(() => uuid()),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(), // Enum as string
    userType: json("user_type").$type<UserType[]>().notNull(),
    createdAt: timestamp('createdAt', {mode: 'date'}).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
}));

export const userRelations = relations(User, ({ one,many }) => ({
    customer: one(Customer, {
        fields: [User.id],
        references: [Customer.userId],
    }),
    owner: one(Owner, {
        fields: [User.id],
        references: [Owner.userId],
    }),
    userToRoles: many(UserHasRoles),
    usersToAssets: many(UserHasAssets),
}));

export const InsertUserSchema = createInsertSchema(User).omit({ userType: true}).extend({
    userType: z.array(z.enum(userTypes)).min(1)
});
export const SelectUserSchema = createSelectSchema(User).extend({roles: z.array(z.number())});
export const UpdateUserSchema = InsertUserSchema.partial();

export type InsertUser = z.infer<typeof InsertUserSchema>
export type SelectUser = z.infer<typeof SelectUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>

export const UserHasBookings = mysqlTable("user_has_bookings",{
    id: serial("id").primaryKey(),
    userId: varchar("user_id", {length: 255}).notNull().references(() => User.id, { onDelete: 'cascade' }),
    bookingId: varchar("booking_id", { length: 255 }).notNull().references(() => Booking.id)
})

export const InsertUserHasBookingsSchema = createInsertSchema(UserHasBookings);
export const SelectUserHasBookingsSchema = createSelectSchema(UserHasBookings);

export type InsertUserHasBookings = z.infer<typeof InsertUserHasBookingsSchema>
export type SelectUserHasBookings = z.infer<typeof SelectUserHasBookingsSchema>

export const UserHasBookingsRelations = relations(UserHasBookings, ({ one }) => ({
    one: one(User,{
        fields: [UserHasBookings.userId],
        references: [User.id]
    }),
    booking: one(Booking,{
        fields: [UserHasBookings.bookingId],
        references: [Booking.id]
    })
}))

export const UserHasAssets = mysqlTable("user_has_assets",{
    id: serial("id").primaryKey(),
    userId: varchar("user_id", {length: 255}).notNull().references(() => User.id, { onDelete: 'cascade' }).notNull(),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
    type: mysqlEnum("type", ["owner", "manager"]).notNull().default("manager")
})

export const InsertUserHasAssetsSchema = createInsertSchema(UserHasAssets);
export const SelectUserHasAssetsSchema = createSelectSchema(UserHasAssets);

export type InsertUserHasAssets = z.infer<typeof InsertUserHasAssetsSchema>
export type SelectUserHasAssets = z.infer<typeof SelectUserHasAssetsSchema>

export const UserHasAssetsRelations = relations(UserHasAssets, ({ one }) => ({
    one: one(User,{
        fields: [UserHasAssets.userId],
        references: [User.id]
    }),
    asset: one(Asset,{
        fields: [UserHasAssets.assetId],
        references: [Asset.id]
    })
}))

// Customer Model
export const Customer = mysqlTable("customer_details", {
    id: serial("id").primaryKey(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    dateOfBirth: datetime("date_of_birth"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => User.id, { onDelete: 'cascade' }),
}, (table) => ({
    tenantUserCompoundIdx: uniqueIndex("tenant_user_compound_idx").on(table.tenantId, table.userId),
}));

export const InsertCustomerSchema = createInsertSchema(Customer);
export const SelectCustomerSchema = createSelectSchema(Customer);
export const UpdateCustomerSchema = InsertCustomerSchema.partial().required({ id: true, phone: true, address: true, dateOfBirth: true, userId: true });

export type InsertCustomer = z.infer<typeof InsertCustomerSchema>;
export type SelectCustomer = z.infer<typeof SelectCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

export const customerRelations = relations(Customer, ({ one }) => ({
    user: one(User, {
        fields: [Customer.userId],
        references: [User.id],
    }),
}));


// Owner Model
export const Owner = mysqlTable("owner_details", {
    id: serial("id").primaryKey(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    companyName: varchar("company_name", { length: 255 }),
    taxId: varchar("tax_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => User.id, { onDelete: 'cascade' }),
}, (table) => ({
    tenantUserCompoundIdx: uniqueIndex("tenant_user_compound_idx").on(table.tenantId, table.userId),
}));

export const InsertOwnerSchema = createInsertSchema(Owner);
export const SelectOwnerSchema = createSelectSchema(Owner);
export const UpdateOwnerSchema = InsertOwnerSchema.partial().required({ id: true, phone: true, address: true, companyName: true, taxId: true, userId: true });
export type InsertOwner = z.infer<typeof InsertOwnerSchema>;
export type SelectOwner = z.infer<typeof SelectOwnerSchema>;
export type UpdateOwner = z.infer<typeof UpdateOwnerSchema>;

export const ownerRelations = relations(Owner, ({ one, many }) => ({
    user: one(User, {
        fields: [Owner.userId],
        references: [User.id],
    }),
}))


export const Roles = mysqlTable("roles", {
    id: serial("id").primaryKey(),
    name: varchar("name", {length: 255}).notNull(),
    description: text("description"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    tenantId: varchar("tenant_id", {length: 255}).references(() => Tenant.id),
})

export const InsertRoleSchema = createInsertSchema(Roles);
export const SelectRoleSchema = createSelectSchema(Roles);

export type InsertRole = z.infer<typeof InsertRoleSchema>
export type SelectRole = z.infer<typeof SelectRoleSchema>

export const RoleRelations = relations(Roles, ({ many }) => ({
    rolesToPermissions: many(RoleHasPermissions),
    usersToRoles: many(UserHasRoles),
}));


export const UserHasRoles = mysqlTable("user_has_roles",{
    id: serial("id").primaryKey(),
    roleId: bigint("roles_id", { mode: 'bigint', unsigned: true}).notNull().references(() => Roles.id),
    userId: varchar("user_id", { length: 255}).references(() => User.id, { onDelete: 'cascade' }).notNull(),
    tenantId: varchar("tenant_id", { length: 255}).notNull().references(() => Tenant.id), // Add tenantId here als
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
})

export const InsertUserHasRolesSchema = createInsertSchema(UserHasRoles);
export const SelectUserHasRolesSchema = createSelectSchema(UserHasRoles);

export type InsertUserHasRoles = z.infer<typeof InsertUserHasRolesSchema>
export type SelectUserHasRoles = z.infer<typeof SelectUserHasRolesSchema>

export const UserHasRolesRelations = relations(UserHasRoles, ({ one }) => ({
    role: one(Roles,{
        fields: [UserHasRoles.roleId],
        references: [Roles.id]
    }),
    user: one(User,{
        fields: [UserHasRoles.userId],
        references: [User.id]
    })  
}))


export const RoleHasPermissions = mysqlTable("role_has_permissions",{
    id: serial("id").primaryKey(),
    roleId: bigint("role_id", { mode: 'bigint', unsigned: true}).references(() => Roles.id).notNull(),
    permission: varchar("permission", { length: 255}).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
})

export const RoleHasPermissionsRelations = relations(RoleHasPermissions, ({ one }) => ({
    role: one(Roles,{
        fields: [RoleHasPermissions.roleId],
        references: [Roles.id]
    })
}))

export const InsertRoleHasPermissionsSchema = createInsertSchema(RoleHasPermissions);
export const SelectRoleHasPermissionsSchema = createSelectSchema(RoleHasPermissions);

export type InsertRoleHasPermissions = z.infer<typeof InsertRoleHasPermissionsSchema>
export type SelectRoleHasPermissions = z.infer<typeof SelectRoleHasPermissionsSchema>



