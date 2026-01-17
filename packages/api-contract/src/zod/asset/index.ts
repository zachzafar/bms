import { z } from "zod";

export const SelectAssetSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    requiresApproval: z.boolean(),
    assetTypeId: z.coerce.number().optional(),
    userId: z.string().nullable(),
    tenantId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});

export const InsertAssetSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    requiresApproval: z.boolean().optional(),
    assetTypeId: z.coerce.number().optional(),
    userId: z.string().nullable().optional(),
    tenantId: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const UpdateAssetSchema = InsertAssetSchema.partial();

export type SelectAsset = z.infer<typeof SelectAssetSchema>;
export type InsertAsset = z.infer<typeof InsertAssetSchema>;
export type UpdateAsset = z.infer<typeof UpdateAssetSchema>;

export const SelectAssetImagesSchema = z.object({
    id: z.number(),
    assetId: z.string(),
    filePath: z.string(),
    imageType: z.enum(["primary", "secondary", "gallery"]),
});
export type SelectAssetImages = z.infer<typeof SelectAssetImagesSchema>;

export const SelectAssetHasPropertiesSchema = z.object({
    id: z.number(),
    assetId: z.string(),
    assetPropertyId: z.number(),
    value: z.string(),
});

export type SelectAssetHasProperties = z.infer<typeof SelectAssetHasPropertiesSchema>;





