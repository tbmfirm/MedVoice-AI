import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    // Check for NextAuth session cookie
    // NextAuth v5 uses different cookie names depending on environment
    const sessionCookie = 
      request.cookies.get('next-auth.session-token') || 
      request.cookies.get('__Secure-next-auth.session-token') ||
      request.cookies.get('authjs.session-token') ||
      request.cookies.get('__Secure-authjs.session-token');

    // If no session cookie, redirect to login
    // Use request origin to maintain ngrok URL
    if (!sessionCookie) {
      // Get origin from various sources (ngrok sets x-forwarded-host)
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
      const origin = request.headers.get('origin') || 
                     (forwardedHost ? `${forwardedProto}://${forwardedHost}` : null) ||
                     request.nextUrl.origin;
      
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: Role checking is handled in page components via getServerSession
    // Middleware just ensures a session exists
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
