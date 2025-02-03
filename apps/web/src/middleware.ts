import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/api/session';
// import { authMiddleware } from './lib/authMiddleware';

export async function middleware(req: NextRequest) {
//   const protectedRoutes = ['/dashboard', '/profile', '/settings'];

//   if (protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
//     return authMiddleware(req);
//   }


   const session = await getSessionFromRequest(req);
    if (!session) {
      const url = req.nextUrl.clone()
        url.pathname = '/login'
    
        return NextResponse.redirect(url)
    }

    return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard(.*)',]
}