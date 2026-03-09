import { sendSMS } from '@/lib/twilio/client';
import { prisma } from '@/lib/db';
import type { MessageType } from './templates';
import { getSMSTemplate, formatDateForSMS, formatTimeForSMS, formatAddressForSMS } from './templates';
import type { AppointmentTemplateData } from './templates';

/**
 * Get clinic phone number for SMS sending
 * Priority: location primary → org primary → location any → org any → default
 */
async function getClinicPhoneNumber(
  organizationId: string,
  locationId?: string
): Promise<string | null> {
  // Try location primary phone number first
  if (locationId) {
    const locationPhone = await prisma.phoneNumber.findFirst({
      where: {
        locationId,
        isPrimary: true,
        isActive: true,
        purpose: {
          in: ['sms', 'voice_sms'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (locationPhone && locationPhone.phoneNumber) {
      return locationPhone.phoneNumber;
    }

    // Try any location phone number
    const anyLocationPhone = await prisma.phoneNumber.findFirst({
      where: {
        locationId,
        isActive: true,
        purpose: {
          in: ['sms', 'voice_sms'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (anyLocationPhone && anyLocationPhone.phoneNumber) {
      return anyLocationPhone.phoneNumber;
    }
  }

  // Try organization primary phone number
  const orgPhone = await prisma.phoneNumber.findFirst({
    where: {
      organizationId,
      isPrimary: true,
      isActive: true,
      purpose: {
        in: ['sms', 'voice_sms'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (orgPhone && orgPhone.phoneNumber) {
    return orgPhone.phoneNumber;
  }

  // Try any organization phone number
  const anyOrgPhone = await prisma.phoneNumber.findFirst({
    where: {
      organizationId,
      isActive: true,
      purpose: {
        in: ['sms', 'voice_sms'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (anyOrgPhone && anyOrgPhone.phoneNumber) {
    return anyOrgPhone.phoneNumber;
  }

  // Fallback to legacy phone fields
  if (locationId) {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });
    if (location?.phone) {
      return location.phone;
    }
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (organization?.phone) {
    return organization.phone;
  }

  // Final fallback to default Twilio number
  return process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER || null;
}

export interface SendSMSOptions {
  appointmentId?: string;
  patientId?: string;
  organizationId?: string;
  locationId?: string;
  phoneNumber: string;
  messageType: MessageType;
  templateData: AppointmentTemplateData;
  retryCount?: number;
}

export interface SendSMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  smsLogId?: string;
}

/**
 * Send SMS with tracking and error handling
 */
export async function sendAppointmentSMS(
  options: SendSMSOptions
): Promise<SendSMSResult> {
  const {
    appointmentId,
    patientId,
    organizationId,
    phoneNumber,
    messageType,
    templateData,
    retryCount = 0,
  } = options;

  try {
    // Generate message from template
    const message = getSMSTemplate(messageType, templateData);

    // Get sender phone number (clinic's number if available)
    let fromNumber: string | null = null;
    if (organizationId) {
      fromNumber = await getClinicPhoneNumber(organizationId, options.locationId);
    }
    
    // Fallback to default Twilio number
    if (!fromNumber) {
      fromNumber = process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER;
    }
    
    if (!fromNumber) {
      throw new Error('No phone number available for SMS sending');
    }

    // Check if SMS was already sent (prevent duplicates)
    if (appointmentId) {
      const existingSMS = await prisma.sMSLog.findFirst({
        where: {
          appointmentId,
          messageType: 'confirmation',
          status: {
            in: ['sent', 'delivered'],
          },
        },
      });

      if (existingSMS) {
        return {
          success: true,
          messageSid: existingSMS.messageSid || undefined,
          smsLogId: existingSMS.id,
        };
      }
    }

    // Get status callback URL for delivery tracking
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const statusCallback = `${baseUrl}/api/twilio/sms/status`;

    // Send SMS via Twilio
    const twilioMessage = await sendSMS(phoneNumber, fromNumber, message, {
      statusCallback,
    });

    // Get phone number record for tracking
    const phoneNumberRecord = await prisma.phoneNumber.findFirst({
      where: {
        phoneNumber: fromNumber.replace(/[+\s-()]/g, ''),
        OR: [
          { phoneNumber: fromNumber },
          { phoneNumber: `+${fromNumber.replace(/[+\s-()]/g, '')}` },
        ],
      },
    });

    // Create SMS log entry
    const smsLog = await prisma.sMSLog.create({
      data: {
        appointmentId,
        patientId,
        organizationId,
        fromPhoneNumberId: phoneNumberRecord?.id,
        phoneNumber,
        message,
        messageType,
        status: 'sent',
        messageSid: twilioMessage.sid,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      messageSid: twilioMessage.sid,
      smsLogId: smsLog.id,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);

    // Log failed SMS attempt
    try {
      const smsLog = await prisma.sMSLog.create({
        data: {
          appointmentId,
          patientId,
          organizationId,
          phoneNumber,
          message: getSMSTemplate(messageType, templateData),
          messageType,
          status: 'failed',
          errorCode: error instanceof Error ? error.name : 'UnknownError',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date(),
        },
      });

      // Retry logic (max 2 retries)
      if (retryCount < 2) {
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return sendAppointmentSMS({
          ...options,
          retryCount: retryCount + 1,
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        smsLogId: smsLog.id,
      };
    } catch (logError) {
      console.error('Error logging failed SMS:', logError);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Send confirmation SMS for an appointment
 */
export async function sendAppointmentConfirmation(
  appointmentId: string
): Promise<SendSMSResult> {
  try {
    // Get appointment with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        location: {
          include: {
            organization: true,
          },
        },
        organization: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (!appointment.patient.phone) {
      throw new Error('Patient phone number not available');
    }

    // Get clinic phone number for template
    const clinicPhone = await getClinicPhoneNumber(
      appointment.organizationId,
      appointment.locationId
    );

    // Prepare template data
    const templateData: AppointmentTemplateData = {
      clinicName: appointment.organization.practiceName || appointment.organization.name,
      doctorName: appointment.providerName || 'Your provider',
      locationName: appointment.location.name,
      fullAddress: formatAddressForSMS(
        appointment.location.address,
        appointment.location.city,
        appointment.location.state,
        appointment.location.zipCode
      ),
      date: formatDateForSMS(appointment.scheduledAt),
      time: formatTimeForSMS(appointment.scheduledAt),
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      clinicPhone: clinicPhone || undefined,
    };

    // Send SMS
    return await sendAppointmentSMS({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      organizationId: appointment.organizationId,
      locationId: appointment.locationId,
      phoneNumber: appointment.patient.phone,
      messageType: 'confirmation',
      templateData,
    });
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
