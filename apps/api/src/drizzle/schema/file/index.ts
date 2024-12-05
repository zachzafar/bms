import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, int, timestamp, index, serial } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { MaintenanceTask } from "../maintenance";
import { Tenant } from "../tenant";


// File Model
export const File = mysqlTable("file", {
    id: serial("id").primaryKey(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 255 }).notNull(),
    fileSize: int("file_size").notNull(),
    uploadedAt: timestamp('createdAt').notNull().defaultNow(),
    assetId: int("asset_id"),
    tenantId: varchar("tenant_id", { length: 255 }),
    maintenanceTaskId: int("maintenance_task_id"),
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
    tenant: one(Tenant, {
        fields: [File.tenantId],
        references: [Tenant.id],
    }) 
}))

