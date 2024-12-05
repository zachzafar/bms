import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, datetime, json, decimal, text, timestamp, int, index, serial } from "drizzle-orm/mysql-core";
import { Customer, User } from "../users";
import { Asset } from "../asset";
import { Tenant } from "../tenant";



// Booking Model
export const Booking = mysqlTable("booking", {
    id: serial("id").primaryKey(),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    formData: json("form_data"),
    totalPrice: decimal({ precision: 1 }),
    message: text("message"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    assetId: int("asset_id").notNull(),
    customerId: varchar("customer_id", { length: 255 }).notNull(),
    
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    customerIdx: index("customer_idx").on(table.customerId),
}));

export const BookingRelations = relations(Booking, ({ one }) => ({
    customer: one(Customer, {
        fields: [Booking.customerId],
        references: [Customer.id],
    }),
    asset: one(Asset, {
            fields: [Booking.assetId],
            references: [Asset.id],
    }),
    tenant: one(Tenant, {
        fields: [Booking.tenantId],
        references: [Tenant.id],
    })
}))