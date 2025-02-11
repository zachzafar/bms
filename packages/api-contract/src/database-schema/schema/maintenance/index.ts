import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, datetime, int, timestamp, index, bigint } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { Tenant } from "../tenant";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuid } from "uuid";

// MaintenanceTask Model
export const MaintenanceTask = mysqlTable("maintenance_tasks", {
    id: varchar("id", { length: 36 }).primaryKey().$default(() => uuid()),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    priority: varchar("priority", { length: 255 }),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date"),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
}));

export const InsertMaintenanceTaskSchema = createInsertSchema(MaintenanceTask);
export const SelectMaintenanceTaskSchema = createInsertSchema(MaintenanceTask);
export const UpdateMaintenanceTaskSchema = InsertMaintenanceTaskSchema.partial().required({ id: true, title: true, description: true, status: true, priority: true, startDate: true, assetId: true });

export type InsertMaintenanceTask = z.infer<typeof InsertMaintenanceTaskSchema>;
export type SelectMaintenanceTask = z.infer<typeof SelectMaintenanceTaskSchema>;
export type UpdateMaintenanceTask = z.infer<typeof UpdateMaintenanceTaskSchema>;

export const MaintenanceTaskRelations = relations(MaintenanceTask, ({ one }) => ({
    asset: one(Asset, {
        fields: [MaintenanceTask.assetId],
        references: [Asset.id],
    }),
}))