import { z } from "zod";

export const InsertKeySchema = z.object({
    id: z.string().optional(),
    key: z.string(),
    name: z.string(),
    scopes: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    tenantId: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().nullable().optional(),
});
export const SelectKeySchema = z.object({
    id: z.string(),
    key: z.string(),
    name: z.string(),
    scopes: z.array(z.string()).nullable(),
    isActive: z.boolean().nullable(), // boolean with default is nullable in select? No, boolean default makes it not null in DB if column is not null. 
    // `isActive: boolean("is_active").default(true)` - Drizzle boolean is nullable by default unless .notNull() is called.
    // So it is nullable.
    tenantId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});

export type InsertKey = z.infer<typeof InsertKeySchema>
export type SelectKey = z.infer<typeof SelectKeySchema>
