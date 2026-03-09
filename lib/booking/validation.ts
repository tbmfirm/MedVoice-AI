import { isSlotAvailable } from './availability';

/**
 * Validate time slot is still available
 */
export async function validateTimeSlot(
  organizationId: string,
  doctorId: string,
  locationId: string,
  datetime: Date,
  duration: number
): Promise<{ valid: boolean; error?: string }> {
  const available = await isSlotAvailable(
    organizationId,
    doctorId,
    locationId,
    datetime,
    duration
  );

  if (!available) {
    return {
      valid: false,
      error: 'This time slot is no longer available. Please select another time.',
    };
  }

  return { valid: true };
}

/**
 * Validate patient information
 */
export interface PatientInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
}

export function validatePatientInfo(data: PatientInfo): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.firstName?.trim()) {
    errors.push('First name is required');
  }

  if (!data.lastName?.trim()) {
    errors.push('Last name is required');
  }

  if (!data.phone?.trim()) {
    errors.push('Phone number is required');
  } else {
    // Basic phone validation (remove non-digits and check length)
    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    }
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date of birth format');
    } else if (dob > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate doctor schedule entry
 */
export interface ScheduleEntry {
  dayOfWeek: string;
  locationId?: string | null;
  locationName?: string | null;
  startTime: string;
  endTime: string;
  isAlternating?: boolean;
  note?: string | null;
}

export function validateDoctorSchedule(schedule: ScheduleEntry): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  if (!validDays.includes(schedule.dayOfWeek)) {
    errors.push(`Invalid day of week. Must be one of: ${validDays.join(', ')}`);
  }

  if (schedule.startTime !== 'CLOSED' && schedule.endTime !== 'CLOSED') {
    // Validate time format
    const timeRegex = /^(\d{1,2}):(\d{2})(AM|PM)$/i;
    if (!timeRegex.test(schedule.startTime)) {
      errors.push('Invalid start time format. Use format: "10:00AM"');
    }
    if (!timeRegex.test(schedule.endTime)) {
      errors.push('Invalid end time format. Use format: "6:00PM"');
    }

    // Validate start < end
    if (schedule.startTime !== 'CLOSED' && schedule.endTime !== 'CLOSED') {
      // Simple string comparison for same period
      // For more accurate validation, parse to minutes
      const startMatch = schedule.startTime.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
      const endMatch = schedule.endTime.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);

      if (startMatch && endMatch) {
        let startHours = parseInt(startMatch[1], 10);
        let endHours = parseInt(endMatch[1], 10);
        const startPeriod = startMatch[3].toUpperCase();
        const endPeriod = endMatch[3].toUpperCase();

        if (startPeriod === 'PM' && startHours !== 12) startHours += 12;
        if (startPeriod === 'AM' && startHours === 12) startHours = 0;
        if (endPeriod === 'PM' && endHours !== 12) endHours += 12;
        if (endPeriod === 'AM' && endHours === 12) endHours = 0;

        if (startHours >= endHours && startPeriod === endPeriod) {
          errors.push('Start time must be before end time');
        }
      }
    }
  }

  if (!schedule.locationId && !schedule.locationName && schedule.startTime !== 'CLOSED') {
    errors.push('Either locationId or locationName must be provided (or set to CLOSED)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
