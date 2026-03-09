import { NextRequest, NextResponse } from 'next/server';
import { detectIntent } from '@/lib/ai/intent-detector';

/**
 * Handle speech input from Twilio Gather
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult') as string;
    const callSid = formData.get('CallSid') as string;

    if (!speechResult) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>I didn\'t catch that. Please try again.</Say><Redirect>/api/twilio/voice/incoming</Redirect></Response>',
        {
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    // Detect intent from speech
    const intent = await detectIntent(speechResult);

    // Handle based on intent
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let response = '';

    switch (intent.intent) {
      case 'book':
        response = `<Say>I can help you schedule an appointment. Let me gather some information.</Say>
        <Gather input="speech" action="${baseUrl}/api/twilio/voice/book" method="POST">
          <Say>What date and time would work for you?</Say>
        </Gather>`;
        break;
      case 'cancel':
        response = `<Say>I can help you cancel your appointment.</Say>
        <Gather input="speech" action="${baseUrl}/api/twilio/voice/cancel" method="POST">
          <Say>What is the date of the appointment you'd like to cancel?</Say>
        </Gather>`;
        break;
      case 'transfer':
        response = `<Say>Let me transfer you to our staff.</Say>
        <Redirect>${baseUrl}/api/twilio/voice/transfer</Redirect>`;
        break;
      default:
        response = `<Say>I understand you said: ${speechResult}. How can I help you further?</Say>
        <Gather input="speech" action="${baseUrl}/api/twilio/voice/gather" method="POST" />`;
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${response}
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error handling gather:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>I encountered an error. Please try again.</Say></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
        status: 500,
      }
    );
  }
}
