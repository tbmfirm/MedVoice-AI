import { NextRequest, NextResponse } from 'next/server';
import { verifyTwilioSignature } from '@/lib/twilio/client';
import { handleInboundCall } from '@/lib/ai/call-handler';
import type { CallContext, AudioStream } from '@/lib/ai/providers/base';
import { prisma } from '@/lib/db';
import { findPatientByPhone } from '@/lib/utils/db-helpers';
import { findClinicByPhoneNumber } from '@/lib/utils/phone-routing';

/**
 * Handle inbound Twilio voice calls
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data from Twilio
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const accountSid = formData.get('AccountSid') as string;

    // Verify Twilio signature (in production)
    const signature = request.headers.get('x-twilio-signature');
    const url = request.url;
    
    if (signature && process.env.NODE_ENV === 'production') {
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      const isValid = verifyTwilioSignature(url, params, signature);
      if (!isValid) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    // Find clinic by phone number using phone routing utility
    const routingResult = await findClinicByPhoneNumber(to);

    if (!routingResult) {
      // Return TwiML to say organization not found
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, we could not find your clinic. Please contact support.</Say></Response>',
        {
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    const { organization, location, phoneNumberId } = routingResult;

    // Find patient by phone number
    const patient = await findPatientByPhone(from.replace('+', ''), organization.id);

    // Create call record with phone number tracking
    if (phoneNumberId) {
      // Track which phone number received the call
      await prisma.call.create({
        data: {
          organizationId: organization.id,
          locationId: location?.id,
          patientId: patient?.id,
          phoneNumberId: phoneNumberId,
          phoneNumberRaw: from.replace('+', ''),
          callSid,
          direction: 'inbound',
          status: 'initiated',
          startedAt: new Date(),
        },
      });
    }

    // Create call context
    const context: CallContext = {
      organizationId: organization.id,
      locationId: location?.id,
      patientId: patient?.id,
      phoneNumber: from,
      callSid,
      language: 'en-US',
    };

    // Create a simple audio stream placeholder
    // In production, this would handle actual audio streaming
    const audioStream: AudioStream = {
      onData: () => {},
      onEnd: () => {},
      write: () => {},
      end: () => {},
    };

    // Handle the call (async - don't wait)
    handleInboundCall(context, audioStream).catch(error => {
      console.error('Error in call handler:', error);
    });

    // Return TwiML to start the call
    // This would typically connect to OpenAI Realtime API via WebSocket
    // For MVP, we'll return a simple response
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, thank you for calling. How can I help you today?</Say>
  <Gather input="speech" action="${baseUrl}/api/twilio/voice/gather" method="POST" speechTimeout="auto">
    <Say>Please tell me how I can assist you.</Say>
  </Gather>
  <Say>I didn't catch that. Please call back or visit our website.</Say>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error handling incoming call:', error);
    
    // Return error TwiML
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, we encountered an error. Please try again later.</Say></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
        status: 500,
      }
    );
  }
}
