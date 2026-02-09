import { z } from "zod";

export const InsertRateSchema = z.object({
    id: z.number().optional(),
    assetId: z.string(),
    name: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
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
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    minDuration: z.number().nullable(),
    maxDuration: z.number().nullable(),
    pricePerUnit: z.string().nullable(),
    priority: z.number().nullable(),
    rateTypeId: z.number().nullable(),
});

export type InsertRate = z.infer<typeof InsertRateSchema>;
export type SelectRate = z.infer<typeof SelectRateSchema>;
