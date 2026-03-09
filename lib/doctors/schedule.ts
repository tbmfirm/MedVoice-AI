import { prisma } from '@/lib/db';
import { parseTimeToMinutes, getWeekNumber } from '@/lib/booking/utils';

export interface DoctorScheduleEntry {
  id: string;
  doctorId: string;
  dayOfWeek: string;
  locationId: string | null;
  locationName: string | null;
  startTime: string;
  endTime: string;
  isAlternating: boolean;
  note: string | null;
}

/**
 * Get all schedule entries for a doctor
 */
export async function getDoctorSchedule(
  doctorId: string,
  organizationId: string
): Promise<DoctorScheduleEntry[]> {
  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId,
      organizationId,
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return schedules;
}

/**
 * Get schedule for a specific day
 */
export async function getDoctorScheduleForDay(
  doctorId: string,
  dayOfWeek: string,
  locationId?: string
): Promise<DoctorScheduleEntry[]> {
  const where: any = {
    doctorId,
    dayOfWeek,
  };

  if (locationId) {
    where.OR = [
      { locationId },
      { locationName: 'ALL' },
    ];
  }

  const schedules = await prisma.doctorSchedule.findMany({
    where,
    orderBy: { startTime: 'asc' },
  });

  return schedules;
}

/**
 * Check if doctor is available at specific time
 */
export async function isDoctorAvailable(
  doctorId: string,
  locationId: string,
  datetime: Date,
  duration: number // minutes
): Promise<boolean> {
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = dayNames[datetime.getDay()];

  // Get doctor's schedule for this day
  const schedules = await getDoctorScheduleForDay(doctorId, dayOfWeek, locationId);

  if (schedules.length === 0) {
    return false;
  }

  const appointmentTime = datetime.getHours() * 60 + datetime.getMinutes();
  const appointmentEndTime = appointmentTime + duration;

  for (const schedule of schedules) {
    // Check if closed
    if (schedule.startTime === 'CLOSED' || schedule.endTime === 'CLOSED') {
      continue;
    }

    // Check alternating weeks
    if (schedule.isAlternating) {
      const weekNum = getWeekNumber(datetime);
      // Assuming ALT means every other week - you may need to adjust logic
      // For now, we'll check if it's an odd week (weekNum === 0)
      // You might want to store which weeks apply in the schedule
    }

    // Check location
    if (schedule.locationName === 'ALL' || schedule.locationId === locationId) {
      const startMinutes = parseTimeToMinutes(schedule.startTime);
      const endMinutes = parseTimeToMinutes(schedule.endTime);

      if (startMinutes !== null && endMinutes !== null) {
        // Check if appointment fits within schedule
        if (appointmentTime >= startMinutes && appointmentEndTime <= endMinutes) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get all doctors working at a location on a specific day
 */
export async function getDoctorsForLocation(
  organizationId: string,
  locationId: string,
  dayOfWeek: string
): Promise<Array<{ id: string; firstName: string; lastName: string }>> {
  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      organizationId,
      dayOfWeek,
      OR: [
        { locationId },
        { locationName: 'ALL' },
      ],
      startTime: { not: 'CLOSED' },
    },
    include: {
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    distinct: ['doctorId'],
  });

  return schedules.map(s => ({
    id: s.doctor.id,
    firstName: s.doctor.firstName,
    lastName: s.doctor.lastName,
  }));
}

/**
 * Handle "ALL" location case - check if schedule applies to all locations
 */
export function handleLocationAll(
  schedule: DoctorScheduleEntry,
  locationId: string
): boolean {
  return schedule.locationName === 'ALL' || schedule.locationId === locationId;
}

/**
 * Handle alternating weeks - check if schedule applies to this date
 */
export function handleAlternatingWeeks(
  schedule: DoctorScheduleEntry,
  date: Date
): boolean {
  if (!schedule.isAlternating) {
    return true; // Always applies if not alternating
  }

  // For alternating weeks, you might want to store which weeks apply
  // For now, we'll use a simple odd/even week check
  const weekNum = getWeekNumber(date);
  // This is a simple implementation - you may need more complex logic
  // based on your requirements (e.g., first/second week of month, etc.)
  return true; // Placeholder - implement based on your needs
}
