import { relations, sql } from "drizzle-orm";
import { mysqlTable, varchar, int, timestamp, index, serial } from "drizzle-orm/mysql-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { Asset, MaintenanceTask } from ".";


// File Model
export const File = mysqlTable("file", {
    id: serial("id").primaryKey(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 255 }).notNull(),
    fileSize: int("file_size").notNull(),
    uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
    assetId: int("asset_id"),
    maintenanceTaskId: int("maintenance_task_id"),
  }, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    maintenanceTaskIdx: index("maintenance_task_idx").on(table.maintenanceTaskId),
  }));
  
  export const FileRelations = relations(File, ({ one }) => ({
    asset: one(Asset, { fields: [File.assetId], references: [Asset.id] }),
    maintenanceTask: one(MaintenanceTask, { fields: [File.maintenanceTaskId], references: [MaintenanceTask.id] }),
  }));
  
  export const selectFileSchema = createSelectSchema(File);
  export const insertFileSchema = createInsertSchema(File).omit({ id: true, uploadedAt: true });
  