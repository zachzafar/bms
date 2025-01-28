import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, int, timestamp, index, serial, bigint } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { MaintenanceTask } from "../maintenance";
import { Tenant } from "../tenant";


// File Model
export const File = mysqlTable("files", {
    id: serial("id").primaryKey(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 255 }).notNull(),
    fileSize: int("file_size").notNull(),
    uploadedAt: timestamp('createdAt').notNull().defaultNow(),
    assetId: bigint("asset_id",{mode: 'bigint', unsigned: true}).references(() => Asset.id),
    maintenanceTaskId: bigint("maintenance_task_id", { mode: 'bigint', unsigned: true}).references(() => MaintenanceTask.id),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    maintenanceTaskIdx: index("maintenance_task_idx").on(table.maintenanceTaskId),
}));

export const FileRelations = relations(File, ({ one }) => ({
    asset: one(Asset, {
        fields: [File.assetId],
        references: [Asset.id],
    }),
    maintenanceTask: one(MaintenanceTask, {
        fields: [File.maintenanceTaskId],
        references: [MaintenanceTask.id],
    }),
}))

