import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚨 Ensure it does NOT apply to static assets
  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Public paths
  const publicPaths = ['/login', '/forgot-password', '/password-reset', '/customer'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = req.cookies.get("session")?.value;

  if (!session) {
    // Check for token in URL params (legacy/cross-domain support)
    const token = req.nextUrl.searchParams.get('token');
    const tenantId = req.nextUrl.searchParams.get('tenant');

    if (token && tenantId) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based routing
  const userCookie = req.cookies.get("user")?.value;
  let userType: 'user' | 'admin' | 'system' = 'user';

  try {
    if (userCookie) {
      const user = JSON.parse(userCookie);
      userType = user.userType || 'user';
    }
  } catch {
    // ignore
  }

  // Root redirect
  if (pathname === '/') {
    if (userType === 'system') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    if (userType === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // /admin → system only
  if (pathname.startsWith('/admin') && userType !== 'system') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // /dashboard → admin only
  if (pathname.startsWith('/dashboard') && userType !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
