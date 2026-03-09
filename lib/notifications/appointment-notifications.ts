import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import {
  sendAppointmentConfirmation as sendSMSConfirmation,
  sendAppointmentSMS,
} from '@/lib/sms/sender';
import {
  formatDateForSMS,
  formatTimeForSMS,
  formatAddressForSMS,
  type AppointmentTemplateData,
} from '@/lib/sms/templates';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send appointment confirmation SMS and email
 */
export async function sendAppointmentConfirmation(
  appointmentId: string
): Promise<{ smsSuccess: boolean; emailSuccess: boolean; errors?: string[] }> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        location: true,
        organization: true,
        appointmentType: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const errors: string[] = [];
    let smsSuccess = false;
    let emailSuccess = false;

    // Send SMS confirmation
    if (appointment.patient.phone) {
      try {
        const smsResult = await sendSMSConfirmation(appointmentId);
        smsSuccess = smsResult.success;
        if (!smsResult.success) {
          errors.push(`SMS: ${smsResult.error || 'Failed to send SMS'}`);
        }
      } catch (error) {
        errors.push(`SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send email confirmation
    if (appointment.patient.email) {
      try {
        const doctorName = appointment.providerName ||
          (appointment.createdBy
            ? `${appointment.createdBy.firstName} ${appointment.createdBy.lastName}`
            : 'Your provider');

        const emailResult = await sendAppointmentConfirmationEmail(
          appointment.patient.email,
          {
            patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            clinicName: appointment.organization.practiceName || appointment.organization.name,
            doctorName,
            locationName: appointment.location.name,
            address: formatAddressForSMS(
              appointment.location.address,
              appointment.location.city,
              appointment.location.state,
              appointment.location.zipCode
            ),
            date: formatDateForSMS(appointment.scheduledAt),
            time: formatTimeForSMS(appointment.scheduledAt),
            confirmationCode: appointment.confirmationCode || '',
            appointmentType: appointment.appointmentType?.name || appointment.appointmentType || 'Appointment',
            duration: appointment.duration,
          }
        );
        emailSuccess = emailResult.success;
        if (!emailResult.success) {
          errors.push(`Email: ${emailResult.error || 'Failed to send email'}`);
        }
      } catch (error) {
        errors.push(`Email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update appointment reminder status
    if (smsSuccess) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
      });
    }

    return {
      smsSuccess,
      emailSuccess,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    return {
      smsSuccess: false,
      emailSuccess: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Send appointment reminder (24 hours before)
 */
export async function sendAppointmentReminder(
  appointmentId: string
): Promise<{ smsSuccess: boolean; emailSuccess: boolean; errors?: string[] }> {
  try {
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

    // Check if reminder already sent
    if (appointment.reminderSent) {
      return {
        smsSuccess: true,
        emailSuccess: true,
      };
    }

    const errors: string[] = [];
    let smsSuccess = false;
    let emailSuccess = false;

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
    };

    // Send SMS reminder
    if (appointment.patient.phone) {
      try {
        const smsResult = await sendAppointmentSMS({
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          organizationId: appointment.organizationId,
          locationId: appointment.locationId,
          phoneNumber: appointment.patient.phone,
          messageType: 'reminder',
          templateData,
        });
        smsSuccess = smsResult.success;
        if (!smsResult.success) {
          errors.push(`SMS: ${smsResult.error || 'Failed to send SMS'}`);
        }
      } catch (error) {
        errors.push(`SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send email reminder
    if (appointment.patient.email) {
      try {
        const emailResult = await sendAppointmentReminderEmail(
          appointment.patient.email,
          templateData
        );
        emailSuccess = emailResult.success;
        if (!emailResult.success) {
          errors.push(`Email: ${emailResult.error || 'Failed to send email'}`);
        }
      } catch (error) {
        errors.push(`Email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update reminder status
    if (smsSuccess || emailSuccess) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
      });
    }

    return {
      smsSuccess,
      emailSuccess,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return {
      smsSuccess: false,
      emailSuccess: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Send appointment cancellation notification
 */
export async function sendAppointmentCancellation(
  appointmentId: string,
  reason?: string
): Promise<{ smsSuccess: boolean; emailSuccess: boolean; errors?: string[] }> {
  try {
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

    const errors: string[] = [];
    let smsSuccess = false;
    let emailSuccess = false;

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
    };

    // Send SMS cancellation
    if (appointment.patient.phone) {
      try {
        const smsResult = await sendAppointmentSMS({
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          organizationId: appointment.organizationId,
          locationId: appointment.locationId,
          phoneNumber: appointment.patient.phone,
          messageType: 'cancellation',
          templateData,
        });
        smsSuccess = smsResult.success;
        if (!smsResult.success) {
          errors.push(`SMS: ${smsResult.error || 'Failed to send SMS'}`);
        }
      } catch (error) {
        errors.push(`SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send email cancellation
    if (appointment.patient.email) {
      try {
        const emailResult = await sendAppointmentCancellationEmail(
          appointment.patient.email,
          templateData,
          reason
        );
        emailSuccess = emailResult.success;
        if (!emailResult.success) {
          errors.push(`Email: ${emailResult.error || 'Failed to send email'}`);
        }
      } catch (error) {
        errors.push(`Email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      smsSuccess,
      emailSuccess,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error sending appointment cancellation:', error);
    return {
      smsSuccess: false,
      emailSuccess: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Send appointment confirmation email
 */
async function sendAppointmentConfirmationEmail(
  to: string,
  data: {
    patientName: string;
    clinicName: string;
    doctorName: string;
    locationName: string;
    address: string;
    date: string;
    time: string;
    confirmationCode: string;
    appointmentType: string;
    duration: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          Appointment Confirmed
        </h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>Your appointment has been confirmed. Here are the details:</p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Clinic:</strong> ${data.clinicName}</li>
            <li style="margin: 10px 0;"><strong>Doctor:</strong> ${data.doctorName}</li>
            <li style="margin: 10px 0;"><strong>Location:</strong> ${data.locationName}</li>
            <li style="margin: 10px 0;"><strong>Address:</strong> ${data.address}</li>
            <li style="margin: 10px 0;"><strong>Date:</strong> ${data.date}</li>
            <li style="margin: 10px 0;"><strong>Time:</strong> ${data.time}</li>
            <li style="margin: 10px 0;"><strong>Type:</strong> ${data.appointmentType}</li>
            <li style="margin: 10px 0;"><strong>Duration:</strong> ${data.duration} minutes</li>
            <li style="margin: 10px 0;"><strong>Confirmation Code:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${data.confirmationCode}</code></li>
          </ul>
          <p style="margin-top: 20px;">Please save this confirmation code for your records.</p>
        </div>
      </div>
    `;

    const text = `
Appointment Confirmed

Dear ${data.patientName},

Your appointment has been confirmed. Here are the details:

Clinic: ${data.clinicName}
Doctor: ${data.doctorName}
Location: ${data.locationName}
Address: ${data.address}
Date: ${data.date}
Time: ${data.time}
Type: ${data.appointmentType}
Duration: ${data.duration} minutes
Confirmation Code: ${data.confirmationCode}

Please save this confirmation code for your records.
    `.trim();

    const result = await resend.emails.send({
      from: 'MedVoice AI <onboarding@resend.dev>',
      to: [to],
      subject: `Appointment Confirmed - ${data.clinicName}`,
      html,
      text,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send appointment reminder email
 */
async function sendAppointmentReminderEmail(
  to: string,
  data: AppointmentTemplateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          Appointment Reminder
        </h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>This is a reminder that you have an appointment:</p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Clinic:</strong> ${data.clinicName}</li>
            <li style="margin: 10px 0;"><strong>Doctor:</strong> ${data.doctorName}</li>
            <li style="margin: 10px 0;"><strong>Location:</strong> ${data.locationName}</li>
            <li style="margin: 10px 0;"><strong>Date:</strong> ${data.date}</li>
            <li style="margin: 10px 0;"><strong>Time:</strong> ${data.time}</li>
          </ul>
          <p style="margin-top: 20px;">We look forward to seeing you!</p>
        </div>
      </div>
    `;

    const text = `
Appointment Reminder

Dear ${data.patientName},

This is a reminder that you have an appointment:

Clinic: ${data.clinicName}
Doctor: ${data.doctorName}
Location: ${data.locationName}
Date: ${data.date}
Time: ${data.time}

We look forward to seeing you!
    `.trim();

    const result = await resend.emails.send({
      from: 'MedVoice AI <onboarding@resend.dev>',
      to: [to],
      subject: `Appointment Reminder - ${data.clinicName}`,
      html,
      text,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send appointment cancellation email
 */
async function sendAppointmentCancellationEmail(
  to: string,
  data: AppointmentTemplateData,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
          Appointment Cancelled
        </h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>Your appointment has been cancelled:</p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Clinic:</strong> ${data.clinicName}</li>
            <li style="margin: 10px 0;"><strong>Doctor:</strong> ${data.doctorName}</li>
            <li style="margin: 10px 0;"><strong>Date:</strong> ${data.date}</li>
            <li style="margin: 10px 0;"><strong>Time:</strong> ${data.time}</li>
            ${reason ? `<li style="margin: 10px 0;"><strong>Reason:</strong> ${reason}</li>` : ''}
          </ul>
          ${data.clinicPhone ? `<p style="margin-top: 20px;">If you need to reschedule, please call us at ${data.clinicPhone}.</p>` : '<p style="margin-top: 20px;">If you need to reschedule, please contact us.</p>'}
        </div>
      </div>
    `;

    const text = `
Appointment Cancelled

Dear ${data.patientName},

Your appointment has been cancelled:

Clinic: ${data.clinicName}
Doctor: ${data.doctorName}
Date: ${data.date}
Time: ${data.time}
${reason ? `Reason: ${reason}\n` : ''}
${data.clinicPhone ? `If you need to reschedule, please call us at ${data.clinicPhone}.` : 'If you need to reschedule, please contact us.'}
    `.trim();

    const result = await resend.emails.send({
      from: 'MedVoice AI <onboarding@resend.dev>',
      to: [to],
      subject: `Appointment Cancelled - ${data.clinicName}`,
      html,
      text,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
