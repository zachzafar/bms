import { mysqlTable, serial, varchar, int,index, datetime, boolean, timestamp, primaryKey, bigint } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { User, Owner } from '../users';
import { v4 as uuid } from "uuid";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';


export const refreshTokens = mysqlTable('refresh_tokens', {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    userId: varchar("user_id", { length: 36 }).references(() => User.id, { onDelete: 'cascade' }).notNull(),
    refreshToken: varchar('hashed_token', {length: 255}).notNull(),
    deviceInfo: varchar('device_info', { length: 255}),
    ipAddress: varchar('ip_address', {length: 45}),
    createdAt: timestamp('createdAt', {mode: 'string'}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', }).$onUpdate(() => new Date()),
});

export const refreshTokenRelations = relations(refreshTokens, ({ one }) => ({
    user: one(User, {
        fields: [refreshTokens.userId],
        references: [User.id],
    }),
}));

export const PasswordReset = mysqlTable('password_reset', {
    id: varchar("id", { length: 36 }).primaryKey().$default(uuid),
    userId: varchar('user_id', { length: 128 }).notNull().references(() => User.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    usedAt: timestamp('used_at'),
  }, (table) => ({
    userIdIdx: index('user_id_idx').on(table.userId),
    tokenIdx: index('token_idx').on(table.token),
  }));

export const OwnerMagicLink = mysqlTable('owner_magic_links', {
  id:        varchar("id", { length: 36 }).primaryKey().$default(uuid),
  ownerId:   bigint('owner_id', { mode: 'number', unsigned: true }).notNull()
               .references(() => Owner.id, { onDelete: 'cascade' }),
  token:     varchar('token', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  usedAt:    timestamp('used_at'),
}, (table) => ({
  ownerIdIdx: index('oml_owner_id_idx').on(table.ownerId),
  tokenIdx:   index('oml_token_idx').on(table.token),
}));

export const InsertOwnerMagicLinkSchema = createInsertSchema(OwnerMagicLink);
export const SelectOwnerMagicLinkSchema = createSelectSchema(OwnerMagicLink);
export type InsertOwnerMagicLink = z.infer<typeof InsertOwnerMagicLinkSchema>;
export type SelectOwnerMagicLink = z.infer<typeof SelectOwnerMagicLinkSchema>;
