import { relations } from "drizzle-orm";
import { bigint, datetime, mysqlTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { Booking } from "../booking";

// User Model
export const User = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(), // Enum as string
    createdAt: timestamp('createdAt', {mode: 'string'}).defaultNow(),
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
    roles: many(Roles),
    assets: many(Asset),
}));

export const InsertUserSchema = createInsertSchema(User);
export const SelectUserSchema = createSelectSchema(User);

export type InsertUser = z.infer<typeof InsertUserSchema>
export type SelectUser = z.infer<typeof SelectUserSchema>

export const UserHasBookings = mysqlTable("user_has_bookings",{
    id: serial("id").primaryKey(),
    userId: varchar("user_id", {length: 255}).notNull().references(() => User.id),
    bookingId: varchar("booking_id", { length: 255 }).notNull().references(() => Booking.id)
})

export const InsertUserHasBookingsSchema = createInsertSchema(UserHasBookings);
export const SelectUserHasBookingsSchema = createSelectSchema(UserHasBookings);

export type InsertUserHasBookings = z.infer<typeof InsertUserHasBookingsSchema>
export type SelectUserHasBookings = z.infer<typeof SelectUserHasBookingsSchema>

export const UserHasAssets = mysqlTable("user_has_assets",{
    id: serial("id").primaryKey(),
    userId: varchar("user_id", {length: 255}).notNull().references(() => User.id).notNull(),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id)
})

export const InsertUserHasAssetsSchema = createInsertSchema(UserHasAssets);
export const SelectUserHasAssetsSchema = createSelectSchema(UserHasAssets);

export type InsertUserHasAssets = z.infer<typeof InsertUserHasAssetsSchema>
export type SelectUserHasAssets = z.infer<typeof SelectUserHasAssetsSchema>


// Customer Model
export const Customer = mysqlTable("customer_details", {
    id: serial("id").primaryKey(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    dateOfBirth: datetime("date_of_birth"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => User.id, { onDelete: 'cascade' }),
}, (table) => ({
    userIdUniqueIdx: uniqueIndex("user_id_unique").on(table.userId),
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
    userId: varchar("user_id", { length: 255 }).notNull().references(() => User.id, { onDelete: 'cascade' }),
}, (table) => ({
    userIdUniqueIdx: uniqueIndex("user_id_unique").on(table.userId),
}));

export const ownerRelations = relations(Owner, ({ one, many }) => ({
    user: one(User, {
        fields: [Owner.userId],
        references: [User.id],
    }),
}))


export const Roles = mysqlTable("roles", {
    id: serial("id").primaryKey(),
    name: varchar("name", {length: 255}),
    description: text("description")
})

export const InsertRoleSchema = createInsertSchema(Roles);
export const SelectRoleSchema = createSelectSchema(Roles);

export type InsertRole = z.infer<typeof InsertRoleSchema>
export type SelectRole = z.infer<typeof SelectRoleSchema>

export const RoleRelations = relations(Roles, ({ one,many }) => ({
    permissions: many(Permissions),
    users: many(User),
}))


export const UserHasRoles = mysqlTable("user_has_roles",{
    id: serial("id").primaryKey(),
    roleId: bigint("roles_id", { mode: 'bigint', unsigned: true}).notNull().references(() => Roles.id),
    userId: varchar("user_id", { length: 255}).references(() => User.id).notNull()
})

export const InsertUserHasRolesSchema = createInsertSchema(UserHasRoles);
export const SelectUserHasRolesSchema = createSelectSchema(UserHasRoles);

export type InsertUserHasRoles = z.infer<typeof InsertUserHasRolesSchema>
export type SelectUserHasRoles = z.infer<typeof SelectUserHasRolesSchema>


export const RoleHasPermissions = mysqlTable("role_has_permissions",{
    id: serial("id").primaryKey(),
    roleId: bigint("asset_type_id", { mode: 'bigint', unsigned: true}).references(() => Roles.id).notNull(),
    permissionId: bigint("permission_id", { mode: 'bigint', unsigned: true}).references(() => Permissions.id).notNull()
})

export const InsertRoleHasPermissionsSchema = createInsertSchema(RoleHasPermissions);
export const SelectRoleHasPermissionsSchema = createSelectSchema(RoleHasPermissions);

export type InsertRoleHasPermissions = z.infer<typeof InsertRoleHasPermissionsSchema>
export type SelectRoleHasPermissions = z.infer<typeof SelectRoleHasPermissionsSchema>


export const Permissions = mysqlTable("permissions", {
    id: serial("id").primaryKey(),
    name: varchar("name",{ length: 255}),
    description: text("description"),
})

export const InsertPermissionSchema = createInsertSchema(Permissions);
export const SelectPermissionSchema = createSelectSchema(Permissions);

export type InsertPermission = z.infer<typeof InsertPermissionSchema>
export type SelectPermission = z.infer<typeof SelectPermissionSchema>

export const PermissionRelations = relations(Permissions, ({ many }) => ({
    roles: many(Roles)
}))