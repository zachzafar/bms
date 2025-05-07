import { mysqlTable, serial, varchar, int,index, datetime, boolean, timestamp, primaryKey } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { User } from '../users'; 
import { Tenant } from '../tenant';
import { v4 as uuid } from "uuid";

export const refreshTokens = mysqlTable('refresh_tokens', {
    id: serial('id').primaryKey(), 
    userId: varchar("user_id", { length: 36 }).references(() => User.id).notNull(), 
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
    userId: varchar('user_id', { length: 128 }).notNull().references(() => User.id),
    token: varchar('token', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    usedAt: timestamp('used_at'),
  }, (table) => ({
    userIdIdx: index('user_id_idx').on(table.userId),
    tokenIdx: index('token_idx').on(table.token),
  }));