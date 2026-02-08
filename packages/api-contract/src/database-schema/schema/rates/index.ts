import { relations } from "drizzle-orm";
import { mysqlTable, varchar, text, int, bigint, decimal, date, boolean, timestamp } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AssetType } from "../settings";
import { Tenant } from "../tenant";

// Rate Model
export const Rate = mysqlTable("rate", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  assetTypeId: bigint("asset_type_id", { mode: "number", unsigned: true }).references(() => AssetType.id, { onDelete: 'cascade' }),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  minNights: int("min_nights"),
  maxNights: int("max_nights"),
  pricePerNight: decimal("price_per_night"),
  priority: int("priority").default(100),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const InsertRateSchema = createInsertSchema(Rate)
  .omit({ startDate: true, endDate: true, minNights: true, maxNights: true, tenantId: true })
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

// RatesRelations - Import AssetHasRates lazily to avoid circular dependency
// AssetHasRates is defined in asset schema and references Rate
import { AssetHasRates } from "../asset";

export const RatesRelations = relations(Rate, ({ many }) => ({
  assets: many(AssetHasRates),
}));
