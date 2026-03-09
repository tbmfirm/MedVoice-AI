import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle voicemail recording
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;

    // Store voicemail recording URL in database
    // Find call and update with recording URL
    // This would be implemented with proper call lookup

    // Return TwiML to record voicemail
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please leave a message after the tone. Press the pound key when finished.</Say>
  <Record 
    action="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/twilio/voice/voicemail/complete"
    method="POST"
    finishOnKey="#"
    maxLength="120"
    recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/twilio/voice/voicemail/status"
  />
  <Say>We did not receive your recording. Goodbye.</Say>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in voicemail route:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voicemail error occurred.</Say><Hangup /></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
        status: 500,
      }
    );
  }
}
