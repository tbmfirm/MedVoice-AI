import { prisma } from '@/lib/db';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  no_show: [], // Terminal state
};

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(
  from: AppointmentStatus,
  to: AppointmentStatus
): boolean {
  if (from === to) {
    return true; // No change
  }

  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

/**
 * Update appointment status with validation
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    const currentStatus = appointment.status as AppointmentStatus;

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
      };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: newStatus,
      },
    });

    // Log status change in audit log
    await prisma.auditLog.create({
      data: {
        organizationId: appointment.organizationId,
        action: 'update',
        resourceType: 'appointment',
        resourceId: appointmentId,
        userId: userId || null,
        changes: {
          status: {
            from: currentStatus,
            to: newStatus,
          },
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check for booking conflicts (same doctor, overlapping time)
 */
export async function checkBookingConflict(
  organizationId: string,
  doctorId: string,
  scheduledAt: Date,
  duration: number,
  excludeAppointmentId?: string
): Promise<{ hasConflict: boolean; conflictingAppointment?: any }> {
  const startTime = new Date(scheduledAt);
  const endTime = new Date(scheduledAt);
  endTime.setMinutes(endTime.getMinutes() + duration);

  const where: any = {
    organizationId,
    providerId: doctorId,
    scheduledAt: {
      gte: startTime,
      lt: endTime,
    },
    status: {
      notIn: ['cancelled', 'no_show'],
    },
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const conflictingAppointment = await prisma.appointment.findFirst({
    where,
  });

  return {
    hasConflict: !!conflictingAppointment,
    conflictingAppointment: conflictingAppointment || undefined,
  };
}
