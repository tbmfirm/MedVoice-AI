import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioWebhookWithParams } from '@/lib/twilio/validate';
import { updateCallLog } from '@/lib/calls/logger';
import twilio from 'twilio';

/**
 * Handle when staff doesn't answer the call
 * POST /api/twilio/no-answer
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate Twilio signature
    const signature = request.headers.get('x-twilio-signature');
    const url = request.url;
    
    if (signature && process.env.NODE_ENV === 'production') {
      const isValid = validateTwilioWebhookWithParams(signature, url, params);
      if (!isValid) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const callSid = params.CallSid;
    const dialCallStatus = params.DialCallStatus; // completed, no-answer, busy, failed, canceled

    if (!callSid) {
      return new NextResponse('Missing CallSid', { status: 400 });
    }

    const twiml = new twilio.twiml.VoiceResponse();

    // Check DialCallStatus
    if (dialCallStatus === 'completed') {
      // Staff answered - hang up (call is already connected)
      twiml.hangup();
      
      // Update call log
      updateCallLog(callSid, {
        status: 'completed',
        answeredBy: 'staff',
        answeredAt: new Date(),
      }).catch((error) => {
        console.error('Error updating call log (async):', error);
      });
    } else {
      // No answer, busy, failed, or canceled - redirect to AI handler
      twiml.redirect('/api/twilio/ai-handler');
      
      // Update call log
      updateCallLog(callSid, {
        status: dialCallStatus === 'no-answer' ? 'no-answer' : 'failed',
      }).catch((error) => {
        console.error('Error updating call log (async):', error);
      });
    }

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in no-answer webhook:', error);
    // Redirect to AI handler on error
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.redirect('/api/twilio/ai-handler');
    
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
