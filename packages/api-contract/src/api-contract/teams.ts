
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { InsertTenantTeamSchema, SelectAssetSchema, SelectTenantTeamSchema, SelectUserSchema } from "../database-schema";

const c = initContract();

export const teamsContract = c.router({
    createTeam: {
        method: "POST",
        path: "/teams",
        body: InsertTenantTeamSchema,
        responses: {
            201: z.object({
                id: z.number()
            }),
            400: z.object({
                message: z.string()
            })
        },
        summary: "Create a new team"
    },
    getTeam: {
        method: "GET",
        path: "tenant/:tenant/teams/:id",
        responses: {
            200: z.object({
                name: z.string(),
                assets: z.array(SelectAssetSchema),
                users: z.array(SelectUserSchema)
            }),
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number(),
            tenant: z.string(),
        }),
        summary: "Get a team"
    },
    getTeams: {
        method: "GET",
        path: "/teams",
        responses: {
            200: z.array(SelectTenantTeamSchema)
        },
        summary: "Get all teams"
    },
    updateTeam: {
        method: "PUT",
        path: "/teams/:id",
        body: InsertTenantTeamSchema.partial(),
        responses: {
            200: z.object({
                message: z.string(),
            })
        },
        pathParams: z.object({
            id: z.number(),
        }),
        summary: "Update a team"
    },
    deleteTeam: {
        method: "DELETE",
        path: "/teams/:id",
        responses: {
            200: z.object({
                message: z.string(),
            }),
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number(),
        }),
        summary: "Delete a team"
    },
    addUserToTeam: {
        method: "POST",
        path: "/teams/:id/users/:userId",
        body: z.undefined(),
        responses: {
            200: z.object({
                message: z.string()
            }),
            404: z.object({
                message: z.string()
            })
        },
        pathParams: z.object({
            id: z.number(),
            userId: z.string()
        }),
        summary: "Add a user to a team"
    },
    removeUserFromTeam: {
        method: "DELETE",
        path: "/teams/:id/users/:userId",
        body: z.undefined(),
        responses: {
            200: z.object({
                message: z.string()
            }),
        },
        pathParams: z.object({
            id: z.number(),
            userId: z.string(),
        }),
        summary: "Remove a user from a team"
    },
});