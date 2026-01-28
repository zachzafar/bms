import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, datetime, int, timestamp, index, bigint, mysqlEnum, float } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { Tenant } from "../tenant";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuid } from "uuid";

// MaintenanceTask Model
export const MaintenanceTask = mysqlTable("maintenance_tasks", {
    id: varchar("id", { length: 36 }).primaryKey().$default(() => uuid()),
    title: varchar("title", { length: 255 }).notNull(),
    cost: float("cost").notNull(),
    description: text("description").notNull(),
    status: mysqlEnum(["COMPLETE","IN_PROGRESS","AWAITING"]).notNull(),
    assetId: varchar("asset_id", { length: 255 }).notNull().references(() => Asset.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    deletedAtIdx: index("maintenance_deleted_at_idx").on(table.deletedAt),
}));

export const InsertMaintenanceTaskSchema = createInsertSchema(MaintenanceTask);
export const SelectMaintenanceTaskSchema = createSelectSchema(MaintenanceTask);
export const UpdateMaintenanceTaskSchema = InsertMaintenanceTaskSchema.partial().omit({ id: true, assetId: true})

export type InsertMaintenanceTask = z.infer<typeof InsertMaintenanceTaskSchema>;
export type SelectMaintenanceTask = z.infer<typeof SelectMaintenanceTaskSchema>;
export type UpdateMaintenanceTask = z.infer<typeof UpdateMaintenanceTaskSchema>;

export const MaintenanceTaskRelations = relations(MaintenanceTask, ({ one }) => ({
    asset: one(Asset, {
        fields: [MaintenanceTask.assetId],
        references: [Asset.id],
    }),
}))