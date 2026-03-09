import { NextRequest, NextResponse } from 'next/server';
import { verifyTwilioSignature } from '@/lib/twilio/client';
import { handlePortStatusWebhook } from '@/lib/twilio/porting';

/**
 * Handle Twilio port status webhooks
 * POST /api/twilio/porting/status
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
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

    // Extract port status data from webhook
    const portRequestId = formData.get('PortRequestId') as string;
    const status = formData.get('Status') as string;
    const phoneNumber = formData.get('PhoneNumber') as string;
    const twilioSid = formData.get('PhoneNumberSid') as string;
    const failureReason = formData.get('FailureReason') as string;

    if (!portRequestId) {
      return new NextResponse('PortRequestId required', { status: 400 });
    }

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      'pending': 'port_pending',
      'in-progress': 'port_pending',
      'completed': 'ported',
      'failed': 'port_failed',
      'cancelled': 'port_failed',
    };

    const mappedStatus = statusMap[status.toLowerCase()] || status.toLowerCase();

    // Handle port status update
    await handlePortStatusWebhook({
      portRequestId,
      status: mappedStatus,
      phoneNumber,
      twilioSid,
      failureReason,
    });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling port status webhook:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
