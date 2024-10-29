import { lucia } from "../../lib/auth";
import { db } from "../../db";
import { User } from "../../db/schema/users";
import { Tenant } from "../../db/schema/tenant";
import { eq } from "drizzle-orm";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";
import { AppRouteHandler } from "../../lib/types";
import { LoginRoute, SignupRoute, LogoutRoute } from "./auth.routes";

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const existingUser = await db.select().from(User).where(eq(User.email, email));

    if (!existingUser) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const validPassword = await new Argon2id().verify(existingUser[0].password, password);

    if (!validPassword) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const session = await lucia.createSession(existingUser[0].id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    c.header("Set-Cookie", sessionCookie.serialize());
    return c.json({ message: "Login successful" });
  } catch (error) {
    console.error(error);
    return c.json({ message: "An error occurred during login" }, 500);
  }
};

export const signup: AppRouteHandler<SignupRoute> = async (c) => {
  const { name, email, password, tenantName, subdomain } = c.req.valid("json");

  try {
    const existingUser = await db.select().from(User).where(eq(User.email,email)) 

    if (existingUser) {
      return c.json({ message: "Email already exists" }, 409);
    }

    const existingTenant = await db.select().from(Tenant).where(eq(Tenant.subdomain, subdomain));

    if (existingTenant) {
      return c.json({ message: "Subdomain already exists" }, 409);
    }

    const hashedPassword = await new Argon2id().hash(password);
    const userId = generateId(15);

    const newTenant = await db.insert(Tenant).values({
      name: tenantName,
      subdomain,
    }).execute();

    const tenantId = newTenant[0].insertId.toString();

    await db.insert(User).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
      role: "admin",
      tenantId,
    }).execute();

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    c.header("Set-Cookie", sessionCookie.serialize());
    return c.json({ message: "Signup successful" }, 201);
  } catch (error) {
    console.error(error);
    return c.json({ message: "An error occurred during signup" }, 500);
  }
};

export const logout: AppRouteHandler<LogoutRoute> = async (c) => {
  const session = c.get("session");
  const sessionId = session ? session.id : null;

  if (!sessionId) {
    return c.json({ message: "Not authenticated" }, 401);
  }

  await lucia.invalidateSession(sessionId);

  const sessionCookie = lucia.createBlankSessionCookie();
  c.header("Set-Cookie", sessionCookie.serialize());
  return c.json({ message: "Logout successful" });
};