import { formatInTimeZone } from 'date-fns-tz';
import type { ClinicSchedule } from '@prisma/client';

/**
 * Get the day name from a date in the clinic's timezone
 */
function getDayName(date: Date, timezone: string): string {
  // Format the date in the clinic's timezone to get the day name
  const dayName = formatInTimeZone(date, timezone, 'EEEE'); // Full day name (Monday, Tuesday, etc.)
  return dayName.toLowerCase();
}

/**
 * Get open/close times for a specific day
 */
export function getDaySchedule(
  schedule: ClinicSchedule,
  dayName: string
): { open: string | null; close: string | null } {
  const day = dayName.toLowerCase();
  const openField = `${day}Open` as keyof ClinicSchedule;
  const closeField = `${day}Close` as keyof ClinicSchedule;
  
  return {
    open: schedule[openField] as string | null,
    close: schedule[closeField] as string | null,
  };
}

/**
 * Check if a day is closed (no open/close times)
 */
export function isDayClosed(schedule: ClinicSchedule, dayName: string): boolean {
  const daySchedule = getDaySchedule(schedule, dayName);
  return daySchedule.open === null || daySchedule.close === null;
}

/**
 * Check if current time is within business hours for a clinic schedule
 * Uses the clinic's timezone - never UTC directly
 */
export function isWithinBusinessHours(schedule: ClinicSchedule): boolean {
  const now = new Date();
  const timezone = schedule.timezone;
  
  // Get current day name in clinic's timezone
  const dayName = getDayName(now, timezone);
  
  // Check if day is closed
  if (isDayClosed(schedule, dayName)) {
    return false;
  }
  
  // Get day schedule
  const daySchedule = getDaySchedule(schedule, dayName);
  
  if (!daySchedule.open || !daySchedule.close) {
    return false;
  }
  
  // Get current time in clinic's timezone (format: HH:mm)
  const currentTime = formatInTimeZone(now, timezone, 'HH:mm');
  
  // Parse times (format: HH:mm)
  const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
  const [openHours, openMinutes] = daySchedule.open.split(':').map(Number);
  const [closeHours, closeMinutes] = daySchedule.close.split(':').map(Number);
  
  // Convert to minutes since midnight for comparison
  const currentMinutesSinceMidnight = currentHours * 60 + currentMinutes;
  const openMinutesSinceMidnight = openHours * 60 + openMinutes;
  const closeMinutesSinceMidnight = closeHours * 60 + closeMinutes;
  
  // Check if current time is within business hours
  return (
    currentMinutesSinceMidnight >= openMinutesSinceMidnight &&
    currentMinutesSinceMidnight <= closeMinutesSinceMidnight
  );
}
