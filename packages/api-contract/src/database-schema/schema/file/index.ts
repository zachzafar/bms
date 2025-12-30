import { relations } from "drizzle-orm";
import { mysqlTable, varchar, int, timestamp, index, serial, bigint } from "drizzle-orm/mysql-core";
import { MaintenanceTask } from "../maintenance";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";


// File Model
export const File = mysqlTable("files", {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    fileUrl: varchar("file_url", { length: 255 }).notNull(),
    uploadedAt: timestamp('createdAt').notNull().defaultNow(),
    maintenanceTaskId: varchar("maintenance_id", { length: 255 }).notNull().references(() => MaintenanceTask.id),
}, (table) => ({
    maintenanceTaskIdx: index("maintenance_task_idx").on(table.maintenanceTaskId),
}));

export const SelectFileSchema = createSelectSchema(File)
export type SelectFile = z.infer<typeof SelectFileSchema>
export const FileRelations = relations(File, ({ one }) => ({
    maintenanceTask: one(MaintenanceTask, {
        fields: [File.maintenanceTaskId],
        references: [MaintenanceTask.id],
    }),
}))

