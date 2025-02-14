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
            404: z.undefined()
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Get a form by id'
    },
})