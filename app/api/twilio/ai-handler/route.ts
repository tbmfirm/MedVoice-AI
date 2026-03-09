import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioWebhookWithParams } from '@/lib/twilio/validate';
import { updateCallLog } from '@/lib/calls/logger';
import twilio from 'twilio';

/**
 * Connect call to ElevenLabs voice stream via Twilio Stream
 * POST /api/twilio/ai-handler
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

    if (!callSid) {
      return new NextResponse('Missing CallSid', { status: 400 });
    }

    // Get ElevenLabs WebSocket URL from environment
    let elevenLabsWsUrl = process.env.ELEVENLABS_WS_URL;
    
    if (!elevenLabsWsUrl) {
      console.error('ELEVENLABS_WS_URL not configured');
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say('We apologize, but our AI service is currently unavailable. Please try again later.');
      twiml.hangup();
      
      return new NextResponse(twiml.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Ensure URL starts with wss://
    if (!elevenLabsWsUrl.startsWith('wss://') && !elevenLabsWsUrl.startsWith('ws://')) {
      elevenLabsWsUrl = `wss://${elevenLabsWsUrl}`;
    }

    // Create TwiML to connect to ElevenLabs stream
    const twiml = new twilio.twiml.VoiceResponse();
    const connect = twiml.connect();
    
    // Add Stream to connect to ElevenLabs WebSocket
    connect.stream({
      url: elevenLabsWsUrl,
      // Optional: Add parameters for the stream
      // parameters: {
      //   callSid: callSid,
      // }
    });

    // Update call log
    updateCallLog(callSid, {
      status: 'in-progress',
      answeredBy: 'ai',
      answeredAt: new Date(),
    }).catch((error) => {
      console.error('Error updating call log (async):', error);
    });

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in AI handler webhook:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('We apologize, but we are experiencing technical difficulties. Please try again later.');
    twiml.hangup();
    
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
