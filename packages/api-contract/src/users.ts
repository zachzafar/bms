import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { User } from "@repo/drizzle/src/schema";

export const selectUserSchema = createSelectSchema(User);
export const insertUserSchema = createInsertSchema(User, {
  email: (schema) => schema.email.email(),
  password: (schema) => schema.password.min(8),
})

