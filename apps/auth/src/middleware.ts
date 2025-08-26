import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/api/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 🚨 Ensure it does NOT apply to static assets
  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Allow access to public pages without authentication
  if (pathname === '/login' || 
      pathname === '/signup' || 
      pathname === '/forgot-password' || 
      pathname.startsWith('/password-reset/')) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const session = await getSessionFromRequest(req);
  
  if (!session) {
    // Redirect to login page if not authenticated
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access login/signup, redirect to home
  if (pathname === '/login' || pathname === '/signup') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
