import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { assetProperty } from "@repo/drizzle/src/schema"

/// Asset Properties
export const selectAssetPropertySchema = createSelectSchema(assetProperty);

export const insertAssetPropertySchema = createInsertSchema(assetProperty, {

}).omit({ id: true, createdAt: true, updatedAt: true })

export const patchAssetPropertySchema = insertAssetPropertySchema.partial()
