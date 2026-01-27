import { mysqlTable, varchar, date, double, decimal, int, serial, bigint, timestamp, index } from 'drizzle-orm/mysql-core';
import { Asset } from '../asset';

export const Rate = mysqlTable("rate", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
  name: varchar("name", { length: 255 }),
  startDate: date("start_date"),         // For seasonal rates
  endDate: date("end_date"),
  minNights: int("min_nights"),          // For stay length tiers
  maxNights: int("max_nights"),
  pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }),
  priority: int("priority").default(100), // Lower = higher priority
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  deletedAtIdx: index("rate_deleted_at_idx").on(table.deletedAt),
}));