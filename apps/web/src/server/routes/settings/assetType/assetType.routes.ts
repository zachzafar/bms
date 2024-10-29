import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import jsonContent from "stoker/openapi/helpers/json-content";
import { insertAssetTypeSchema, patchAssetTypeSchema, selectAssetTypeSchema } from "../../../db/schema/settings";
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
  path: "/asset-types",
  method: "get",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.array(selectAssetTypeSchema), "List of Asset Types"),
    ...commonErrorResponses
  }
});

export const create = createRoute({
  path: "/asset-types",
  method: "post",
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectAssetTypeSchema,
      "The created asset type",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertAssetTypeSchema),
      "The validation error(s)",
    ),
    ...commonErrorResponses
  },
  request: {
    body: jsonContentRequired(insertAssetTypeSchema, "The asset type to create")
  }
});

export const update = createRoute({
  path: "/asset-types/{id}",
  method: "put",
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(
      patchAssetTypeSchema,
      "The asset type updates",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectAssetTypeSchema,
      "The updated asset type",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Asset type not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchAssetTypeSchema)
        .or(createErrorSchema(IdParamsSchema)),
      "The validation error(s)",
    ),
    ...commonErrorResponses
  },
});

export const remove = createRoute({
  path: "/asset-types/{id}",
  method: "delete",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Asset type deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Asset type not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid id error",
    ),
    ...commonErrorResponses
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;

export default function Component() {
  return null;
}