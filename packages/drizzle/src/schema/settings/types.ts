import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { assetProperty, AssetType } from ".";
import { z } from "zod";


/// Asset Properties
export const selectAssetPropertySchema = createSelectSchema(assetProperty);
export const insertAssetPropertySchema = createInsertSchema(assetProperty, {}).omit({ id: true, createdAt: true, updatedAt: true })
export const patchAssetPropertySchema = selectAssetPropertySchema.partial().required({ id: true }).omit({ updatedAt: true})

export type InsertAssetProperty = z.infer<typeof insertAssetPropertySchema>
export type AssetProperty = z.infer<typeof selectAssetPropertySchema>
export type PatchAssetProperty = z.infer<typeof patchAssetPropertySchema>


/// Asset Types

export const selectAssetTypeSchema = createSelectSchema(AssetType);
export const insertAssetTypeSchema = createInsertSchema(AssetType, {}).omit({ id: true, createdAt: true, updatedAt: true }).extend({
    schema: z.array(z.object({
        propertyId: z.number(),
        isRequired: z.boolean()
    }))
})
export const patchAssetTypeSchema = selectAssetTypeSchema.partial().required({ id:true}).extend({
    schema: z.array(z.object({
        propertyId: z.number(),
        isRequired: z.boolean()
    }))
}).omit({ createdAt: true, updatedAt: true})
export const assetTypeWithPropertiesSchema = selectAssetTypeSchema.extend({
    schema: z.array(z.object({
      propertyId: z.number(),
      isRequired: z.boolean()
    }))
  });


export type AssetTypeWithProperties = z.infer<typeof assetTypeWithPropertiesSchema>
export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>
export type AssetType = z.infer<typeof selectAssetTypeSchema>
export type PatchAssetType = z.infer<typeof patchAssetTypeSchema>

  