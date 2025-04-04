import { mysqlTable, varchar, json, timestamp, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { Tenant } from "../tenant";
import { relations } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const APIKeys = mysqlTable("api_keys", {
  id: varchar("id", { length: 36 }).primaryKey().$default(() => uuid()),
  key: varchar("key", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  scopes: json("scopes").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().references(() => Tenant.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const InsertKeySchema = createInsertSchema(APIKeys)
export const SelectKeySchema = createSelectSchema(APIKeys)

export type InsertKey = z.infer<typeof InsertKeySchema>
export type SelectKey = z.infer<typeof SelectKeySchema>

export const apiKeysRelations = relations(APIKeys, ({ one }) => ({
  tenant: one(Tenant, {
    fields: [APIKeys.tenantId],
    references: [Tenant.id],
  }),
}));