import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, datetime, json, decimal, text, timestamp, int, index, serial } from "drizzle-orm/mysql-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { Asset, Customer, Owner, BookingForm, Payment, Invoice } from ".";



// Booking Model
export const Booking = mysqlTable("booking", {
    id: serial("id").primaryKey(),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    formData: json("form_data"),
    totalPrice: decimal({ precision: 10, scale: 2 }),
    message: text("message"),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
    assetId: int("asset_id").notNull(),
    customerId: varchar("customer_id", { length: 255 }).notNull(),
    ownerId: varchar("owner_id", { length: 255 }),
    bookingFormId: varchar("booking_form_id", { length: 255 }).notNull(),
  }, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    customerIdx: index("customer_idx").on(table.customerId),
    ownerIdx: index("owner_idx").on(table.ownerId),
    bookingFormIdx: index("booking_form_idx").on(table.bookingFormId),
  }));
  
  export const BookingRelations = relations(Booking, ({ one, many }) => ({
    asset: one(Asset, { fields: [Booking.assetId], references: [Asset.id] }),
    customer: one(Customer, { fields: [Booking.customerId], references: [Customer.id] }),
    owner: one(Owner, { fields: [Booking.ownerId], references: [Owner.id] }),
    bookingForm: one(BookingForm, { fields: [Booking.bookingFormId], references: [BookingForm.id] }),
    payments: many(Payment),
    invoices: many(Invoice),
  }));
  
  export const selectBookingSchema = createSelectSchema(Booking);
  export const insertBookingSchema = createInsertSchema(Booking).omit({ id: true, createdAt: true, updatedAt: true });
  