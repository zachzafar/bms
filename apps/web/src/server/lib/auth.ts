// /lib/auth.ts

import { Lucia } from "lucia";
import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "../db";
import { User, Session } from "../db/schema/users";

const adapter = new DrizzleMySQLAdapter(db, Session, User);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production"
    }
  },
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      name: attributes.name,
      email: attributes.email,
      role: attributes.role,
      tenantId: attributes.tenantId,
      // Add any other attributes you want to include
    };
  }
});

// IMPORTANT!
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      id: string;
      name: string;
      email: string;
      role: string;
      tenantId: string;
      // Add any other attributes you want to include
    };
  }
}