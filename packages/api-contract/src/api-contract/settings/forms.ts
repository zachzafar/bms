import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertBookingFormFieldSchema, InsertBookingFormSchema, SelectBookingFormSchema } from "../../database-schema";

const c = initContract();

export const formsContract = c.router({
    createForm : {
        method: 'POST',
        path: '/form',
        body: z.object({
            form : InsertBookingFormSchema,
            fields: z.array(InsertBookingFormFieldSchema)
        }),
        responses: {
            201: z.object({
                form: SelectBookingFormSchema,
                fields: z.array(SelectBookingFormSchema)
            })
        },
        summary: 'Create a new form'
    }
})