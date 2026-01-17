import { z } from "zod";

export const InsertMaintenanceTaskSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    cost: z.number(),
    description: z.string(),
    status: z.enum(["COMPLETE","IN_PROGRESS","AWAITING"]),
    assetId: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectMaintenanceTaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    cost: z.number(),
    description: z.string(),
    status: z.enum(["COMPLETE","IN_PROGRESS","AWAITING"]),
    assetId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateMaintenanceTaskSchema = InsertMaintenanceTaskSchema.partial().omit({ id: true, assetId: true})

export type InsertMaintenanceTask = z.infer<typeof InsertMaintenanceTaskSchema>;
export type SelectMaintenanceTask = z.infer<typeof SelectMaintenanceTaskSchema>;
export type UpdateMaintenanceTask = z.infer<typeof UpdateMaintenanceTaskSchema>;
