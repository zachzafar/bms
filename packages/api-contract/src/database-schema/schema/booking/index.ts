import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, datetime, json, decimal, text, timestamp, int, index, serial } from "drizzle-orm/mysql-core";
import { Customer, User } from "../users";
import { Asset } from "../asset";
import { Tenant } from "../tenant";
import { create } from "domain";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";



// Booking Model
export const Booking = mysqlTable("booking", {
    id: serial("id").primaryKey(),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    totalPrice: decimal({ precision: 1 }),
    message: text("message"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    assetId: int("asset_id").notNull(),
    customerId: varchar("customer_id", { length: 255 }).notNull(),
    
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    customerIdx: index("customer_idx").on(table.customerId),
}));

export const InsertBookingSchema = createInsertSchema(Booking);
export const SelectBookingSchema = createSelectSchema(Booking);

export const UpdateBookingSchema = InsertBookingSchema.partial().required({ id: true, tenantId: true, startDate: true, endDate: true, status: true, totalPrice: true, assetId: true, customerId: true });

export type InsertBooking = z.infer<typeof InsertBookingSchema>;
export type SelectBooking = z.infer<typeof SelectBookingSchema>;
export type UpdateBooking = z.infer<typeof UpdateBookingSchema>;


export const BookingFormFieldValue = mysqlTable("booking_form_field_value", {
    id: serial("id").primaryKey(),
    bookingId: int("booking_id").notNull(),
    formFieldId: int("form_field_id").notNull(),
    value: text("value").notNull(),
}, (table) => ({
    bookingIdx: index("booking_idx").on(table.bookingId),
    formFieldIdx: index("form_field_idx").on(table.formFieldId),
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