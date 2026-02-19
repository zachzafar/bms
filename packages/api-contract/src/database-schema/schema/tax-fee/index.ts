import { relations } from "drizzle-orm";
import { mysqlTable, varchar, text, decimal, bigint, boolean, timestamp, index, mysqlEnum, int } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { Tenant } from "../tenant";
import { Booking } from "../booking";

// TaxFee Model - catalog of taxes and fees per tenant
export const TaxFee = mysqlTable("tax_fee", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["tax", "fee"]).notNull(),
  calculationType: mysqlEnum("calculation_type", ["percentage", "fixed_per_unit", "fixed_flat"]).notNull(),
  rate: decimal("rate", { precision: 10, scale: 4 }).notNull(),
  calculationBasis: mysqlEnum("calculation_basis", ["net", "gross"]).notNull(),
  maxUnits: int("max_units"),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => ({
  tenantIdx: index("tax_fee_tenant_idx").on(table.tenantId),
}));

export const InsertTaxFeeSchema = createInsertSchema(TaxFee).omit({ tenantId: true });
export const SelectTaxFeeSchema = createSelectSchema(TaxFee);
export const UpdateTaxFeeSchema = InsertTaxFeeSchema.partial();

export type InsertTaxFee = z.infer<typeof InsertTaxFeeSchema>;
export type SelectTaxFee = z.infer<typeof SelectTaxFeeSchema>;
export type UpdateTaxFee = z.infer<typeof UpdateTaxFeeSchema>;

// BookingTaxFee Model - snapshot of applied taxes/fees per booking
export const BookingTaxFee = mysqlTable("booking_tax_fee", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  bookingId: varchar("booking_id", { length: 36 }).notNull().references(() => Booking.id, { onDelete: 'cascade' }),
  taxFeeId: bigint("tax_fee_id", { mode: "number", unsigned: true }).notNull().references(() => TaxFee.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["tax", "fee"]).notNull(),
  calculationType: mysqlEnum("calculation_type", ["percentage", "fixed_per_unit", "fixed_flat"]).notNull(),
  rate: decimal("rate", { precision: 10, scale: 4 }).notNull(),
  calculationBasis: mysqlEnum("calculation_basis", ["net", "gross"]).notNull(),
  calculatedAmount: decimal("calculated_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  bookingIdx: index("booking_tax_fee_booking_idx").on(table.bookingId),
  taxFeeIdx: index("booking_tax_fee_tax_fee_idx").on(table.taxFeeId),
}));

export const InsertBookingTaxFeeSchema = createInsertSchema(BookingTaxFee);
export const SelectBookingTaxFeeSchema = createSelectSchema(BookingTaxFee);

export type InsertBookingTaxFee = z.infer<typeof InsertBookingTaxFeeSchema>;
export type SelectBookingTaxFee = z.infer<typeof SelectBookingTaxFeeSchema>;

// Relations
export const TaxFeeRelations = relations(TaxFee, ({ one, many }) => ({
  tenant: one(Tenant, {
    fields: [TaxFee.tenantId],
    references: [Tenant.id],
  }),
  bookingTaxFees: many(BookingTaxFee),
}));

export const BookingTaxFeeRelations = relations(BookingTaxFee, ({ one }) => ({
  booking: one(Booking, {
    fields: [BookingTaxFee.bookingId],
    references: [Booking.id],
  }),
  taxFee: one(TaxFee, {
    fields: [BookingTaxFee.taxFeeId],
    references: [TaxFee.id],
  }),
}));
