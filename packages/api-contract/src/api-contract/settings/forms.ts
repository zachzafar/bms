import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertBookingFormFieldSchema, InsertBookingFormSchema, SelectBookingFormFieldSchema, SelectBookingFormSchema } from "../../database-schema";
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
                fields: z.array(SelectBookingFormFieldSchema)
            }),
        },
        pathParams: z.object({
            id: z.coerce.number()
        }),
        summary: 'Get a form by id'
    },
    updateForm: {
        method: 'PUT',
        path: '/form/:id',
        body: z.object({
            form: InsertBookingFormSchema.partial(),
            fields: z.array(InsertBookingFormFieldSchema.omit({
                formId: true
            })).optional()
        }),
        pathParams: z.object({
            id: z.coerce.number()
        }),
        responses: {
            200: z.object({
                message: z.string()
            }),
            404: z.undefined()
        },
        summary: 'Update a form'
    },
    deleteForm: {
        method: 'DELETE',
        path: '/form/:id',
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        body: z.undefined(),
        responses: {
            204: z.undefined(),
            404: z.undefined()
        },
        summary: 'Delete a form'
    },

    // Asset assignment endpoints
    assignFormToAsset: {
        method: 'POST',
        path: '/form/:formId/assign/asset/:assetId',
        pathParams: z.object({
            formId: z.coerce.number(),
            assetId: z.string()
        }),
        body: z.object({}),
        responses: {
            201: z.object({
                message: z.string()
            }),
            409: z.object({
                message: z.string()
            })
        },
        summary: 'Assign a form to a specific asset'
    },
    unassignFormFromAsset: {
        method: 'DELETE',
        path: '/form/:formId/assign/asset/:assetId',
        pathParams: z.object({
            formId: z.coerce.number(),
            assetId: z.string()
        }),
        responses: {
            204: z.undefined(),
            404: z.undefined()
        },
        summary: 'Unassign a form from a specific asset'
    },

    // AssetType assignment endpoints
    assignFormToAssetType: {
        method: 'POST',
        path: '/form/:formId/assign/asset-type/:assetTypeId',
        pathParams: z.object({
            formId: z.coerce.number(),
            assetTypeId: z.coerce.number()
        }),
        body: z.object({}),
        responses: {
            201: z.object({
                message: z.string()
            }),
            409: z.object({
                message: z.string()
            })
        },
        summary: 'Assign a form to an asset type'
    },
    unassignFormFromAssetType: {
        method: 'DELETE',
        path: '/form/:formId/assign/asset-type/:assetTypeId',
        pathParams: z.object({
            formId: z.coerce.number(),
            assetTypeId: z.coerce.number()
        }),
        responses: {
            204: z.undefined(),
            404: z.undefined()
        },
        summary: 'Unassign a form from an asset type'
    },

    // Tag assignment endpoints
    assignFormToTag: {
        method: 'POST',
        path: '/form/:formId/assign/tag/:tagId',
        pathParams: z.object({
            formId: z.coerce.number(),
            tagId: z.coerce.number()
        }),
        body: z.object({}),
        responses: {
            201: z.object({
                message: z.string()
            }),
            409: z.object({
                message: z.string()
            })
        },
        summary: 'Assign a form to a tag'
    },
    unassignFormFromTag: {
        method: 'DELETE',
        path: '/form/:formId/assign/tag/:tagId',
        pathParams: z.object({
            formId: z.coerce.number(),
            tagId: z.coerce.number()
        }),
        responses: {
            204: z.undefined(),
            404: z.undefined()
        },
        summary: 'Unassign a form from a tag'
    },

    // Get forms for an asset (with priority resolution)
    getFormsForAsset: {
        method: 'GET',
        path: '/form/asset/:assetId',
        pathParams: z.object({
            assetId: z.string()
        }),
        responses: {
            200: z.object({
                forms: z.array(z.object({
                    form: SelectBookingFormSchema,
                    fields: z.array(SelectBookingFormFieldSchema),
                    assignmentType: z.enum(['direct', 'assetType', 'tag'])
                }))
            })
        },
        summary: 'Get all forms applicable to an asset (with priority resolution)'
    },
})