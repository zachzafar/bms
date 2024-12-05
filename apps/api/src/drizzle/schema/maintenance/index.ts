import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, text, datetime, int, timestamp, index } from "drizzle-orm/mysql-core";
import { Asset } from "../asset";
import { Tenant } from "../tenant";




// MaintenanceTask Model
export const MaintenanceTask = mysqlTable("maintenance_task", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    priority: varchar("priority", { length: 255 }),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date"),
    tenantId: varchar("tenant_id", { length: 255 }),
    assetId: int("asset_id").notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
}, (table) => ({
    assetIdx: index("asset_idx").on(table.assetId),
}));

export const MaintenanceTaskRelations = relations(MaintenanceTask, ({ one }) => ({
    asset: one(Asset, {
        fields: [MaintenanceTask.assetId],
        references: [Asset.id],
    }),
    tenant: one(Tenant, {
        fields: [MaintenanceTask.tenantId],
        references: [Tenant.id],
    })
}))