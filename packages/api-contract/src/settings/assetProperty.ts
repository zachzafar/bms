import { z } from "zod";

// Insert Schema
export const insertAssetPropertySchema = z.object({
    name: z.string().max(255),
    propertyType: z.string().max(255),
    tenantId: z.string().max(255).optional(),
});

// Select Schema
export const selectAssetPropertySchema = insertAssetPropertySchema.extend({
    id: z.number(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});

// Patch Schema
export const patchAssetPropertySchema = selectAssetPropertySchema.partial().required({
    id: true,
}).omit({ updatedAt: true });

export type InsertAssetProperty = z.infer<typeof insertAssetPropertySchema>;
export type AssetProperty = z.infer<typeof selectAssetPropertySchema>;
export type PatchAssetProperty = z.infer<typeof patchAssetPropertySchema>;
