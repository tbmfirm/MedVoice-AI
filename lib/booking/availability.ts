import { prisma } from '@/lib/db';
import {
  getDoctorScheduleForDay,
  handleLocationAll,
  handleAlternatingWeeks,
} from '@/lib/doctors/schedule';
import { parseTimeToMinutes, formatMinutesToTime, getWeekNumber } from '@/lib/booking/utils';

export interface AvailableSlot {
  time: string; // "10:00", "10:30", etc.
  available: boolean;
  datetime: Date; // Full datetime for this slot
}

/**
 * Get available time slots for a doctor on a specific date
 */
export async function getAvailableSlots(
  organizationId: string,
  doctorId: string,
  locationId: string,
  date: Date,
  appointmentTypeId?: string
): Promise<AvailableSlot[]> {
  // Get appointment type duration
  let duration = 30; // default 30 minutes
  if (appointmentTypeId) {
    const appointmentType = await prisma.appointmentType.findUnique({
      where: { id: appointmentTypeId },
    });
    if (appointmentType) {
      duration = appointmentType.duration;
    }
  }

  // Get day of week
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = dayNames[date.getDay()];

  // Get doctor's schedule for this day
  const schedules = await getDoctorScheduleForDay(doctorId, dayOfWeek, locationId);

  if (schedules.length === 0) {
    return []; // No schedule = no availability
  }

  // Get existing appointments for this doctor on this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      providerId: doctorId,
      locationId,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        notIn: ['cancelled', 'no_show'],
      },
    },
    select: {
      scheduledAt: true,
      duration: true,
    },
  });

  // Generate time slots from schedules
  const availableSlots: AvailableSlot[] = [];
  const slotInterval = 15; // 15-minute intervals for slot generation

  for (const schedule of schedules) {
    // Skip closed days
    if (schedule.startTime === 'CLOSED' || schedule.endTime === 'CLOSED') {
      continue;
    }

    // Check alternating weeks
    if (schedule.isAlternating && !handleAlternatingWeeks(schedule, date)) {
      continue;
    }

    // Check location
    if (!handleLocationAll(schedule, locationId)) {
      continue;
    }

    const startMinutes = parseTimeToMinutes(schedule.startTime);
    const endMinutes = parseTimeToMinutes(schedule.endTime);

    if (startMinutes === null || endMinutes === null) {
      continue;
    }

    // Generate slots in the schedule window
    for (let slotMinutes = startMinutes; slotMinutes + duration <= endMinutes; slotMinutes += slotInterval) {
      const slotDateTime = new Date(date);
      slotDateTime.setHours(Math.floor(slotMinutes / 60), slotMinutes % 60, 0, 0);

      // Check if slot conflicts with existing appointments
      const slotEndMinutes = slotMinutes + duration;
      let isAvailable = true;

      for (const appointment of existingAppointments) {
        const apptStart = new Date(appointment.scheduledAt);
        const apptStartMinutes = apptStart.getHours() * 60 + apptStart.getMinutes();
        const apptEndMinutes = apptStartMinutes + (appointment.duration || 30);

        // Check for overlap
        if (
          (slotMinutes >= apptStartMinutes && slotMinutes < apptEndMinutes) ||
          (slotEndMinutes > apptStartMinutes && slotEndMinutes <= apptEndMinutes) ||
          (slotMinutes <= apptStartMinutes && slotEndMinutes >= apptEndMinutes)
        ) {
          isAvailable = false;
          break;
        }
      }

      // Only add slot if it's in the future (or allow past for admin)
      if (slotDateTime >= new Date() || true) { // Allow past for now, can be configurable
        availableSlots.push({
          time: formatMinutesToTime(slotMinutes).replace(/AM|PM/i, '').trim(),
          available: isAvailable,
          datetime: slotDateTime,
        });
      }
    }
  }

  // Sort by time
  availableSlots.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  return availableSlots;
}

/**
 * Get doctors available on a date at a location
 */
export async function getAvailableDoctors(
  organizationId: string,
  locationId: string,
  date: Date,
  appointmentTypeId?: string
): Promise<Array<{ id: string; firstName: string; lastName: string; hasAvailability: boolean }>> {
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = dayNames[date.getDay()];

  // Get all doctors with schedules for this day/location
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

  // Check availability for each doctor
  const doctors = await Promise.all(
    schedules.map(async (schedule) => {
      const slots = await getAvailableSlots(
        organizationId,
        schedule.doctorId,
        locationId,
        date,
        appointmentTypeId
      );
      return {
        id: schedule.doctor.id,
        firstName: schedule.doctor.firstName,
        lastName: schedule.doctor.lastName,
        hasAvailability: slots.some(s => s.available),
      };
    })
  );

  return doctors.filter(d => d.hasAvailability);
}

/**
 * Check if a specific slot is available
 */
export async function isSlotAvailable(
  organizationId: string,
  doctorId: string,
  locationId: string,
  datetime: Date,
  duration: number
): Promise<boolean> {
  // Check doctor schedule first
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = dayNames[datetime.getDay()];

  const schedules = await getDoctorScheduleForDay(doctorId, dayOfWeek, locationId);
  const appointmentTime = datetime.getHours() * 60 + datetime.getMinutes();
  const appointmentEndTime = appointmentTime + duration;

  let inSchedule = false;
  for (const schedule of schedules) {
    if (schedule.startTime === 'CLOSED' || schedule.endTime === 'CLOSED') {
      continue;
    }

    if (schedule.isAlternating && !handleAlternatingWeeks(schedule, datetime)) {
      continue;
    }

    if (!handleLocationAll(schedule, locationId)) {
      continue;
    }

    const startMinutes = parseTimeToMinutes(schedule.startTime);
    const endMinutes = parseTimeToMinutes(schedule.endTime);

    if (startMinutes !== null && endMinutes !== null) {
      if (appointmentTime >= startMinutes && appointmentEndTime <= endMinutes) {
        inSchedule = true;
        break;
      }
    }
  }

  if (!inSchedule) {
    return false;
  }

  // Check for conflicting appointments
  const startOfSlot = new Date(datetime);
  const endOfSlot = new Date(datetime);
  endOfSlot.setMinutes(endOfSlot.getMinutes() + duration);

  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      organizationId,
      providerId: doctorId,
      locationId,
      scheduledAt: {
        gte: startOfSlot,
        lt: endOfSlot,
      },
      status: {
        notIn: ['cancelled', 'no_show'],
      },
    },
  });

  return !conflictingAppointment;
}

/**
 * Get dates with availability in a date range
 */
export async function getAvailableDates(
  organizationId: string,
  doctorId: string,
  locationId: string,
  startDate: Date,
  endDate: Date,
  appointmentTypeId?: string
): Promise<Array<{ date: string; hasAvailability: boolean }>> {
  const dates: Array<{ date: string; hasAvailability: boolean }> = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const slots = await getAvailableSlots(
      organizationId,
      doctorId,
      locationId,
      new Date(currentDate),
      appointmentTypeId
    );

    dates.push({
      date: currentDate.toISOString().split('T')[0],
      hasAvailability: slots.some(s => s.available),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
