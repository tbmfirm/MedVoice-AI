/**
 * SMS message templates for appointment confirmations and notifications
 */

export type MessageType = 'confirmation' | 'reminder' | 'cancellation';

export interface AppointmentTemplateData {
  clinicName: string;
  doctorName: string;
  locationName: string;
  fullAddress: string;
  date: string; // Formatted date
  time: string; // Formatted time
  patientName?: string;
  clinicPhone?: string; // Clinic phone number for contact
}

/**
 * Format date for SMS (e.g., "Monday, January 15, 2024")
 */
export function formatDateForSMS(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for SMS (e.g., "2:00 PM")
 */
export function formatTimeForSMS(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format full address for SMS
 */
export function formatAddressForSMS(
  address: string,
  city: string,
  state: string,
  zipCode: string
): string {
  return `${address}, ${city}, ${state} ${zipCode}`;
}

/**
 * Generate appointment confirmation SMS
 */
export function generateConfirmationSMS(data: AppointmentTemplateData): string {
  const phoneLine = data.clinicPhone 
    ? `Call us at ${data.clinicPhone} if you need to reschedule.\n`
    : '';
  
  return `Your appointment at ${data.clinicName} is confirmed.
Doctor: ${data.doctorName}
Location: ${data.locationName}
Address: ${data.fullAddress}
Date: ${data.date} at ${data.time}
${phoneLine}Reply CANCEL to cancel.`;
}

/**
 * Generate appointment reminder SMS
 */
export function generateReminderSMS(data: AppointmentTemplateData): string {
  const phoneLine = data.clinicPhone 
    ? ` Call us at ${data.clinicPhone} if you need to reschedule.`
    : '';
  
  return `Reminder: You have an appointment at ${data.clinicName} on ${data.date} at ${data.time} with Dr. ${data.doctorName} at ${data.locationName}.${phoneLine} Reply CANCEL to cancel.`;
}

/**
 * Generate appointment cancellation SMS
 */
export function generateCancellationSMS(data: AppointmentTemplateData): string {
  const phoneLine = data.clinicPhone 
    ? ` If you need to reschedule, please call us at ${data.clinicPhone}.`
    : ' If you need to reschedule, please call us.';
  
  return `Your appointment at ${data.clinicName} on ${data.date} at ${data.time} has been cancelled.${phoneLine}`;
}

/**
 * Get SMS template based on message type
 */
export function getSMSTemplate(
  type: MessageType,
  data: AppointmentTemplateData
): string {
  switch (type) {
    case 'confirmation':
      return generateConfirmationSMS(data);
    case 'reminder':
      return generateReminderSMS(data);
    case 'cancellation':
      return generateCancellationSMS(data);
    default:
      return generateConfirmationSMS(data);
  }
}
