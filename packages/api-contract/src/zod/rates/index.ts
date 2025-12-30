import { z } from "zod";

export const InsertRateSchema = z.object({
    id: z.number().optional(),
    assetId: z.string(),
    name: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    minNights: z.number().nullable().optional(),
    maxNights: z.number().nullable().optional(),
    pricePerNight: z.string().nullable().optional(),
    priority: z.number().nullable().optional(),
});
export const SelectRateSchema = z.object({
    id: z.number(),
    assetId: z.string(),
    name: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    minNights: z.number().nullable(),
    maxNights: z.number().nullable(),
    pricePerNight: z.string().nullable(),
    priority: z.number().nullable(),
});

export type InsertRate = z.infer<typeof InsertRateSchema>;
export type SelectRate = z.infer<typeof SelectRateSchema>;