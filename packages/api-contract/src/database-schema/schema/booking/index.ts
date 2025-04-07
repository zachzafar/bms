import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, datetime, json, decimal, text, timestamp, int, index, serial, boolean, bigint, date } from "drizzle-orm/mysql-core";
import { Customer, User, UserHasBookings } from "../users";
import { Asset } from "../asset";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { BookingFormField } from "../settings";
import { v4 as uuid } from "uuid";



// Booking Model
export const Booking = mysqlTable("booking", {
    id: varchar("id", { length: 36 }).primaryKey().$default(uuid),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
    status: varchar("status", { length: 255 }),
    totalPrice: decimal({ precision: 1 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
}));

export const InsertBookingSchema = createInsertSchema(Booking).omit({ startDate: true, endDate: true }).extend({ startDate: z.string(), endDate: z.string() });
export const SelectBookingSchema = createSelectSchema(Booking);

export const UpdateBookingSchema = InsertBookingSchema.partial().required({id:true, startDate: true, endDate: true, status: true, totalPrice: true, assetId: true});

export type InsertBooking = z.infer<typeof InsertBookingSchema>;
export type SelectBooking = z.infer<typeof SelectBookingSchema>;
export type UpdateBooking = z.infer<typeof UpdateBookingSchema>;


export const BookingFormFieldValue = mysqlTable("booking_form_field_value", {
    id: serial("id").primaryKey(),
    bookingId: varchar("tenant_id", { length: 255 }).notNull().references(() => Booking.id),
    formFieldId: bigint("form_field_id", { mode: 'bigint', unsigned: true}).notNull().references(() => BookingFormField.id),
    value: text("value").notNull(),
}, (table) => ({
    bookingIdx: index("booking_idx").on(table.bookingId),
    formFieldIdx: index("form_field_idx").on(table.formFieldId),
}));

export const BookingRelations = relations(Booking, ({ one,many }) => ({
    user: many(UserHasBookings),
    asset: one(Asset, {
            fields: [Booking.assetId],
            references: [Asset.id],
    }),
}))

export const Availability = mysqlTable("availabilities", {
    id: serial("id").primaryKey(),
    assetId: varchar("tenant_id", { length: 255 }).notNull().references(() => Asset.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }),
    available: boolean("available").notNull(),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
}));

export const InsertAvailabilitySchema = createInsertSchema(Availability).omit({ startDate: true, endDate: true}).extend({ startDate: z.string(), endDate: z.string() })
export const SelectAvailabilitySchema = createSelectSchema(Availability)
export const UpdateAvailabilitySchema = InsertAvailabilitySchema.partial()

export type InsertAvailability = z.infer<typeof InsertAvailabilitySchema>
export type SelectAvailability = z.infer<typeof SelectAvailabilitySchema>
export type UpdateAvailability = z.infer<typeof UpdateAvailabilitySchema>

export const AvailabilityRelations = relations(Availability, ({ one }) => ({
    asset: one(Asset, {
        fields: [Availability.assetId],
        references: [Asset.id],
    })
}))


