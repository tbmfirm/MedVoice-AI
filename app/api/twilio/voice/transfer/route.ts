import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

/**
 * Handle call transfer - redirects call to specified phone number
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const phone = request.nextUrl.searchParams.get('phone');

    if (!phone) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Transfer failed. No phone number provided.</Say><Hangup /></Response>',
        {
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    // Return TwiML to dial the transfer number
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please hold while we transfer you.</Say>
  <Dial>
    <Number>${phone}</Number>
  </Dial>
  <Say>The transfer failed. Please call back.</Say>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in transfer route:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Transfer error occurred.</Say><Hangup /></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
        status: 500,
      }
    );
  }
}
