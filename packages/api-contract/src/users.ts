
import { initContract } from "@ts-rest/core";
import { z } from "zod";

export const UserInsertSchema = z.object({
    id: z.string().max(36),
    name: z.string().max(255),
    email: z.string().email(),
    password: z.string().max(255),
    tenantId: z.string().max(255),
    role: z.string().max(50), // Enum values should be validated if needed
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const UserSelectSchema = UserInsertSchema.extend({
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type InsertUser = z.infer<typeof UserInsertSchema>
export type SelectUser = z.infer<typeof UserSelectSchema>

const c = initContract();

export const contract = c.router({
    
})