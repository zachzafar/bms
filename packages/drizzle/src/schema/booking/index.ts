import { sql } from "drizzle-orm";
import { mysqlTable, varchar, datetime, json, decimal, text, timestamp, int, index, serial } from "drizzle-orm/mysql-core";



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

