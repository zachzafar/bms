// middleware/auth.middleware.ts

import { db } from "@/db";
import { Tenant } from "@/db/schema/tenant";
import { lucia } from "@/lib/auth";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq,and } from "drizzle-orm";
import { User } from "@/db/schema/users";

interface User {
  id: string;
  tenantId: string;
  // Add other user properties as needed
}

export interface ValidatedTenant {
  id: string;
  name: string;
  subdomain: string;
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    const sessionId = lucia.readSessionCookie(c.req.header("Cookie") ?? "");
    if (!sessionId) {
      c.set("user", null);
      c.set("session", null);

      return next();
    }

    const { session, user } = await lucia.validateSession(sessionId);
    
    if (!session) {
      c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), { append: true });
      c.set("user", null);
      c.set("session", null);

      return next();
    }

    if (session.fresh) {
      c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), { append: true });
    }

    c.set("session", session);
    c.set("user", user as User | null);

    // Tenant validation
    if (user && user.tenantId) {
      const tenant = await validateTenant(user.id,user.tenantId);
      if (!tenant) {
        throw new HTTPException(403, { message: 'Invalid tenant' });
      }
      c.set('tenant', tenant);
    } else if (user) {
      throw new HTTPException(403, { message: 'Tenant not specified' });
    }

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Auth middleware error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
};



async function validateTenant(userId: string, tenantId: string): Promise<ValidatedTenant | null> {
    const result = await db
      .select({
        tenant: {
          id: Tenant.id,
          name: Tenant.name,
          subdomain: Tenant.subdomain,
        },
        user: {
          id: User.id,
        },
      })
      .from(Tenant)
      .innerJoin(User, and(eq(User.tenantId, Tenant.id), eq(User.id, userId)))
      .where(eq(Tenant.id, tenantId))
      .limit(1);
  
    if (result.length === 0) {
      return null;
    }
  
    return result[0].tenant;
  }
