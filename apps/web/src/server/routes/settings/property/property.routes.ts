import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes"
import jsonContent from "stoker/openapi/helpers/json-content";
import { insertAssetPropertySchema, patchAssetPropertySchema, selectAssetPropertySchema } from "../../../db/schema/settings";
import jsonContentRequired from "stoker/openapi/helpers/json-content-required";
import createErrorSchema from "stoker/openapi/schemas/create-error-schema";
import IdParamsSchema from "stoker/openapi/schemas/id-params";
import { notFoundSchema } from "../../../lib/constants";

const unauthorizedSchema = z.object({
    message: z.string(),
  });
  
  const forbiddenSchema = z.object({
    message: z.string(),
  });
  
  const commonErrorResponses = {
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(unauthorizedSchema, "Unauthorized"),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(forbiddenSchema, "Forbidden"),
  };

export const list = createRoute({
    path: "/property",
    method: 'get',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(selectAssetPropertySchema), "List of Property types"),
        ...commonErrorResponses
    }
})

export const create = createRoute({
    path: "/property",
    method: 'post',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            selectAssetPropertySchema,
            "The created property type",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(insertAssetPropertySchema),
            "The validation error(s)",
        ),
        ...commonErrorResponses
    },
    request: {
        body: jsonContentRequired(insertAssetPropertySchema, 'The asset property type to create')
    }
})

export const patch = createRoute({
    path: "/property/{id}",
    method: "patch",
    request: {
        params: IdParamsSchema,
        body: jsonContentRequired(
            patchAssetPropertySchema,
            "The property type updates updates",
        ),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            selectAssetPropertySchema,
            "The updated property",
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Property not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(patchAssetPropertySchema)
                .or(createErrorSchema(IdParamsSchema)),
            "The validation error(s)",
        ),
        ...commonErrorResponses
    },
})

export const remove = createRoute({
    path: "/property/{id}",
    method: "delete",
    request: {
        params: IdParamsSchema,
    },
    responses: {
        [HttpStatusCodes.NO_CONTENT]: {
            description: "Property deleted",
        },
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Property not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(IdParamsSchema),
            "Invalid id error",
        ),
        ...commonErrorResponses
    },
})

export type ListRoute = typeof list
export type CreateRoute = typeof create
export type PatchRoute = typeof patch
export type RemoveRoute = typeof remove
