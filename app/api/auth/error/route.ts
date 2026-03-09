import { NextRequest, NextResponse } from 'next/server';

/**
 * Error handler for NextAuth
 * Redirects to login page with error message
 * Uses the request origin to maintain ngrok URL
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  // Get origin from various sources (ngrok sets x-forwarded-host)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const origin = request.headers.get('origin') || 
                 (forwardedHost ? `${forwardedProto}://${forwardedHost}` : null) ||
                 request.nextUrl.origin;
  
  console.log('[Auth Error] Redirecting to login with origin:', origin);
  
  const loginUrl = new URL('/login', origin);
  
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  
  return NextResponse.redirect(loginUrl);
}
