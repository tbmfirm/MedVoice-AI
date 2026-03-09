import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// NextAuth v5 beta handler
// Debug: Log what NextAuth returns
const authResult = NextAuth(authOptions);

// Check what type of result we got
let GET: any;
let POST: any;

if (typeof authResult === 'function') {
  // Pattern 2: Direct function export
  console.log('[NextAuth] Handler is a function');
  GET = authResult;
  POST = authResult;
} else if (authResult && typeof authResult === 'object') {
  // Pattern 1 or 4: Object with handlers or GET/POST properties
  if ('handlers' in authResult && authResult.handlers) {
    // Pattern 1: { handlers: { GET, POST } }
    console.log('[NextAuth] Handler has handlers property');
    GET = (authResult as any).handlers.GET;
    POST = (authResult as any).handlers.POST;
  } else if ('GET' in authResult && 'POST' in authResult) {
    // Pattern 4: Direct GET/POST properties
    console.log('[NextAuth] Handler has GET/POST properties');
    GET = (authResult as any).GET;
    POST = (authResult as any).POST;
  } else {
    // Fallback: NextAuth might return a handler function in the object
    // Try to find a callable handler
    console.log('[NextAuth] Handler is object, checking for callable handler');
    const possibleHandler = (authResult as any).handler || (authResult as any).default;
    if (typeof possibleHandler === 'function') {
      GET = possibleHandler;
      POST = possibleHandler;
    } else {
      throw new Error('NextAuth handler object does not contain callable handlers');
    }
  }
} else {
  throw new Error(`NextAuth returned unexpected type: ${typeof authResult}`);
}

// Ensure GET and POST are functions
if (typeof GET !== 'function' || typeof POST !== 'function') {
  console.error('[NextAuth] GET or POST is not a function:', { GET: typeof GET, POST: typeof POST });
  throw new Error('NextAuth handlers are not functions');
}

export { GET, POST };
