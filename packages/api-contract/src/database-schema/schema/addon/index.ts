import { relations } from "drizzle-orm";
import { mysqlTable, varchar, text, decimal, bigint, boolean, timestamp, index, mysqlEnum, int } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { Tenant } from "../tenant";
import { Booking } from "../booking";

// AddonItem Model - catalog of add-on items per tenant
export const AddonItem = mysqlTable("addon_item", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingType: mysqlEnum("billing_type", ["per_unit", "flat"]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => ({
  tenantIdx: index("addon_tenant_idx").on(table.tenantId),
}));

export const InsertAddonItemSchema = createInsertSchema(AddonItem).omit({ tenantId: true });
export const SelectAddonItemSchema = createSelectSchema(AddonItem);
export const UpdateAddonItemSchema = InsertAddonItemSchema.partial();

export type InsertAddonItem = z.infer<typeof InsertAddonItemSchema>;
export type SelectAddonItem = z.infer<typeof SelectAddonItemSchema>;
export type UpdateAddonItem = z.infer<typeof UpdateAddonItemSchema>;

// BookingAddon Model - junction table, snapshots price at booking time
export const BookingAddon = mysqlTable("booking_addon", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  bookingId: varchar("booking_id", { length: 36 }).notNull().references(() => Booking.id, { onDelete: 'cascade' }),
  addonItemId: bigint("addon_item_id", { mode: "number", unsigned: true }).notNull().references(() => AddonItem.id, { onDelete: 'cascade' }),
  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  billingType: mysqlEnum("billing_type", ["per_unit", "flat"]).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  bookingIdx: index("booking_addon_booking_idx").on(table.bookingId),
  addonIdx: index("booking_addon_addon_idx").on(table.addonItemId),
}));

export const InsertBookingAddonSchema = createInsertSchema(BookingAddon);
export const SelectBookingAddonSchema = createSelectSchema(BookingAddon);

export type InsertBookingAddon = z.infer<typeof InsertBookingAddonSchema>;
export type SelectBookingAddon = z.infer<typeof SelectBookingAddonSchema>;

// Relations
export const AddonItemRelations = relations(AddonItem, ({ one, many }) => ({
  tenant: one(Tenant, {
    fields: [AddonItem.tenantId],
    references: [Tenant.id],
  }),
  bookingAddons: many(BookingAddon),
}));

export const BookingAddonRelations = relations(BookingAddon, ({ one }) => ({
  booking: one(Booking, {
    fields: [BookingAddon.bookingId],
    references: [Booking.id],
  }),
  addonItem: one(AddonItem, {
    fields: [BookingAddon.addonItemId],
    references: [AddonItem.id],
  }),
}));
