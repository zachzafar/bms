import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { User } from ".";
import { z } from "zod";

export const selectUserSchema = createSelectSchema(User);
export const insertUserSchema = createInsertSchema(User, {
  email: (schema) => schema.email.email(),
  password: (schema) => schema.password.min(8),
}).pick({
    name: true,
    email: true,
    password: true,
    role: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>
export type SelectUser = z.infer<typeof selectUserSchema>