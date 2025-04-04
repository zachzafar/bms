import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { SelectKeySchema } from "../database-schema";




const c = initContract()

export const keysContract = c.router({
    createKey: {
        method: 'POST',
        path: '/keys',
        responses: {
            201: z.object({
                message: z.string()
            })
        },
        body: z.object({
            name: z.string()
        }),
        summary: 'Create a new API key'
    },
    getKeys: {
        method: 'GET',
        path: '/keys',
        responses: {
            200: z.array(SelectKeySchema)
        },
        summary: 'Get all API keys for a tenant',
    }
})