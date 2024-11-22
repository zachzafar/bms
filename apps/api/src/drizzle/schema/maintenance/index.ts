import { mysqlTable, serial, varchar, text, datetime, int, timestamp, index } from "drizzle-orm/mysql-core";




// MaintenanceTask Model
export const MaintenanceTask = mysqlTable("maintenance_task", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    priority: varchar("priority", { length: 255 }),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date"),
    assetId: int("asset_id").notNull(),
    assignedToId: varchar("assigned_to_id", { length: 255 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    assignedToIdx: index("assigned_to_idx").on(table.assignedToId),
}));
