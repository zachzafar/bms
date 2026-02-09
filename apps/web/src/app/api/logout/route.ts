import { NextResponse } from "next/server";

export async function POST() {
  const domain = process.env.DOMAIN || "app.bookos.xyz";

  // Build Set-Cookie headers that expire the session cookie.
  // We try multiple domain variants to guarantee the browser matches
  // whichever form it stored (.app.bookos.xyz vs app.bookos.xyz).
  const cookieHeaders = [
    // With domain (as originally set in createSession)
    `session=; Path=/; Domain=${domain}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`,
    // With dot-prefixed domain (how browsers actually store it)
    `session=; Path=/; Domain=.${domain}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`,
    // Without domain (fallback)
    `session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`,
  ];

  const response = NextResponse.json({ success: true });

  for (const header of cookieHeaders) {
    response.headers.append("Set-Cookie", header);
  }

  return response;
}
