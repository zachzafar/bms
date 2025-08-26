import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 🚨 Ensure it does NOT apply to static assets
  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Check for token in URL params (cross-domain auth)
  const token = req.nextUrl.searchParams.get('token');
  const tenantId = req.nextUrl.searchParams.get('tenant');

  if (token && tenantId) {
    // Token present, allow access (will be validated by the hook)
    return NextResponse.next();
  }

  // Check for session cookie
  const session = req.cookies.get("session")?.value;
  
  if (!session) {
    // No session, redirect to auth app
    const authUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bookos.xyz/login'
      : 'http://localhost:3002/login';
    
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)', 
}