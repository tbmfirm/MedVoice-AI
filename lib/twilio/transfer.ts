import { twilioClient, updateCall } from './client';
import { isWithinWorkingHours } from '@/lib/utils/working-hours';
import { prisma } from '@/lib/db';
import type { CallContext } from '@/lib/ai/providers/base';

export type TransferReason = 
  | 'user_requested'
  | 'low_confidence'
  | 'complex_question'
  | 'emergency'
  | 'other';

export interface TransferResult {
  success: boolean;
  transferred: boolean;
  method: 'call' | 'voicemail' | 'callback';
  message?: string;
  error?: string;
}

/**
 * Handle smart call transfer
 */
export async function handleTransfer(
  callSid: string,
  context: CallContext,
  reason: TransferReason
): Promise<TransferResult> {
  try {
    // Get organization settings
    const organization = await prisma.organization.findUnique({
      where: { id: context.organizationId },
      include: {
        settings: true,
        locations: context.locationId ? {
          where: { id: context.locationId },
        } : false,
      },
    });

    if (!organization) {
      return {
        success: false,
        transferred: false,
        method: 'voicemail',
        error: 'Organization not found',
      };
    }

    const location = context.locationId
      ? organization.locations.find(l => l.id === context.locationId)
      : null;

    // Check working hours
    const isWorkingHours = await isWithinWorkingHours(
      context.organizationId,
      context.locationId
    );

    const settings = organization.settings;
    const transferNumber = location?.phone || organization.phone;

    if (!transferNumber) {
      return {
        success: false,
        transferred: false,
        method: 'voicemail',
        error: 'No transfer number configured',
      };
    }

    // Determine transfer method based on working hours and settings
    if (isWorkingHours) {
      // Transfer to clinic line
      return await transferToClinic(callSid, transferNumber);
    } else {
      // Off-hours: offer voicemail or callback based on settings
      const afterHoursRouting = settings?.afterHoursRouting || 'voicemail';
      
      if (afterHoursRouting === 'voicemail') {
        return await offerVoicemail(callSid);
      } else if (afterHoursRouting === 'ai_agent') {
        // Continue with AI agent
        return {
          success: true,
          transferred: false,
          method: 'call',
          message: 'Continuing with AI agent (off-hours)',
        };
      } else {
        // Forward to number (could be after-hours line)
        return await transferToClinic(callSid, transferNumber);
      }
    }
  } catch (error) {
    console.error('Error handling transfer:', error);
    return {
      success: false,
      transferred: false,
      method: 'voicemail',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Transfer call to clinic phone number
 */
async function transferToClinic(
  callSid: string,
  phoneNumber: string
): Promise<TransferResult> {
  try {
    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const transferUrl = `${baseUrl}/api/twilio/voice/transfer?phone=${encodeURIComponent(phoneNumber)}`;

    await updateCall(callSid, transferUrl, 'POST');

    // Log transfer to database
    await logTransfer(callSid, phoneNumber, 'call');

    return {
      success: true,
      transferred: true,
      method: 'call',
      message: `Transferred to ${phoneNumber}`,
    };
  } catch (error) {
    console.error('Error transferring call:', error);
    return {
      success: false,
      transferred: false,
      method: 'voicemail',
      error: error instanceof Error ? error.message : 'Transfer failed',
    };
  }
}

/**
 * Offer voicemail option
 */
async function offerVoicemail(callSid: string): Promise<TransferResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const voicemailUrl = `${baseUrl}/api/twilio/voice/voicemail`;

    await updateCall(callSid, voicemailUrl, 'POST');

    await logTransfer(callSid, null, 'voicemail');

    return {
      success: true,
      transferred: false,
      method: 'voicemail',
      message: 'Offering voicemail option',
    };
  } catch (error) {
    console.error('Error offering voicemail:', error);
    return {
      success: false,
      transferred: false,
      method: 'voicemail',
      error: error instanceof Error ? error.message : 'Voicemail setup failed',
    };
  }
}

/**
 * Log transfer to database
 */
async function logTransfer(
  callSid: string,
  transferTarget: string | null,
  method: string
) {
  try {
    const call = await prisma.call.findFirst({
      where: {
        callSid: callSid,
      },
    });

    if (call) {
      await prisma.call.update({
        where: { id: call.id },
        data: {
          notes: `Transferred via ${method}${transferTarget ? ` to ${transferTarget}` : ''}`,
          outcome: 'transferred',
        },
      });
    }
  } catch (error) {
    console.error('Error logging transfer:', error);
    // Don't throw - logging failure shouldn't break transfer
  }
}
