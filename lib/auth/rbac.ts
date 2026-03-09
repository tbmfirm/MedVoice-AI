import { User } from '@prisma/client';

/**
 * Check if user is a super admin
 * Super admin has role "admin" and can view all clinics
 * For now, we'll use a special organizationId check or a flag
 * In the future, you might want to add an isSuperAdmin field to User model
 */
export function isSuperAdmin(user: { role: string; organizationId?: string | null }): boolean {
  // For now, we'll consider a user with role "admin" and no organizationId as super admin
  // Or you can add a special organizationId like "SUPER_ADMIN"
  return user.role === 'admin' && (!user.organizationId || user.organizationId === 'SUPER_ADMIN');
}

/**
 * Check if user can view all clinics
 */
export function canViewAllClinics(user: { role: string; organizationId?: string | null }): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if user can manage a specific clinic
 */
export function canManageClinic(
  user: { role: string; organizationId?: string | null },
  organizationId: string
): boolean {
  // Super admin can manage all clinics
  if (isSuperAdmin(user)) {
    return true;
  }
  
  // Clinic admin and staff can only manage their own clinic
  return user.organizationId === organizationId;
}

/**
 * Check if user can edit an appointment
 */
export function canEditAppointment(
  user: { role: string; organizationId?: string | null },
  appointment: { organizationId: string }
): boolean {
  return canManageClinic(user, appointment.organizationId);
}

/**
 * Check if user can delete an appointment
 */
export function canDeleteAppointment(
  user: { role: string; organizationId?: string | null },
  appointment: { organizationId: string }
): boolean {
  // Only admins can delete appointments
  if (user.role !== 'admin') {
    return false;
  }
  return canManageClinic(user, appointment.organizationId);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(
  user: { role: string; organizationId?: string | null },
  targetOrganizationId?: string
): boolean {
  // Super admin can manage all users
  if (isSuperAdmin(user)) {
    return true;
  }
  
  // Clinic admin can manage users in their clinic
  if (user.role === 'admin' && targetOrganizationId) {
    return user.organizationId === targetOrganizationId;
  }
  
  return false;
}

/**
 * Permission constants
 */
export const PERMISSIONS = {
  VIEW_ALL_CLINICS: 'view_all_clinics',
  MANAGE_CLINIC: 'manage_clinic',
  EDIT_APPOINTMENT: 'edit_appointment',
  DELETE_APPOINTMENT: 'delete_appointment',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
} as const;
