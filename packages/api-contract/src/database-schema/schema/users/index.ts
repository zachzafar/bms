import { relations, sql } from "drizzle-orm";
import { datetime, foreignKey,mysqlEnum, mysqlTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { Tenant } from "../tenant";
import { Asset } from "../asset";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";



// User Model
export const User = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: mysqlEnum(['ADMIN','SYSADMIN',"STAFF","OWNER","CUSTOMER"]).notNull(),  // Enum as string
    createdAt: timestamp('createdAt', {mode: 'string'}).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
}));

export const userRelations = relations(User, ({ one }) => ({
    customer: one(Customer, {
        fields: [User.id],
        references: [Customer.userId],
    })
}));

export const InsertUserSchema = createInsertSchema(User);
export const SelectUserSchema = createSelectSchema(User);

export type InsertUser = z.infer<typeof InsertUserSchema>
export type SelectUser = z.infer<typeof SelectUserSchema>

export const TenantHasUsers = mysqlTable("tenant_has_users", {
    id: serial("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => User.id),
}, (table) => ({
    tenantIdx: uniqueIndex("tenant_idx").on(table.tenantId, table.userId),
}));

export const InsertTenantHasUsersSchema = createInsertSchema(TenantHasUsers);
export const SelectTenantHasUsersSchema = createSelectSchema(TenantHasUsers)

export type InsertTenantHasUsers = z.infer<typeof InsertTenantHasUsersSchema>
export type SelectTenantHasUsers = z.infer<typeof SelectTenantHasUsersSchema>

export const TenantHasUsersRelations = relations(TenantHasUsers, ({ one }) => ({
    tenant: one(Tenant, {
        fields: [TenantHasUsers.tenantId],
        references: [Tenant.id],
    }),
    user: one(User, {
        fields: [TenantHasUsers.userId],
        references: [User.id],
    }),
}));

// Customer Model
export const Customer = mysqlTable("customers", {
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
export const Owner = mysqlTable("owners", {
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
    assets: many(Asset)
}))