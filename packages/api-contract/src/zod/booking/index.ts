import { z } from "zod";

export const InsertBookingSchema = z.object({
    id: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: z.string().nullable().optional(),
    totalPrice: z.string().regex(/^\d+(\.\d+)?$/, 'Total price must be a decimal number').nullable().optional(), // decimal -> number/string. drizzle-zod uses number usually or string? Decimal in mysql is string in JS usually?
    assetId: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectBookingSchema = z.object({
    id: z.string(),
    startDate: z.date(), // datetime -> Date
    endDate: z.date(),
    status: z.string().nullable(),
    totalPrice: z.string().nullable(),
    assetId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});

export const UpdateBookingSchema = InsertBookingSchema.partial().required({id:true, startDate: true, endDate: true, status: true, totalPrice: true, assetId: true});

export type InsertBooking = z.infer<typeof InsertBookingSchema>;
export type SelectBooking = z.infer<typeof SelectBookingSchema>;
export type UpdateBooking = z.infer<typeof UpdateBookingSchema>;

export const InsertSlotSchema = z.object({
    id: z.number().optional(),
    assetId: z.string(),
    date: z.string(), // date -> string
    startTime: z.date(), // datetime -> Date
    endTime: z.date(),
    status: z.string().optional(),
    bookingId: z.string().nullable().optional(),
    price: z.string().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectSlotSchema = z.object({
    id: z.number(),
    assetId: z.string(),
    date: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    status: z.string(),
    bookingId: z.string().nullable(),
    price: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateSlotSchema = InsertSlotSchema.partial();

export type InsertSlot = z.infer<typeof InsertSlotSchema>;
export type SelectSlot = z.infer<typeof SelectSlotSchema>;
export type UpdateSlot = z.infer<typeof UpdateSlotSchema>;

export const InsertRateSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    startDate: z.string(),
    endDate: z.string(),
    minNights: z.number().nullable().optional(),
    maxNights: z.number().nullable().optional(),
    pricePerNight: z.string().nullable().optional(),
    priority: z.number().nullable().optional(),
    isActive: z.boolean().optional().default(true),
    assetIds: z.array(z.string()).optional(),
});
export const SelectRateSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    startDate: z.string(),
    endDate: z.string(),
    minNights: z.number().nullable(),
    maxNights: z.number().nullable(),
    pricePerNight: z.string().nullable(),
    priority: z.number().nullable(),
    isActive: z.boolean(),
    createdAt: z.coerce.date(),
});
export const UpdateRateSchema = InsertRateSchema.partial();

export type InsertRate = z.infer<typeof InsertRateSchema>;
export type SelectRate = z.infer<typeof SelectRateSchema>;
export type UpdateRate = z.infer<typeof UpdateRateSchema>;

// Blocked Dates table
export const InsertBlockedDateSchema = z.object({
    id: z.number().optional(),
    tenantId: z.string(),
    assetId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    title: z.string(),
    reason: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectBlockedDateSchema = z.object({
    id: z.number(),
    tenantId: z.string(),
    assetId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    title: z.string(),
    reason: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});
export const UpdateBlockedDateSchema = InsertBlockedDateSchema.partial();

export type InsertBlockedDate = z.infer<typeof InsertBlockedDateSchema>;
export type SelectBlockedDate = z.infer<typeof SelectBlockedDateSchema>;
export type UpdateBlockedDate = z.infer<typeof UpdateBlockedDateSchema>;




