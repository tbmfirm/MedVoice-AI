import { NextRequest, NextResponse } from 'next/server';
import { verifyTwilioSignature } from '@/lib/twilio/client';
import { prisma } from '@/lib/db';

/**
 * Handle Twilio call status webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

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

    // Find call by CallSid
    const call = await prisma.call.findFirst({
      where: {
        callSid: callSid,
      },
    });

    if (call) {
      const updates: any = {
        status: mapTwilioStatus(callStatus),
      };

      if (callStatus === 'completed') {
        updates.endedAt = new Date();
        if (callDuration) {
          updates.duration = parseInt(callDuration, 10);
        }
      } else if (callStatus === 'in-progress') {
        updates.answeredAt = new Date();
      }

      await prisma.call.update({
        where: { id: call.id },
        data: updates,
      });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling call status:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

/**
 * Map Twilio call status to our status
 */
function mapTwilioStatus(twilioStatus: string): string {
  const statusMap: Record<string, string> = {
    'queued': 'ringing',
    'ringing': 'ringing',
    'in-progress': 'in_progress',
    'completed': 'completed',
    'busy': 'busy',
    'failed': 'failed',
    'no-answer': 'no_answer',
    'canceled': 'cancelled',
  };

  return statusMap[twilioStatus] || 'initiated';
}
