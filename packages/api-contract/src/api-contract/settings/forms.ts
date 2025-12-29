import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertBookingFormFieldSchema, InsertBookingFormSchema, SelectBookingFormSchema } from "../zod";

const c = initContract();

export const formsContract = c.router({
    createForm : {
        method: 'POST',
        path: '/form',
        body: z.object({
            form : InsertBookingFormSchema,
            fields: z.array(InsertBookingFormFieldSchema.omit({
                formId: true
            }))
        }),
        responses: {
            201: z.object({
                id: z.number()
            })
        },
        summary: 'Create a new form'
    },
    getForms: {
        method: 'GET',
        path: '/form',
        responses: {
            200: z.array(SelectBookingFormSchema)
        },
        summary: 'Get all forms'
    },
    getForm: {
        method: 'GET',
        path: '/form/:id',
        responses: {
            200: z.object({
                form: SelectBookingFormSchema,
                fields: z.array(SelectBookingFormSchema)
            }),
        },
        pathParams: z.object({
            id: z.number()
        }),
        summary: 'Get a form by id'
    },
})