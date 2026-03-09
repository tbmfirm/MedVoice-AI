import { NextRequest, NextResponse } from 'next/server';
import { verifyTwilioSignature } from '@/lib/twilio/client';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { findClinicByPhoneNumber } from '@/lib/utils/phone-routing';

/**
 * Handle Twilio SMS webhooks with security, logging, and spam prevention
 */
export async function POST(request: NextRequest) {
  let smsLogId: string | null = null;

  try {
    const formData = await request.formData();
    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    // Verify signature in production
    const signature = request.headers.get('x-twilio-signature');
    if (signature && process.env.NODE_ENV === 'production') {
      const url = request.url;
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      const isValid = verifyTwilioSignature(url, params, signature);
      if (!isValid) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const phoneNumber = from.replace('+', '');
    const messageText = body.trim();
    const messageTextUpper = messageText.toUpperCase();

    // Find clinic by phone number using phone routing utility
    const routingResult = await findClinicByPhoneNumber(to);
    
    // Find patient by phone number
    const patient = await prisma.patient.findFirst({
      where: {
        phone: phoneNumber,
      },
      include: {
        organization: true,
      },
    });

    const organizationId = routingResult?.organizationId || patient?.organizationId;
    const organization = routingResult?.organization || patient?.organization;
    const isKnownPatient = !!patient;

    // Log incoming SMS message
    try {
      const smsLog = await prisma.sMSLog.create({
        data: {
          appointmentId: null, // Will be set if processing CANCEL
          patientId: patient?.id,
          organizationId: organizationId || null,
          fromPhoneNumberId: routingResult?.phoneNumberId || null,
          phoneNumber,
          message: messageText,
          messageType: 'incoming',
          status: 'sent', // Will be updated based on processing
          messageSid: messageSid,
        },
      });
      smsLogId = smsLog.id;
    } catch (logError) {
      console.error('Error logging incoming SMS:', logError);
      // Continue processing even if logging fails
    }

    // Rate limiting check (max 5 messages per hour)
    const rateLimit = checkRateLimit(phoneNumber, 5, 60 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      // Update SMS log with rate limit status
      if (smsLogId) {
        await prisma.sMSLog.update({
          where: { id: smsLogId },
          data: {
            status: 'blocked',
            errorCode: 'RATE_LIMIT_EXCEEDED',
            errorMessage: `Rate limit exceeded. Reset at ${rateLimit.resetAt.toISOString()}`,
          },
        });
      }

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You've sent too many messages. Please wait before sending another message or call us for assistance.</Message>
</Response>`;

      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Spam detection: Check for suspicious patterns
    const isSuspicious = detectSpam(messageText, isKnownPatient);
    
    if (isSuspicious) {
      // Update SMS log with spam status
      if (smsLogId) {
        await prisma.sMSLog.update({
          where: { id: smsLogId },
          data: {
            status: 'blocked',
            errorCode: 'SPAM_DETECTED',
            errorMessage: 'Message flagged as potential spam',
          },
        });
      }

      // Don't respond to spam - silent ignore
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    // Check if message is CANCEL
    const isCancelRequest = messageTextUpper === 'CANCEL' || messageTextUpper.startsWith('CANCEL');

    // Process CANCEL request
    if (isCancelRequest) {
      // Only allow cancellation from known patients
      if (!isKnownPatient) {
        // Update SMS log
        if (smsLogId) {
          await prisma.sMSLog.update({
            where: { id: smsLogId },
            data: {
              status: 'processed',
              errorCode: 'UNKNOWN_PATIENT',
              errorMessage: 'CANCEL request from unknown patient',
            },
          });
        }

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>We couldn't find an appointment associated with this number. Please call us to verify your information.</Message>
</Response>`;

        return new NextResponse(twiml, {
          headers: { 'Content-Type': 'text/xml' },
        });
      }

      // Known patient - process cancellation
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          patientId: patient!.id,
          status: {
            in: ['scheduled', 'confirmed'],
          },
          scheduledAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: 1,
      });

      if (upcomingAppointments.length > 0) {
        const appointment = upcomingAppointments[0];
        
        // Cancel the appointment
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'cancelled',
          },
        });

        // Update SMS log with appointment ID
        if (smsLogId) {
          await prisma.sMSLog.update({
            where: { id: smsLogId },
            data: {
              appointmentId: appointment.id,
              status: 'processed',
            },
          });
        }

        console.log(`Appointment ${appointment.id} cancelled via SMS from ${phoneNumber}`);

        // Return TwiML to send confirmation
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Your appointment has been cancelled. If you need to reschedule, please call us.</Message>
</Response>`;

        return new NextResponse(twiml, {
          headers: { 'Content-Type': 'text/xml' },
        });
      }

      // No appointment found for known patient
      if (smsLogId) {
        await prisma.sMSLog.update({
          where: { id: smsLogId },
          data: {
            status: 'processed',
            errorCode: 'NO_APPOINTMENT',
            errorMessage: 'No upcoming appointment found',
          },
        });
      }

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>We couldn't find an upcoming appointment to cancel. Please call us for assistance.</Message>
</Response>`;

      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Not a cancel message - handle based on patient status
    if (smsLogId) {
      await prisma.sMSLog.update({
        where: { id: smsLogId },
        data: {
          status: 'processed',
        },
      });
    }

    // Known patient - friendly response
    if (isKnownPatient) {
      const clinicPhone = patient?.organization?.phone || to;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. For appointment cancellations, reply CANCEL. For other inquiries, please call us at ${clinicPhone}.</Message>
</Response>`;

      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Unknown sender - generic response (no action taken)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>This number is for appointment-related messages only. If you're a patient, please call us. For appointment cancellations, reply CANCEL.</Message>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error handling SMS webhook:', error);

    // Update SMS log with error if we have the ID
    if (smsLogId) {
      try {
        await prisma.sMSLog.update({
          where: { id: smsLogId },
          data: {
            status: 'failed',
            errorCode: 'PROCESSING_ERROR',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date(),
          },
        });
      } catch (updateError) {
        console.error('Error updating SMS log:', updateError);
      }
    }

    return new NextResponse('Error', { status: 500 });
  }
}

/**
 * Detect potential spam messages
 */
function detectSpam(message: string, isKnownPatient: boolean): boolean {
  // Very short messages from unknown senders are suspicious
  if (!isKnownPatient && message.length < 3) {
    return true;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /^[0-9]+$/, // Only numbers
    /^(.)\1+$/, // Repeated single character (e.g., "aaaaa")
    /spam|advertisement|promo/i, // Spam keywords
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  // Very long messages from unknown senders (likely spam)
  if (!isKnownPatient && message.length > 500) {
    return true;
  }

  return false;
}
