import { relations} from "drizzle-orm";
import { mysqlTable, varchar, datetime, decimal, text, timestamp, int, index, serial, boolean, bigint, date, mysqlEnum, uniqueIndex } from "drizzle-orm/mysql-core";
import { Customer, User } from "../users";
import { Asset, AssetHasRates } from "../asset";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AssetType, BookingFormField } from "../settings";
import { v4 as uuid } from "uuid";
import { Tenant } from "../tenant";



// Booking Model
export const Booking = mysqlTable("booking", {
    id: varchar("id", { length: 36 }).primaryKey().$default(uuid),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => User.id),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
    status: mysqlEnum("status", ["Pending", "Confirmed", "Cancelled"]).notNull().$default(() => "Pending"),
    totalPrice: decimal({ precision: 10,scale: 2 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    userIdx: index("user_idx").on(table.userId),
    deletedAtIdx: index("deleted_at_idx").on(table.deletedAt),
}));

export const InsertBookingSchema = createInsertSchema(Booking).omit({ startDate: true, endDate: true, userId: true }).extend({ startDate: z.coerce.date(), endDate: z.coerce.date() });
export const SelectBookingSchema = createSelectSchema(Booking);

export const UpdateBookingSchema = InsertBookingSchema.partial().required({id:true, startDate: true, endDate: true, status: true, totalPrice: true, assetId: true});

export type InsertBooking = z.infer<typeof InsertBookingSchema>;
export type SelectBooking = z.infer<typeof SelectBookingSchema>;
export type UpdateBooking = z.infer<typeof UpdateBookingSchema>;


export const BookingFormFieldValue = mysqlTable("booking_form_field_value", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    bookingId: varchar("booking_id", { length: 255 }).notNull().references(() => Booking.id, { onDelete: 'cascade' }),
    formFieldId: bigint("form_field_id", { mode: 'number', unsigned: true}).notNull().references(() => BookingFormField.id, { onDelete: 'cascade' }),
    value: text("value").notNull(),
}, (table) => ({
    bookingIdx: index("booking_idx").on(table.bookingId),
    formFieldIdx: index("form_field_idx").on(table.formFieldId),
}));

export const InsertBookingFormFieldValueSchema = createInsertSchema(BookingFormFieldValue);
export const SelectBookingFormFieldValueSchema = createSelectSchema(BookingFormFieldValue);

export type InsertBookingFormFieldValue = z.infer<typeof InsertBookingFormFieldValueSchema>;
export type SelectBookingFormFieldValue = z.infer<typeof SelectBookingFormFieldValueSchema>;

export const BookingFormFieldValueRelations = relations(BookingFormFieldValue, ({ one }) => ({
    booking: one(Booking, {
        fields: [BookingFormFieldValue.bookingId],
        references: [Booking.id],
    }),
    formField: one(BookingFormField, {
        fields: [BookingFormFieldValue.formFieldId],
        references: [BookingFormField.id],
    }),
}));

export const BookingRelations = relations(Booking, ({ one,many }) => ({
    user: one(User, {
        fields: [Booking.userId],
        references: [User.id],
    }),
    asset: one(Asset, {
            fields: [Booking.assetId],
            references: [Asset.id],
    }),
    formFieldValues: many(BookingFormFieldValue),
}))


// New Slot table for granular booking
export const Slot = mysqlTable("slots", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id, { onDelete: 'cascade' }),
    date: date("date").notNull(),
    startTime: datetime("start_time").notNull(), // Format: HH:MM:SS
    endTime: datetime("end_time").notNull(),     // Format: HH:MM:SS
    status: varchar("status", { length: 20 }).notNull().$default(() => 'available'), // available, booked, unavailable
    bookingId: varchar("booking_id", { length: 36 }).references(() => Booking.id, { onDelete: 'set null' }),
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
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  assetTypeId: bigint("rate_id", { mode: "number", unsigned: true }).references(() => AssetType.id, { onDelete: 'cascade' }),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  minNights: int("min_nights"),
  maxNights: int("max_nights"),
  pricePerNight: decimal("price_per_night"),
  priority: int("priority").default(100),
});


export const InsertRateSchema = createInsertSchema(Rate)
  .omit({ startDate: true, endDate: true, minNights:true,maxNights: true })
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    minNights: z.coerce.number(),
    maxNights: z.coerce.number(),
  });
export const SelectRateSchema = createSelectSchema(Rate);
export const UpdateRateSchema = InsertRateSchema.partial();

export type InsertRate = z.infer<typeof InsertRateSchema>;
export type SelectRate = z.infer<typeof SelectRateSchema>;
export type UpdateRate = z.infer<typeof UpdateRateSchema>;

export const RatesRelations = relations(Rate, ({ many }) => ({
  assets: many(AssetHasRates),
}));

// Blocked Dates table
export const BlockedDate = mysqlTable("blocked_date", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(),
  assetId: varchar("asset_id", { length: 255 }).notNull(), // optional if block is asset-specific
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  bookingId: varchar("booking_id", { length: 36 }).references(() => Booking.id), // If this block is for a booking
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => ({
  tenantIdx: index("blocked_tenant_idx").on(table.tenantId),
  assetIdx: index("blocked_asset_idx").on(table.assetId),
  dateIdx: index("blocked_date_idx").on(table.startDate, table.endDate),
  bookingIdx: index("blocked_booking_idx").on(table.bookingId),
}));

// Zod schemas for insert/select/update
export const InsertBlockedDateSchema = createInsertSchema(BlockedDate)
  .omit({ startDate: true, endDate: true })
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().optional(),
    title: z.string(),
    assetId: z.string(),
    tenantId: z.string(),
    bookingId: z.string().optional(),
  });

export const SelectBlockedDateSchema = createSelectSchema(BlockedDate);
export const UpdateBlockedDateSchema = InsertBlockedDateSchema.partial();

export type InsertBlockedDate = z.infer<typeof InsertBlockedDateSchema>;
export type SelectBlockedDate = z.infer<typeof SelectBlockedDateSchema>;
export type UpdateBlockedDate = z.infer<typeof UpdateBlockedDateSchema>;

// Optional: relations
export const BlockedDateRelations = relations(BlockedDate, ({ one }) => ({
  asset: one(Asset, {
    fields: [BlockedDate.assetId],
    references: [Asset.id],
  }),
  booking: one(Booking, {
    fields: [BlockedDate.bookingId],
    references: [Booking.id],
  }),
}));

export const BookingUpdateToken = mysqlTable('booking_upate_token',{
    id: varchar("id", { length: 36 }).primaryKey().$default(uuid),
    customerId: bigint("customer_id", { mode: "number", unsigned: true }).references(() => Customer.id, { onDelete: 'cascade' }),
    bookingId: varchar("booking_id", { length: 36 }).references(() => Booking.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    usedAt: timestamp('used_at'),
  }, (table) => ({
    customerIdIdx: index('customer_id_idx').on(table.customerId),
    tokenIdx: index('token_idx').on(table.token),
  }))

  export const BookingUpdateTokenRelations = relations(BookingUpdateToken, ({ one }) => ({
    booking: one(Booking, {
      fields: [BookingUpdateToken.bookingId],
      references: [Booking.id]
    }),
    customerId: one(Customer,{
      fields: [BookingUpdateToken.customerId],
      references: [Customer.id]
    })
  }))

