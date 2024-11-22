import { sql } from "drizzle-orm";
import { datetime, mysqlTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";



// User Model
export const User = mysqlTable("user", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull(),  // Enum as string
    createdAt: timestamp('createdAt', {mode: 'string'}).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', {mode: 'string'}).notNull().onUpdateNow()
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
}));



// Customer Model
export const Customer = mysqlTable("customer", {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    dateOfBirth: datetime("date_of_birth"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    userId: varchar("user_id", { length: 255 }).notNull(),
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
    userIdUniqueIdx: uniqueIndex("user_id_unique").on(table.userId),
}));

// Owner Model
export const Owner = mysqlTable("owner", {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }),
    address: varchar("address", { length: 255 }),
    companyName: varchar("company_name", { length: 255 }),
    taxId: varchar("tax_id", { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    userId: varchar("user_id", { length: 255 }).notNull(),
}, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
    userIdUniqueIdx: uniqueIndex("user_id_unique").on(table.userId),
}));