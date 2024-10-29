// property.handlers.ts

import { eq, and } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "../../../lib/types";

import { db } from "../../../db";
import { AssetProperty } from "../../../db/schema/settings";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "../../../lib/constants";

import type { ListRoute, CreateRoute, PatchRoute, RemoveRoute } from "./property.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
  }
  const properties = await db.select().from(AssetProperty).where(eq(AssetProperty.tenantId, user.tenantId));
  return c.json(properties,HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
  }
  const propertyData = c.req.valid("json");
  const result = await db.insert(AssetProperty).values({ ...propertyData, tenantId: user.tenantId });
  const insertedId = result[0].insertId;
  const inserted = await db.select().from(AssetProperty).where(eq(AssetProperty.id, insertedId)).limit(1);
  return c.json(inserted[0], HttpStatusCodes.OK);
};

// export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
//   const user = c.get("user");
//   const { id } = c.req.valid("param");
//   const property = await db.select().from(AssetProperty).where(
//     and(
//       eq(AssetProperty.id, Number(id)),
//       eq(AssetProperty.tenantId, user.tenantId)
//     )
//   ).limit(1);

//   if (property.length === 0) {
//     return c.json(
//       {
//         message: HttpStatusPhrases.NOT_FOUND,
//       },
//       HttpStatusCodes.NOT_FOUND,
//     );
//   }

//   return c.json(property[0], HttpStatusCodes.OK);
// };

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
  }
  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  const result = await db.update(AssetProperty)
    .set(updates)
    .where(
      and(
        eq(AssetProperty.id, Number(id)),
        eq(AssetProperty.tenantId, user.tenantId)
      )
    );

  if (result[0].affectedRows === 0) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const updated = await db.select().from(AssetProperty).where(eq(AssetProperty.id, Number(id))).limit(1);
  return c.json(updated[0], HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          issues: [],
          name: "UnauthorizedError",
          message: HttpStatusPhrases.UNAUTHORIZED,
        },
      },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }
  const result = await db.delete(AssetProperty)
    .where(
      and(
        eq(AssetProperty.id, Number(id)),
        eq(AssetProperty.tenantId, user.tenantId)
      )
    );

  if (result[0].affectedRows === 0) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};