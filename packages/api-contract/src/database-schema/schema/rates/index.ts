import { relations } from "drizzle-orm";
import { mysqlTable, varchar, text, int, bigint, decimal, date, boolean, timestamp } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AssetType } from "../settings";
import { Tenant } from "../tenant";

// RateType Model - defines billing intervals (e.g. hourly=60, daily=1440, half-hour=30)
export const RateType = mysqlTable("rate_type", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  minutes: int("minutes").notNull(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const InsertRateTypeSchema = createInsertSchema(RateType).omit({ tenantId: true });
export const SelectRateTypeSchema = createSelectSchema(RateType);
export const UpdateRateTypeSchema = InsertRateTypeSchema.partial();

export type InsertRateType = z.infer<typeof InsertRateTypeSchema>;
export type SelectRateType = z.infer<typeof SelectRateTypeSchema>;
export type UpdateRateType = z.infer<typeof UpdateRateTypeSchema>;

// Rate Model
export const Rate = mysqlTable("rate", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  assetTypeId: bigint("asset_type_id", { mode: "number", unsigned: true }).references(() => AssetType.id, { onDelete: 'cascade' }),
  rateTypeId: bigint("rate_type_id", { mode: "number", unsigned: true }).references(() => RateType.id, { onDelete: 'set null' }),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  minDuration: int("min_duration"),
  maxDuration: int("max_duration"),
  pricePerUnit: decimal("price_per_unit"),
  priority: int("priority").default(100),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const InsertRateSchema = createInsertSchema(Rate)
  .omit({ startDate: true, endDate: true, minDuration: true, maxDuration: true, tenantId: true })
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    minDuration: z.coerce.number(),
    maxDuration: z.coerce.number(),
    rateTypeId: z.coerce.number().optional(),
  });
export const SelectRateSchema = createSelectSchema(Rate);
export const UpdateRateSchema = InsertRateSchema.partial();

export type InsertRate = z.infer<typeof InsertRateSchema>;
export type SelectRate = z.infer<typeof SelectRateSchema>;
export type UpdateRate = z.infer<typeof UpdateRateSchema>;

// RatesRelations - Import AssetHasRates lazily to avoid circular dependency
// AssetHasRates is defined in asset schema and references Rate
import { AssetHasRates } from "../asset";

export const RateTypeRelations = relations(RateType, ({ one, many }) => ({
  tenant: one(Tenant, {
    fields: [RateType.tenantId],
    references: [Tenant.id],
  }),
  rates: many(Rate),
}));

export const RatesRelations = relations(Rate, ({ one, many }) => ({
  assets: many(AssetHasRates),
  rateType: one(RateType, {
    fields: [Rate.rateTypeId],
    references: [RateType.id],
  }),
}));
