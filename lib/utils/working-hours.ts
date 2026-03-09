import { prisma } from '@/lib/db';
import type { BusinessHours } from '@/lib/types';

/**
 * Check if current time is within working hours for an organization or location
 */
export async function isWithinWorkingHours(
  organizationId: string,
  locationId?: string
): Promise<boolean> {
  try {
    // Get organization settings
    const orgSettings = await prisma.organizationSettings.findUnique({
      where: { organizationId },
    });

    // Get location if specified
    let location = null;
    if (locationId) {
      location = await prisma.location.findUnique({
        where: { id: locationId },
      });
    }

    // Use location business hours if available, otherwise use org settings
    const businessHours = (location?.businessHours as BusinessHours) || 
                         (orgSettings?.businessHours as BusinessHours);
    const timezone = location?.timezone || orgSettings?.timezone || 'America/New_York';

    if (!businessHours) {
      // Default to 9 AM - 5 PM Monday-Friday if no hours set
      return isDefaultWorkingHours(timezone);
    }

    const now = new Date();
    const dayName = getDayName(now, timezone);
    const dayHours = businessHours[dayName.toLowerCase()];

    if (!dayHours || dayHours.closed) {
      return false;
    }

    const currentTime = getCurrentTimeInTimezone(timezone);
    const openTime = parseTime(dayHours.open);
    const closeTime = parseTime(dayHours.close);

    return currentTime >= openTime && currentTime <= closeTime;
  } catch (error) {
    console.error('Error checking working hours:', error);
    // Default to false on error (conservative approach)
    return false;
  }
}

/**
 * Get current time in specified timezone
 */
function getCurrentTimeInTimezone(timezone: string): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get day name in specified timezone
 */
function getDayName(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if current time is within default working hours (9 AM - 5 PM, Mon-Fri)
 */
function isDefaultWorkingHours(timezone: string): boolean {
  const now = new Date();
  const dayName = getDayName(now, timezone);
  const dayOfWeek = now.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });

  // Only Monday-Friday
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (!weekdays.includes(dayOfWeek)) {
    return false;
  }

  const currentTime = getCurrentTimeInTimezone(timezone);
  const openTime = parseTime('09:00');
  const closeTime = parseTime('17:00');
  const currentMinutes = parseTime(currentTime);

  return currentMinutes >= openTime && currentMinutes <= closeTime;
}

/**
 * Get next available working time
 */
export async function getNextWorkingTime(
  organizationId: string,
  locationId?: string
): Promise<Date> {
  const now = new Date();
  const timezone = await getTimezone(organizationId, locationId);

  // Start checking from now
  let checkDate = new Date(now);
  checkDate.setHours(9, 0, 0, 0); // Start of day

  // Check up to 7 days ahead
  for (let i = 0; i < 7; i++) {
    const testDate = new Date(checkDate);
    testDate.setDate(checkDate.getDate() + i);

    if (await isWithinWorkingHours(organizationId, locationId)) {
      return testDate;
    }
  }

  // Fallback: return tomorrow at 9 AM
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow;
}

/**
 * Get timezone for organization or location
 */
async function getTimezone(organizationId: string, locationId?: string): Promise<string> {
  const orgSettings = await prisma.organizationSettings.findUnique({
    where: { organizationId },
  });

  if (locationId) {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });
    if (location?.timezone) {
      return location.timezone;
    }
  }

  return orgSettings?.timezone || 'America/New_York';
}
