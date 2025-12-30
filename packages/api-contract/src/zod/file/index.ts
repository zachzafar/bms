import { z } from "zod";

export const SelectFileSchema = z.object({
    id: z.number(),
    fileUrl: z.string(),
    uploadedAt: z.date(),
    maintenanceTaskId: z.string(),
});
export type SelectFile = z.infer<typeof SelectFileSchema>


