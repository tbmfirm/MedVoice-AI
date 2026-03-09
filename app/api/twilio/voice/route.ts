import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioWebhookWithParams } from '@/lib/twilio/validate';
import { prisma } from '@/lib/db';
import { isWithinBusinessHours } from '@/lib/clinic/schedule';
import { logCall } from '@/lib/calls/logger';
import { findOrCreatePatientByPhone } from '@/lib/utils/db-helpers';
import twilio from 'twilio';

/**
 * Main voice webhook handler for Twilio call forwarding
 * POST /api/twilio/voice
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Voice webhook called ===');
    
    // Parse form data
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log('Params received:', { CallSid: params.CallSid, From: params.From, To: params.To });

    // Validate Twilio signature
    const signature = request.headers.get('x-twilio-signature');
    const url = request.url;
    
    if (signature && process.env.NODE_ENV === 'production') {
      const isValid = validateTwilioWebhookWithParams(signature, url, params);
      if (!isValid) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    // Extract call details
    const callSid = params.CallSid;
    const from = params.From;
    const to = params.To; // This is the Twilio number that received the call

    if (!callSid || !from || !to) {
      console.error('Missing required parameters:', { callSid, from, to });
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    console.log('Looking for organization with twilioPhoneNumber:', to);

    // Look up organization by Twilio phone number
    const organization = await prisma.organization.findFirst({
      where: {
        twilioPhoneNumber: to,
      },
      include: {
        clinicSchedule: true,
      },
    });

    console.log('Organization found:', !!organization);
    console.log('Has schedule:', !!organization?.clinicSchedule);

    if (!organization) {
      console.error(`Organization not found for Twilio number: ${to}`);
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Look up or create patient by phone number
    let patientId: string | undefined;
    try {
      const patient = await findOrCreatePatientByPhone(
        from, // Caller's phone number
        organization.id,
        {
          createIfNotFound: true, // Auto-create patient if not found
          defaultFirstName: 'Unknown',
          defaultLastName: 'Caller',
        }
      );
      
      if (patient) {
        patientId = patient.id;
        console.log('Patient found/created:', patient.id, `${patient.firstName} ${patient.lastName}`);
      }
    } catch (error) {
      console.error('Error finding/creating patient:', error);
      // Don't fail the call if patient lookup fails
    }

    // Log call immediately (async to not block response)
    logCall({
      callSid,
      organizationId: organization.id,
      from,
      to,
      patientId,
      status: 'initiated',
      startedAt: new Date(),
    }).catch((error) => {
      console.error('Error logging call (async):', error);
    });

    // Get clinic schedule
    const schedule = organization.clinicSchedule;

    if (!schedule) {
      // No schedule configured - default to AI
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.redirect('/api/twilio/ai-handler');
      
      return new NextResponse(twiml.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Determine routing based on callRoutingMode
    console.log('Creating TwiML response...');
    const twiml = new twilio.twiml.VoiceResponse();
    const routingMode = schedule.callRoutingMode || 'business_hours_staff';
    console.log('Routing mode:', routingMode);

    switch (routingMode) {
      case 'immediate_ai':
        // Always route to AI immediately
        twiml.redirect('/api/twilio/ai-handler');
        break;

      case 'business_hours_staff': {
        // During business hours: try staff first, then AI. Outside hours: AI immediately
        console.log('Checking business hours...');
        let withinHours = false;
        try {
          withinHours = isWithinBusinessHours(schedule);
          console.log('Within business hours:', withinHours);
        } catch (error) {
          console.error('Error checking business hours:', error);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
          // Default to AI on error
          withinHours = false;
        }
        
        console.log('Staff phone number:', organization.staffPhoneNumber);
        if (withinHours && organization.staffPhoneNumber) {
          console.log('Dialing staff number:', organization.staffPhoneNumber);
          try {
            // Dial staff with timeout
            const dial = twiml.dial({
              timeout: schedule.aiRingTimeout || 20,
              action: '/api/twilio/no-answer',
              callerId: organization.phone || to, // Use clinic's original number or Twilio number as fallback
            });
            dial.number(organization.staffPhoneNumber);
            console.log('Dial command added successfully');
          } catch (error) {
            console.error('Error creating dial command:', error);
            twiml.redirect('/api/twilio/ai-handler');
          }
        } else {
          console.log('Outside hours or no staff number - redirecting to AI');
          // Outside hours or no staff number - go to AI
          twiml.redirect('/api/twilio/ai-handler');
        }
        break;
      }

      case 'business_hours_ai':
        // Always AI (business hours check not needed for routing, but can be logged)
        twiml.redirect('/api/twilio/ai-handler');
        break;

      case 'always_staff':
        // Always try staff first, then AI
        if (organization.staffPhoneNumber) {
          const dial = twiml.dial({
            timeout: schedule.aiRingTimeout || 20,
            action: '/api/twilio/no-answer',
            callerId: organization.phone || to,
          });
          dial.number(organization.staffPhoneNumber);
        } else {
          // No staff number - go to AI
          twiml.redirect('/api/twilio/ai-handler');
        }
        break;

      default:
        // Default to business_hours_staff behavior
        const withinHours = isWithinBusinessHours(schedule);
        
        if (withinHours && organization.staffPhoneNumber) {
          const dial = twiml.dial({
            timeout: schedule.aiRingTimeout || 20,
            action: '/api/twilio/no-answer',
            callerId: organization.phone || to,
          });
          dial.number(organization.staffPhoneNumber);
        } else {
          twiml.redirect('/api/twilio/ai-handler');
        }
    }

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('=== ERROR IN VOICE WEBHOOK ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    // Return valid TwiML even on error
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('We apologize, but we are experiencing technical difficulties. Please try again later.');
    twiml.hangup();
    
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
