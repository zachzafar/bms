import { z } from "zod";

// Define InsertTag schema, tenantId is optional, backend will fill it
export const InsertTagSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Tag name is required"),
  description: z.string().optional(),
  tenantId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().nullable().optional(),
});
export const SelectTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  tenantId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export type InsertTag = z.infer<typeof InsertTagSchema>;
export type SelectTag = z.infer<typeof SelectTagSchema>;



export const InsertAssetTypeSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    tenantId: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectAssetTypeSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    tenantId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateAssetTypeSchema = InsertAssetTypeSchema.partial();

export type InsertAssetType = z.infer<typeof InsertAssetTypeSchema>;
export type SelectAssetType = z.infer<typeof SelectAssetTypeSchema>;
export type UpdateAssetType = z.infer<typeof UpdateAssetTypeSchema>;



export const InsertAssetPropertySchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    propertyType: z.enum(['number','string','textbox','list']),
    tenantId: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectAssetPropertySchema = z.object({
    id: z.number(),
    name: z.string(),
    propertyType: z.enum(['number','string','textbox','list']),
    tenantId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateAssetPropertySchema = InsertAssetPropertySchema.partial();

export type InsertAssetProperty = z.infer<typeof InsertAssetPropertySchema>;
export type SelectAssetProperty = z.infer<typeof SelectAssetPropertySchema>;
export type UpdateAssetProperty = z.infer<typeof UpdateAssetPropertySchema>;



export const InsertBookingFormSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    tenantId: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectBookingFormSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    tenantId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateBookingFormSchema = InsertBookingFormSchema.partial();

export type InsertBookingForm = z.infer<typeof InsertBookingFormSchema>;
export type SelectBookingForm = z.infer<typeof SelectBookingFormSchema>;
export type UpdateBookingForm = z.infer<typeof UpdateBookingFormSchema>;




export const InsertBookingFormFieldSchema = z.object({
    id: z.number().optional(),
    formId: z.number(),
    name: z.string(),
    type: z.enum(['number','text','textarea','date','time',"date_range","range","boolean"]),
    required: z.boolean(),
});
export const SelectBookingFormFieldSchema = z.object({
    id: z.number(),
    formId: z.number(),
    name: z.string(),
    type: z.enum(['number','text','textarea','date','time',"date_range","range","boolean"]),
    required: z.boolean(),
});
export const UpdateBookingFormFieldSchema = InsertBookingFormFieldSchema.partial();

export type InsertBookingFormField = z.infer<typeof InsertBookingFormFieldSchema>;
export type SelectBookingFormField = z.infer<typeof SelectBookingFormFieldSchema>;
export type UpdateBookingFormField = z.infer<typeof UpdateBookingFormFieldSchema>;
