import { initContract } from '@ts-rest/core';

import { z } from "zod";
import { InsertTenantSchema, SelectTenantSchema,InsertUserSchema,SelectUserSchema } from "../database-schema/schema"


const c = initContract();

export const authContract = c.router({
    registerTenant: {
        method: 'POST',
        path: '/tenant',
        responses: {
            201: z.object({
              tenant: InsertTenantSchema,
              adminUser: InsertUserSchema.omit({ password: true })
            })
          },
        body: z.object({
          tenant: InsertTenantSchema,
          adminUser: InsertUserSchema.omit({ tenantId: true, role: true })
        }).required({ tenant: true, adminUser: true }),
        summary: 'Create a new tenant with an admin user'
    },
    login: {
        method: 'POST',
        path: '/login',
        responses: {
            200: z.object({
              token: z.string(),
              refreshToken: z.string(),
                user: SelectUserSchema.omit({ password: true}),
                tenant: SelectTenantSchema
            })
          },
        body: z.object({
            email: z.string().email(),
            password: z.string().max(255)
    }).required({ email: true, password: true }),
        summary: 'User login'
    },
    refreshToken: {
        method: 'POST',
        path: '/refresh',
        headers: z.object({
          user: SelectUserSchema.omit({ password: true,email: true, createdAt: true, updatedAt: true })
        }),
        responses: {
            200: z.object({
              token: z.string(),
              refreshToken: z.string(),
                user: SelectUserSchema.omit({ password: true}),
                tenant: SelectTenantSchema
            })
          },
        body: z.object({
            refresh: z.string().max(255)
    }).required({ refresh: true }),
        summary: 'Refresh token'
    },
    logout: {
        method: 'POST',
        path: '/logout',
        body: z.object({
          refreshToken: z.string().max(255)
        }),
        responses: {
            204: z.object({
              message: z.string()
            })
          },
        summary: 'Logout'},
    createUser: {
        method: 'POST',
        path: '/user',
        body: z.object({
            user: InsertUserSchema
        }).required({ user: true }),
        responses: {
            201: z.object({
                user: SelectUserSchema.omit({ password: true })
            })
        },
        headers: z.object({
                user: SelectUserSchema ,
                Authorization: z.string().regex(/^Bearer .+$/, 'Must be a Bearer token'),
              }),
        summary: 'Create a new user'
    }



})