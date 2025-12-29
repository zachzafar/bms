import { z } from "zod";

export const InsertTenantSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    subdomain: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().nullable().optional(),
});
export const SelectTenantSchema = z.object({
    id: z.string(),
    name: z.string(),
    subdomain: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
});

export type InsertTenant = z.infer<typeof InsertTenantSchema>
export type SelectTenant = z.infer<typeof SelectTenantSchema>

export const InsertTenantTeamSchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    name: z.string(),
});
export const SelectTenantTeamSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    name: z.string(),
});

export type InsertTenanTeam = z.infer<typeof InsertTenantTeamSchema>
export type SelectTenantTeam = z.infer<typeof SelectTenantTeamSchema>

export const InsertTenantTeamHasUsersSchema = z.object({
    id: z.number().optional(),
    teamId: z.number(),
    userId: z.string(),
});
export const SelectTenantTeamHasUsersSchema = z.object({
    id: z.number(),
    teamId: z.number(),
    userId: z.string(),
});

export type InsertTenantTeamHasUsers = z.infer<typeof InsertTenantTeamHasUsersSchema>
export type SelectTenantTeamHasUsers = z.infer<typeof SelectTenantTeamHasUsersSchema>

export const InsertTenantTeamHasAssetsSchema = z.object({
    id: z.number().optional(),
    teamId: z.number(),
    assetId: z.string(),
});
export const SelectTenantTeamHasAssetsSchema = z.object({
    id: z.number(),
    teamId: z.number(),
    assetId: z.string(),
});

export type InsertTenantTeamHasAssets = z.infer<typeof InsertTenantTeamHasAssetsSchema>
export type SelectTenantTeamHasAssets = z.infer<typeof SelectTenantTeamHasAssetsSchema>

export const InsertTenantHasUsersSchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    userId: z.string(),
    isAdmin: z.boolean().optional(),
});
export const SelectTenantHasUsersSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    userId: z.string(),
    isAdmin: z.boolean().nullable(),
});

export type InsertTenantHasUsers = z.infer<typeof InsertTenantHasUsersSchema>
export type SelectTenantHasUsers = z.infer<typeof SelectTenantHasUsersSchema>
