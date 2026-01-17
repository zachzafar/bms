import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertMaintenanceTaskSchema, SelectFileSchema, SelectMaintenanceTaskSchema, UpdateMaintenanceTaskSchema } from "../database-schema";
import { pagination } from "./utils";



const c = initContract();

export const maintenanceContract = c.router({
        createMaintenance : {
        method: 'POST',
        path: '/maintenance',
        body: InsertMaintenanceTaskSchema,
        responses: {
            201: z.object({
                id: z.string(),
            })
        },
        summary: 'Create a new maintenance task'
    },
    getMaintenances: {
        method: 'GET',
        path: '/maintenance',
        responses: {
            200: z.object({
                data: z.array(SelectMaintenanceTaskSchema),
                pagination
            })
        },
        query: z.object({
            search: z.string().optional(),
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: 'Get all maintenance tasks'
    },
    getMaintenance: {
        method: 'GET',
        path: '/maintenance/:id',
        responses: {
            200: SelectMaintenanceTaskSchema,
            404: z.undefined()
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Get a maintenance task by id'
    },
    updateMaintenance: {
        method: 'PUT',
        path: '/maintenance/:id',
        responses: {
            200: z.string()
        },
        pathParams: z.object({
            id: z.string()
        }),
        body: UpdateMaintenanceTaskSchema,
        summary: 'Update a maintenance task by id'
    },
    deleteMaintenance: {
        method: 'DELETE',
        path: '/maintenance/:id',
        responses: {
            204: z.undefined()
        },
        pathParams: z.object({
            id: z.string()
        }),
        summary: 'Delete a maintenance task by id'
    },
    uploadMaintenanceFiles: {
        method: 'POST',
        path: '/maintenance/:id/files',
        responses: {
            200: z.object({
                message: z.string(),
            })
        },
        pathParams: z.object({
            id: z.string(),
        }),
        body: z.object({
            images: z.any()
        }),
        summary: 'Upload images for a property'
    },
    getMaintenanceFiles: {
        method: 'GET',
        path: '/maintenance/:id/files',
        responses: {
            200: z.object({
                data: z.array(SelectFileSchema),
                pagination
            })
        },
        pathParams: z.object({
            id: z.string()
        }),
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        summary: 'Get images for an asset'
    },
    deleteMaintenanceFiles: {
        method: 'DELETE',
        path: '/maintenance/:id/files',
        responses: {
            200: z.object({
                failedIds: z.array(z.number()),
                message: z.string(),
            }),
            204: z.undefined()
        },
        pathParams: z.object({
            id: z.string(),
        }),
        body: z.object({
            files: z.array(z.number())
        }),
        summary: 'Delete images for an asset'
    },
        
})