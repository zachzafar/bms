"use client";

import { SelectTenant, SelectUser } from "@repo/api-contract";
import { getSession } from "./session";

/**
 * IMPORTANT
 * - Tokens should be set as HTTP-only cookies by the server (Set-Cookie).
 *   Client JS cannot read HTTP-only cookies (by design).
 * - We still expose getToken(): it will read a non-HTTP-only token cookie if present,
 *   otherwise it falls back to getSession() (server checks HTTP-only cookie).
 * - User/Tenant data are stored in normal cookies (keep them small: <4KB per cookie).
 */

type CookieOptions = {
  /** Seconds until expiry. Omit = session cookie. */
  maxAgeSeconds?: number;
  /** Default '/' so all routes share it. */
  path?: string;
  /** If on HTTPS, cookies can be marked Secure. On http://localhost this is ignored. */
  secure?: boolean;
  /** SameSite defaults to 'Lax' which is ideal for subdomains/ports on same site. */
  sameSite?: "Lax" | "Strict" | "None";
};

function isClient() {
  return typeof document !== "undefined";
}

function setCookie(name: string, value: string, opts: CookieOptions = {}) {
  if (!isClient()) return;
  const {
    maxAgeSeconds,
    path = "/",
    secure = typeof window !== "undefined" && window.location.protocol === "https:",
    sameSite = "Lax",
  } = opts;

  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];

  if (typeof maxAgeSeconds === "number") parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  if (secure) parts.push("Secure"); // ignored on http://localhost but fine to include

  document.cookie = parts.join("; ");
}

function getCookie(name: string): string | null {
  if (!isClient()) return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function removeCookie(name: string, path: string = "/") {
  if (!isClient()) return;
  // Delete without domain (cookies set without explicit domain)
  document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Max-Age=0`;
  // Also delete with domain to cover cookies that may have been set with a domain
  const domain = process.env.NEXT_PUBLIC_DOMAIN;
  if (domain) {
    document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Domain=${domain}; Max-Age=0`;
  }
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export class StorageService {
  private static readonly TOKEN_KEY = "auth_token";   // non-HTTP-only fallback (dev only)
  private static readonly SID_COOKIE = "sid";          // recommended HTTP-only cookie set by server
  private static readonly USER_KEY = "user";
  private static readonly TENANT_KEY = "tenant";
  private static readonly TENANT_LIST_KEY = "tenant_list";
  private static readonly OWNER_USER_KEY = "owner_user";

  /* ----------------------- TOKEN ----------------------- */

  /**
   * Prefer server-set HTTP-only cookie (sid). Do NOT store real tokens client-side.
   * Keep this only for non-sensitive dev flows (or make it a no-op).
   */
  static setToken(accessToken: string, opts: CookieOptions = { maxAgeSeconds: 60 * 60 * 24 * 7 }) {
    // 🔒 Consider removing this in production. Use server Set-Cookie instead.
    setCookie(StorageService.TOKEN_KEY, accessToken, opts);
  }

  /**
   * If token cookie is HTTP-only (sid), JS cannot read it.
   * We attempt to read a non-HTTP-only token cookie first; else fall back to getSession(),
   * which should hit the server and validate the HTTP-only cookie.
   */
  static async getToken(): Promise<string | null> {
    if (!isClient()) return null;

    // Try non-HTTP-only dev cookie first
    const nonHttpOnly = getCookie(StorageService.TOKEN_KEY);
    if (nonHttpOnly) return nonHttpOnly;

    // Try reading a non-HTTP-only 'sid' (if you ever set it that way in dev)
    const maybeSid = getCookie(StorageService.SID_COOKIE);
    if (maybeSid) return maybeSid;

    // Fallback: ask server for the current session (server will read HTTP-only cookie)
    const session = await getSession();
    return session?.accessToken ?? null;
  }

  static removeToken() {
    removeCookie(StorageService.TOKEN_KEY);
    // If your server uses 'sid' HTTP-only cookie, call a /logout endpoint to clear it server-side.
  }

  /* ----------------------- USER ----------------------- */

  static setUser(user: Omit<SelectUser, "password">, opts: CookieOptions = { maxAgeSeconds: 60 * 60 * 24 * 7 }) {
    setCookie(StorageService.USER_KEY, JSON.stringify(user), opts);
  }

  static getUser(): Omit<SelectUser, "password"> | null {
    return safeParse<Omit<SelectUser, "password">>(getCookie(StorageService.USER_KEY));
  }

  static removeUser() {
    removeCookie(StorageService.USER_KEY);
  }

  /* ----------------------- TENANT ----------------------- */

  static setTenant(tenant: SelectTenant, opts: CookieOptions = { maxAgeSeconds: 60 * 60 * 24 * 7 }) {
    setCookie(StorageService.TENANT_KEY, JSON.stringify(tenant), opts);
  }

  static getTenant(): SelectTenant | null {
    return safeParse<SelectTenant>(getCookie(StorageService.TENANT_KEY));
  }

  static removeTenant() {
    removeCookie(StorageService.TENANT_KEY);
  }

  /* ----------------------- TENANT LIST ----------------------- */

  static setTenantList(tenantList: SelectTenant[], opts: CookieOptions = { maxAgeSeconds: 60 * 60 * 24 * 7 }) {
    setCookie(StorageService.TENANT_LIST_KEY, JSON.stringify(tenantList), opts);
  }

  static getTenantList(): SelectTenant[] | null {
    return safeParse<SelectTenant[]>(getCookie(StorageService.TENANT_LIST_KEY));
  }

  static removeTenantList() {
    removeCookie(StorageService.TENANT_LIST_KEY);
  }

  /* ----------------------- OWNER USER ----------------------- */

  static setOwnerUser(owner: { id: number; name: string; email: string }, opts: CookieOptions = { maxAgeSeconds: 60 * 60 * 24 * 7 }) {
    setCookie(StorageService.OWNER_USER_KEY, JSON.stringify(owner), opts);
  }

  static getOwnerUser(): { id: number; name: string; email: string } | null {
    return safeParse<{ id: number; name: string; email: string }>(getCookie(StorageService.OWNER_USER_KEY));
  }

  static removeOwnerUser() {
    removeCookie(StorageService.OWNER_USER_KEY);
  }

  /* ----------------------- CLEAR ALL ----------------------- */

  /**
   * Clears ALL cookies — calls /api/logout to expire the httpOnly session
   * cookie via Set-Cookie headers, then removes client-side cookies.
   */
  static async clearAll(): Promise<{ success: boolean }> {
    // 1. Hit the API route to expire the httpOnly session cookie
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Failed to call /api/logout:", e);
    }

    // 2. Remove client-side cookies
    StorageService.removeToken();
    StorageService.removeUser();
    StorageService.removeTenant();
    StorageService.removeTenantList();
    StorageService.removeOwnerUser();

    return { success: true };
  }

  /* ----------------------- AUTH CHECK ----------------------- */

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return Boolean(token);
  }
}
