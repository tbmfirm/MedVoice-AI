/**
 * Generate unique confirmation code for appointments
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Format appointment time for display
 */
export function formatAppointmentTime(
  date: Date,
  timezone: string = 'America/New_York'
): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Validate booking request data
 */
export interface BookingRequestData {
  patientInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
  };
  doctorId: string;
  locationId: string;
  scheduledAt: string; // ISO datetime string
  appointmentTypeId?: string;
  reason?: string;
}

export function validateBookingRequest(data: BookingRequestData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.patientInfo?.firstName?.trim()) {
    errors.push('First name is required');
  }
  if (!data.patientInfo?.lastName?.trim()) {
    errors.push('Last name is required');
  }
  if (!data.patientInfo?.phone?.trim()) {
    errors.push('Phone number is required');
  }
  if (data.patientInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.patientInfo.email)) {
    errors.push('Invalid email format');
  }
  if (!data.doctorId) {
    errors.push('Doctor selection is required');
  }
  if (!data.locationId) {
    errors.push('Location selection is required');
  }
  if (!data.scheduledAt) {
    errors.push('Appointment date and time is required');
  } else {
    const scheduledDate = new Date(data.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      errors.push('Invalid date/time format');
    } else if (scheduledDate < new Date()) {
      errors.push('Appointment cannot be in the past');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse time string (e.g., "10:00AM") to minutes since midnight
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (timeStr === 'CLOSED') {
    return null;
  }

  const match = timeStr.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to time string (e.g., "10:00AM")
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, '0')}${period}`;
}

/**
 * Get week number for alternating week logic (odd/even)
 * Returns 0 for odd weeks, 1 for even weeks
 */
export function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return weekNumber % 2; // 0 = odd week, 1 = even week
}
