import { NextRequest, NextResponse } from 'next/server';
import { verifyTwilioSignature } from '@/lib/twilio/client';
import { prisma } from '@/lib/db';

/**
 * Handle Twilio SMS delivery status webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const errorCode = formData.get('ErrorCode') as string | null;

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

    if (!messageSid) {
      return new NextResponse('MessageSid required', { status: 400 });
    }

    // Find SMS log by message SID
    const smsLog = await prisma.sMSLog.findFirst({
      where: {
        messageSid: messageSid,
      },
    });

    if (!smsLog) {
      console.warn(`SMS log not found for message SID: ${messageSid}`);
      return new NextResponse('OK', { status: 200 });
    }

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      'queued': 'sent',
      'sending': 'sent',
      'sent': 'sent',
      'delivered': 'delivered',
      'undelivered': 'failed',
      'failed': 'failed',
    };

    const newStatus = statusMap[messageStatus] || messageStatus;

    // Update SMS log
    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (newStatus === 'failed' || newStatus === 'undelivered') {
      updateData.failedAt = new Date();
      if (errorCode) {
        updateData.errorCode = errorCode;
      }
    }

    await prisma.sMSLog.update({
      where: { id: smsLog.id },
      data: updateData,
    });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling SMS status webhook:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
