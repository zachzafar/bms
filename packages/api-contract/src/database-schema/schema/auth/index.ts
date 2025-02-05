import { mysqlTable, serial, varchar, int, datetime, boolean, timestamp, primaryKey } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { User } from '../users'; 
import { Tenant } from '../tenant';

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
