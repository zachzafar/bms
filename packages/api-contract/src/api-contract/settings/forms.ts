import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertBookingFormFieldSchema, InsertBookingFormSchema, SelectBookingFormSchema } from "../../database-schema";
import { pagination } from "../utils";

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
            200: z.object({
                data: z.array(SelectBookingFormSchema),
                pagination
            })
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
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