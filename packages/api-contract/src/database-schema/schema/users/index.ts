import { relations, sql } from "drizzle-orm";
import { datetime, foreignKey,mysqlEnum, mysqlTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { Tenant } from "../tenant";
import { Asset } from "../asset";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";



// User Model
export const User = mysqlTable("user", {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    role: mysqlEnum(['ADMIN','SYSADMIN',"STAFF","OWNER","CUSTOMER"]).notNull(),  // Enum as string
    createdAt: timestamp('createdAt', {mode: 'string'}).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
}));

export const userRelations = relations(User, ({ one }) => ({
    tenant: one(Tenant, {
        fields: [User.tenantId], // User table's foreign key
        references: [Tenant.id], // Tenant table's primary key
    }),
    customer: one(Customer, {
        fields: [User.id],
        references: [Customer.userId],
    })
}));

export const InsertUserSchema = createInsertSchema(User);
export const SelectUserSchema = createSelectSchema(User);

export type InsertUser = z.infer<typeof InsertUserSchema>
export type SelectUser = z.infer<typeof SelectUserSchema>

// Customer Model
export const Customer = mysqlTable("customer", {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    dateOfBirth: datetime("date_of_birth"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    userId: varchar("user_id", { length: 255 }).notNull(),
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
    userIdUniqueIdx: uniqueIndex("user_id_unique").on(table.userId),
}));

export const customerRelations = relations(Customer, ({ one }) => ({
    tenant: one(Tenant, {
        fields: [Customer.tenantId],
        references: [Tenant.id],
    }),
    user: one(User, {
        fields: [Customer.userId],
        references: [User.id],
    }),
}));

// Owner Model
export const Owner = mysqlTable("owner", {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    companyName: varchar("company_name", { length: 255 }),
    taxId: varchar("tax_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    userId: varchar("user_id", { length: 255 }).notNull(),
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
    userIdUniqueIdx: uniqueIndex("user_id_unique").on(table.userId),
}));

export const ownerRelations = relations(Owner, ({ one, many }) => ({
    tenant: one(Tenant, {
        fields: [Owner.tenantId],
        references: [Tenant.id],
    }),
    user: one(User, {
        fields: [Owner.userId],
        references: [User.id],
    }),
    assets: many(Asset)
}))