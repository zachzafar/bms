import { z } from "zod";

export const InsertRefreshTokenSchema = z.object({
    id: z.number().optional(),
    userId: z.string(),
    refreshToken: z.string(),
    deviceInfo: z.string().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectRefreshTokenSchema = z.object({
    id: z.number(),
    userId: z.string(),
    refreshToken: z.string(),
    deviceInfo: z.string().nullable(),
    ipAddress: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.date().nullable(),
});

export const InsertPasswordResetSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    token: z.string(),
    expiresAt: z.date(),
    createdAt: z.date().optional(),
    usedAt: z.date().nullable().optional(),
});
export const SelectPasswordResetSchema = z.object({
    id: z.string(),
    userId: z.string(),
    token: z.string(),
    expiresAt: z.date(),
    createdAt: z.date(),
    usedAt: z.date().nullable(),
});

export type InsertRefreshToken = z.infer<typeof InsertRefreshTokenSchema>;
export type SelectRefreshToken = z.infer<typeof SelectRefreshTokenSchema>;
export type InsertPasswordReset = z.infer<typeof InsertPasswordResetSchema>;
export type SelectPasswordReset = z.infer<typeof SelectPasswordResetSchema>;