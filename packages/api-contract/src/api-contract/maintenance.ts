import { initContract } from "@ts-rest/core";

import { z } from "zod";
import { InsertMaintenanceTaskSchema, SelectMaintenanceTaskSchema, UpdateMaintenanceTaskSchema } from "../database-schema";



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
            200: z.array(SelectMaintenanceTaskSchema)
        },
        query: z.object({
            search: z.string().optional(),
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
    uploadMaintenanceFile: {
        method: 'POST',
        path: '/maintenance/:id/files',
        responses: {
            200: z.object({
                fileUrl: z.string(),
            }),
            404: z.object({
                message: z.string(),
            }),
        },
        body: z.object({
            file: z.any(), // File will be handled by multer
        }),
        summary: 'Upload a file for a maintenance task',
    },

    deleteMaintenanceFile: {
        method: 'DELETE',
        path: '/maintenance/:maintenanceId/files/:fileId',
        responses: {
            204: z.void(),
            404: z.object({
                message: z.string(),
            }),
        },
        body: null,
        summary: 'Delete a file from a maintenance task',
    },
        
})