'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';
import { SessionUser } from './session';

/**
 * Client-side session hook
 */
export function useSession() {
  const { data: session, status } = useNextAuthSession();
  
  return {
    user: session?.user as SessionUser | undefined,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useSession();
  
  if (!isLoading && !isAuthenticated) {
    // This will be handled by middleware, but we can also handle it here
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return { user, isLoading, isAuthenticated };
}

/**
 * Hook to require a specific role
 */
export function useRequireRole(role: string) {
  const { user, isLoading, isAuthenticated } = useRequireAuth();
  
  const hasRole = user?.role === role;
  
  if (!isLoading && isAuthenticated && !hasRole) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login?error=unauthorized';
    }
  }
  
  return { user, isLoading, isAuthenticated, hasRole };
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { user } = useSession();
  return user?.role === 'admin';
}

/**
 * Hook to check if user is super admin
 */
export function useIsSuperAdmin() {
  const { user } = useSession();
  return user?.role === 'admin' && (!user?.organizationId || user.organizationId === 'SUPER_ADMIN');
}
