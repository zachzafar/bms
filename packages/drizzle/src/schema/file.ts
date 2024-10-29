import { sql } from "drizzle-orm";
import { mysqlTable, varchar, int, timestamp, index, serial } from "drizzle-orm/mysql-core";


// File Model
export const File = mysqlTable("file", {
    id: serial("id").primaryKey(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 255 }).notNull(),
    fileSize: int("file_size").notNull(),
    uploadedAt: timestamp('createdAt').notNull().defaultNow(),
    assetId: int("asset_id"),
    maintenanceTaskId: int("maintenance_task_id"),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    maintenanceTaskIdx: index("maintenance_task_idx").on(table.maintenanceTaskId),
}));

