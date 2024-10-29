import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, datetime, int, timestamp, index, decimal } from "drizzle-orm/mysql-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Asset,  File, User } from ".";


export const MaintenanceStatus = {
    Scheduled: 'Scheduled',
    InProgress: 'InProgress',
    Completed: 'Completed',
  } as const;
  
  export const Priority = {
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
  } as const;
  
// MaintenanceTask Model
export const MaintenanceTask = mysqlTable("maintenance_task", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    priority: varchar("priority", { length: 255 }),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date"),
    cost: decimal({ precision: 10, scale: 2 }),
    assetId: int("asset_id").notNull(),
    assignedToId: varchar("assigned_to_id", { length: 255 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  }, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
    assignedToIdx: index("assigned_to_idx").on(table.assignedToId),
  }));
  
  export const MaintenanceTaskRelations = relations(MaintenanceTask, ({ one, many }) => ({
    asset: one(Asset, { fields: [MaintenanceTask.assetId], references: [Asset.id] }),
    assignedTo: one(User, { fields: [MaintenanceTask.assignedToId], references: [User.id] }),
    files: many(File),
  }));
  
  export const selectMaintenanceTaskSchema = createSelectSchema(MaintenanceTask);
  export const insertMaintenanceTaskSchema = createInsertSchema(MaintenanceTask, {
    status: z.enum([MaintenanceStatus.Scheduled, MaintenanceStatus.InProgress, MaintenanceStatus.Completed]),
    priority: z.enum([Priority.Low, Priority.Medium, Priority.High]),
  }).omit({ id: true, createdAt: true, updatedAt: true });
  