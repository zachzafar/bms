import { relations, sql } from "drizzle-orm";
import { datetime, mysqlTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { Asset, Booking, Invoice, MaintenanceTask, Payment, Tenant } from ".";




// User Model
export const User = mysqlTable("user", {
    id: varchar("id", { length: 255 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    tenantId: varchar("tenant_id", { length: 255 }),
  }, (table) => ({
    emailUniqueIdx: uniqueIndex("email_unique").on(table.email),
  }));
  
  export const UserRelations = relations(User, ({ one, many }) => ({
    tenant: one(Tenant, { fields: [User.tenantId], references: [Tenant.id] }),
    customer: one(Customer, { fields: [User.id], references: [Customer.userId] }),
    owner: one(Owner, { fields: [User.id], references: [Owner.id] }),
    assignedMaintenanceTasks: many(MaintenanceTask),
  }));

  
export const selectUserSchema = createSelectSchema(User);
export const insertUserSchema = createInsertSchema(User, {
  email: (schema) => schema.email.email(),
  password: (schema) => schema.password.min(8),
})

export const loginSchema = insertUserSchema.pick({ email: true, password: true });

export const Session = mysqlTable("session", {
    id: varchar("id", {
        length: 255
    }).primaryKey(),
    userId: varchar("user_id", {
        length: 255
    })
        .notNull()
        .references(() => User.id),
    expiresAt: datetime("expires_at").notNull()
});

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
  
  export const CustomerRelations = relations(Customer, ({ one, many }) => ({
    user: one(User, { fields: [Customer.userId], references: [User.id] }),
    bookings: many(Booking),
    payments: many(Payment),
    invoices: many(Invoice),
  }));
  
  export const selectCustomerSchema = createSelectSchema(Customer);
  export const insertCustomerSchema = createInsertSchema(Customer, {
    email: (schema) => schema.email.email(),
  }).omit({ id: true, createdAt: true, updatedAt: true });
  
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
  
  export const OwnerRelations = relations(Owner, ({ one, many }) => ({
    user: one(User, { fields: [Owner.userId], references: [User.id] }),
    ownedAssets: many(Asset),
    bookings: many(Booking),
  }));
  
  export const selectOwnerSchema = createSelectSchema(Owner);
  export const insertOwnerSchema = createInsertSchema(Owner, {
    email: (schema) => schema.email.email(),
  }).omit({ id: true, createdAt: true, updatedAt: true });
  