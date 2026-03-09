import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAuth, SessionUser } from './session';
import { canManageClinic, isSuperAdmin } from './rbac';

/**
 * Middleware for API routes that require authentication
 * Returns the authenticated user or null
 */
export async function requireApiAuth(
  request: NextRequest
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        ),
      };
    }
    return { user };
  } catch (error) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Middleware for API routes that require a specific role
 */
export async function requireApiRole(
  request: NextRequest,
  role: string
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const authResult = await requireApiAuth(request);
  if ('error' in authResult) {
    return authResult;
  }

  if (authResult.user.role !== role) {
    return {
      error: NextResponse.json(
        { error: `Forbidden: ${role} role required` },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Middleware for API routes that require admin role
 */
export async function requireApiAdmin(
  request: NextRequest
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  return requireApiRole(request, 'admin');
}

/**
 * Get the authenticated user from API request
 * Returns null if not authenticated (doesn't throw)
 */
export async function getApiUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}

/**
 * Check if user can access organization data
 * For super admin, returns true for any organization
 * For others, checks if organizationId matches
 */
export function canAccessOrganization(
  user: SessionUser,
  organizationId: string | null
): boolean {
  // Super admin can access all organizations
  if (isSuperAdmin(user)) {
    return true;
  }
  
  // Others can only access their own organization
  return user.organizationId === organizationId;
}

/**
 * Build where clause for filtering by organization
 * Returns null for super admin (no filter), or organizationId for others
 */
export function getOrganizationFilter(user: SessionUser): { organizationId: string } | null {
  if (isSuperAdmin(user)) {
    return null; // No filter - can see all
  }
  return { organizationId: user.organizationId };
}
