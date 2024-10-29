// routes/auth/auth.routes.ts

import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import jsonContentRequired from "stoker/openapi/helpers/json-content-required";
import jsonContent from "stoker/openapi/helpers/json-content";
import createErrorSchema from "stoker/openapi/schemas/create-error-schema";
import { loginSchema, insertUserSchema } from "../../db/schema/users";
import { insertTenantSchema } from "../../db/schema/tenant";
import { z } from "zod";

const tags = ["Auth"];

const signupSchema = insertUserSchema
  .merge(insertTenantSchema.pick({ name: true, subdomain: true }))
  .extend({
    tenantName: z.string(),
  })
  .omit({
    id: true,
    role: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
  });

export const login = createRoute({
  path: "/auth/login",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(loginSchema, "Login credentials"),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "Login successful",
    },
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Invalid credentials",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(loginSchema),
      "Validation error(s)",
    ),
  },
});

export const signup = createRoute({
  path: "/auth/signup",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(signupSchema, "Signup data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      description: "Signup successful",
    },
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Email or subdomain already exists",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(signupSchema),
      "Validation error(s)",
    ),
  },
});

export const logout = createRoute({
  path: "/auth/logout",
  method: "post",
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      description: "Logout successful",
    },
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Not authenticated",
    ),
  },
});

export type LoginRoute = typeof login;
export type SignupRoute = typeof signup;
export type LogoutRoute = typeof logout;