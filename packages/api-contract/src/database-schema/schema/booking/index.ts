import { relations} from "drizzle-orm";
import { mysqlTable, varchar, datetime, decimal, text, timestamp, int, index, serial, boolean, bigint, date } from "drizzle-orm/mysql-core";
import { UserHasBookings } from "../users";
import { Asset, AssetHasRates } from "../asset";
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
    totalPrice: decimal({ precision: 10,scale: 2 }),
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


// New Slot table for granular booking
export const Slot = mysqlTable("slots", {
    id: serial("id").primaryKey(),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
    date: date("date").notNull(),
    startTime: varchar("start_time", { length: 8 }).notNull(), // Format: HH:MM:SS
    endTime: varchar("end_time", { length: 8 }).notNull(),     // Format: HH:MM:SS
    status: varchar("status", { length: 20 }).notNull().$default(() => 'available'), // available, booked, unavailable
    bookingId: varchar("booking_id", { length: 36 }).references(() => Booking.id),
    price: decimal("price", { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
}, (table) => ({
    assetIdx: index("slot_asset_idx").on(table.assetId),
    dateIdx: index("slot_date_idx").on(table.date),
    bookingIdx: index("slot_booking_idx").on(table.bookingId),
    // Composite index for checking availability
    availabilityIdx: index("slot_availability_idx").on(table.assetId, table.date, table.status),
}));

export const InsertSlotSchema = createInsertSchema(Slot);
export const SelectSlotSchema = createSelectSchema(Slot);
export const UpdateSlotSchema = InsertSlotSchema.partial();

export type InsertSlot = z.infer<typeof InsertSlotSchema>;
export type SelectSlot = z.infer<typeof SelectSlotSchema>;
export type UpdateSlot = z.infer<typeof UpdateSlotSchema>;


export const SlotRelations = relations(Slot, ({ one }) => ({
    asset: one(Asset, {
        fields: [Slot.assetId],
        references: [Asset.id],
    }),
    booking: one(Booking, {
        fields: [Slot.bookingId],
        references: [Booking.id],
    }),
}));

export const Rate = mysqlTable("rate", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  minNights: int("min_nights"),
  maxNights: int("max_nights"),
  pricePerNight: decimal("price_per_night"),
  priority: int("priority").default(100),
});


export const InsertRateSchema = createInsertSchema(Rate)
  .omit({ startDate: true, endDate: true })
  .extend({
    startDate: z.string(),
    endDate: z.string(),
    assetIds: z.array(z.string()).optional(),
  });
export const SelectRateSchema = createSelectSchema(Rate);
export const UpdateRateSchema = InsertRateSchema.partial();

export type InsertRate = z.infer<typeof InsertRateSchema>;
export type SelectRate = z.infer<typeof SelectRateSchema>;
export type UpdateRate = z.infer<typeof UpdateRateSchema>;

export const RatesRelations = relations(Rate, ({ many }) => ({
  assets: many(AssetHasRates),
}));




