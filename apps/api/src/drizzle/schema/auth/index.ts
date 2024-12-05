import { mysqlTable, serial, varchar, int, datetime, boolean, timestamp } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { User } from '../users'; 
import { Tenant } from '../tenant';

export const refreshTokens = mysqlTable('refresh_tokens', {
    id: serial('id').primaryKey(), 
    userId: varchar("id", { length: 36 }).primaryKey(), 
    refreshToken: varchar('hashed_token', {length: 255}).notNull(), 
    deviceInfo: varchar('device_info', { length: 255}), 
    ipAddress: varchar('ip_address', {length: 45}),
    revoked: boolean('revoked').default(false), 
    tenantId: varchar('tenant_id', {length: 36}),   
    createdAt: timestamp('createdAt', {mode: 'string'}).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', {mode: 'string'}).notNull().onUpdateNow()
});

export const refreshTokenRelations = relations(refreshTokens, ({ one }) => ({
    user: one(User, {
        fields: [refreshTokens.userId],
        references: [User.id],
    }),
    tenant: one(Tenant,{
        fields: [refreshTokens.tenantId],
        references: [Tenant.id],
    })
}));
