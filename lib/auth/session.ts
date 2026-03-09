import { authOptions } from './config';
import { prisma } from '@/lib/db';
import { cookies, headers } from 'next/headers';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName: string | null;
}

/**
 * Get the current session (server-side)
 * For NextAuth v5, we use the internal session API endpoint
 * NextAuth v5 uses encrypted sessions, not plain JWTs
 */
export async function getServerAuthSession() {
  try {
    // Get cookies and headers to pass to NextAuth
    const cookieStore = await cookies();
    const headersList = await headers();
    
    // Build cookie header string
    const cookieHeader = cookieStore
      .getAll()
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    // Get the origin - try multiple sources
    let origin = process.env.NEXTAUTH_URL;
    
    if (!origin) {
      const forwardedHost = headersList.get('x-forwarded-host');
      const forwardedProto = headersList.get('x-forwarded-proto') || 'https';
      if (forwardedHost) {
        origin = `${forwardedProto}://${forwardedHost}`;
      } else {
        const host = headersList.get('host');
        if (host) {
          origin = `${forwardedProto}://${host}`;
        } else {
          origin = 'http://localhost:3000';
        }
      }
    }

    // Call NextAuth's session endpoint internally
    const sessionUrl = `${origin}/api/auth/session`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Session] Fetching session from:', sessionUrl);
    }

    const response = await fetch(sessionUrl, {
      headers: {
        Cookie: cookieHeader,
        // Pass through important headers
        'x-forwarded-host': headersList.get('x-forwarded-host') || '',
        'x-forwarded-proto': headersList.get('x-forwarded-proto') || 'https',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Session] Session endpoint returned:', response.status, response.statusText);
      }
      return null;
    }

    const session = await response.json();

    if (!session || !session.user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Session] No session or user in response:', session);
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Session] Successfully retrieved session:', {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      });
    }

    return session;
  } catch (error) {
    console.error('[Session] Error getting server session:', error);
    return null;
  }
}

/**
 * Get the current user with full details (server-side)
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return null;
  }
  return session.user as SessionUser;
}

/**
 * Require authentication (server-side)
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }
  return user;
}

/**
 * Require specific role (server-side)
 * Throws error if user doesn't have the role
 */
export async function requireRole(role: string): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error(`Forbidden: ${role} role required`);
  }
  return user;
}

/**
 * Require admin role (server-side)
 * Throws error if user is not an admin
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin role required');
  }
  return user;
}

/**
 * Get user's organization ID, handling super admin case
 */
export function getUserOrganizationId(user: SessionUser | null): string | null {
  if (!user) return null;
  
  // Super admin case - return null to indicate "all organizations"
  if (user.role === 'admin' && (!user.organizationId || user.organizationId === 'SUPER_ADMIN')) {
    return null;
  }
  
  return user.organizationId;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' && (!user.organizationId || user.organizationId === 'SUPER_ADMIN');
}
