// import { z } from "zod";

// // Insert Schema
// export const insertAssetTypeSchema = z.object({
//     name: z.string().max(255),
//     description: z.string().nullable(),
//     bookingFormId: z.string().max(255).optional(),
//     tenantId: z.string().max(255),
//     schema: z.array(z.object({
//         propertyId: z.number(),
//         isRequired: z.boolean(),
//     }))
// });

// // Select Schema
// export const selectAssetTypeSchema = insertAssetTypeSchema.extend({
//     id: z.number(),
//     createdAt: z.date(),
//     updatedAt: z.date().nullable(),
// });

// // Patch Schema
// export const patchAssetTypeSchema = selectAssetTypeSchema.partial().required({
//     id: true,
// }).extend({
//     schema: z.array(z.object({
//         propertyId: z.number(),
//         isRequired: z.boolean(),
//     })),
// }).omit({ createdAt: true, updatedAt: true });

// // Schema for AssetType with Properties
// export const assetTypeWithPropertiesSchema = selectAssetTypeSchema.extend({
//     schema: z.array(z.object({
//         propertyId: z.number(),
//         isRequired: z.boolean(),
//     })),
// });

// export type AssetTypeWithProperties = z.infer<typeof assetTypeWithPropertiesSchema>;
// export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>;
// export type AssetType = z.infer<typeof selectAssetTypeSchema>;
// export type PatchAssetType = z.infer<typeof patchAssetTypeSchema>;
