import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { SelectOwnerSchema } from "../database-schema";
import { pagination } from './utils';

const c = initContract();

export const ownerContract = c.router({
    createOwner: {
        method: "POST",
        path: "/owners",
        body: z.object({
            name: z.string(),
            email: z.string(),
            phone: z.string().nullable().optional(),
            address: z.string().nullable().optional(),
        }),
        responses: {
            200: z.object({
                id: z.number(),
            }),
        },
        summary: "Create a new owner (creates User + Owner records)"
    },
    getOwners: {
        method: "GET",
        path: "/owners",
        responses: {
            200: z.object({
                data: z.array(SelectOwnerSchema),
                pagination
            }),
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
            search: z.string().optional(),
        }),
        summary: "Get all owners"
    },
    getOwner: {
        method: "GET",
        path: "/owners/:id",
        responses: {
            200: SelectOwnerSchema,
            404: z.object({ message: z.string() }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Get an owner by ID"
    },
    updateOwner: {
        method: "PUT",
        path: "/owners/:id",
        body: z.object({
            name: z.string().optional(),
            email: z.string().optional(),
            password: z.string().optional(),
            phone: z.string().nullable().optional(),
            address: z.string().nullable().optional(),
            roles: z.array(z.coerce.number()).optional(),
        }),
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Update an owner"
    },
    deleteOwner: {
        method: "DELETE",
        path: "/owners/:id",
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        body: z.object({}).optional(),
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Delete an owner"
    },
    assignAsset: {
        method: "POST",
        path: "/owners/:id/assets",
        body: z.object({
            assetId: z.string(),
        }),
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Assign an asset to an owner"
    },
    unassignAsset: {
        method: "DELETE",
        path: "/owners/:id/assets/:assetId",
        responses: {
            200: z.object({
                message: z.string(),
            }),
        },
        body: z.object({}).optional(),
        pathParams: z.object({
            id: z.coerce.number(),
            assetId: z.string(),
        }),
        summary: "Unassign an asset from an owner"
    },
    getOwnerAssetsAdmin: {
        method: "GET",
        path: "/owners/:id/assets",
        responses: {
            200: z.object({
                data: z.array(z.any()),
                pagination,
            }),
        },
        query: z.object({
            page: z.coerce.number().optional(),
            pageSize: z.coerce.number().optional(),
        }),
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        summary: "Get assets assigned to an owner"
    },
});
