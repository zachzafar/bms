import { z } from "zod";

export const InsertRateSchema = z.object({
    id: z.number().optional(),
    assetId: z.string(),
    name: z.string().nullable().optional(),
    startMonth: z.number().min(1).max(12).nullable().optional(),
    startDay: z.number().min(1).max(31).nullable().optional(),
    endMonth: z.number().min(1).max(12).nullable().optional(),
    endDay: z.number().min(1).max(31).nullable().optional(),
    minDuration: z.number().nullable().optional(),
    maxDuration: z.number().nullable().optional(),
    pricePerUnit: z.string().nullable().optional(),
    priority: z.number().nullable().optional(),
    rateTypeId: z.number().nullable().optional(),
});
export const SelectRateSchema = z.object({
    id: z.number(),
    assetId: z.string(),
    name: z.string().nullable(),
    startMonth: z.number().nullable(),
    startDay: z.number().nullable(),
    endMonth: z.number().nullable(),
    endDay: z.number().nullable(),
    minDuration: z.number().nullable(),
    maxDuration: z.number().nullable(),
    pricePerUnit: z.string().nullable(),
    priority: z.number().nullable(),
    rateTypeId: z.number().nullable(),
});

export type InsertRate = z.infer<typeof InsertRateSchema>;
export type SelectRate = z.infer<typeof SelectRateSchema>;
