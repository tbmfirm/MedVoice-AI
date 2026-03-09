import { twilioClient } from './client';
import { prisma } from '@/lib/db';

export interface PortRequestData {
  phoneNumber: string;
  accountNumber: string;
  accountName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  authorizedContactName: string;
  authorizedContactPhone: string;
  authorizedContactEmail: string;
  pin?: string;
  accountPin?: string;
}

/**
 * Check if a phone number is eligible for porting
 */
export async function validatePortEligibility(
  phoneNumber: string
): Promise<{ eligible: boolean; reason?: string }> {
  if (!twilioClient) {
    return { eligible: false, reason: 'Twilio client not initialized' };
  }

  try {
    // Twilio doesn't have a direct eligibility check API
    // We can try to get the number info, or just return eligible
    // In practice, you'd submit the port request and Twilio will validate
    return { eligible: true };
  } catch (error) {
    console.error('Error validating port eligibility:', error);
    return {
      eligible: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Initiate a number port request via Twilio API
 */
export async function initiatePortRequest(
  phoneNumber: string,
  portData: PortRequestData
): Promise<{ portRequestId: string; status: string }> {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    // Note: Twilio's IncomingPhoneNumber API doesn't directly support porting
    // Porting is typically done through Twilio's Porting API or Console
    // For MVP, we'll create a port request record and mark it as requested
    // In production, you'd use Twilio's Porting API or initiate via Console
    
    // Store port request in database
    const phoneNumberRecord = await prisma.phoneNumber.findFirst({
      where: {
        phoneNumber: phoneNumber.replace(/[+\s-()]/g, ''),
        OR: [
          { phoneNumber: phoneNumber },
          { phoneNumber: `+${phoneNumber.replace(/[+\s-()]/g, '')}` },
        ],
      },
    });

    if (!phoneNumberRecord) {
      throw new Error('Phone number not found in database');
    }

    // Generate a port request ID (in production, this would come from Twilio)
    const portRequestId = `PR${Date.now()}`;

    // Update phone number with port request info
    await prisma.phoneNumber.update({
      where: { id: phoneNumberRecord.id },
      data: {
        portStatus: 'port_requested',
        portRequestId,
        portRequestedAt: new Date(),
        numberSource: 'ported',
      },
    });

    // In production, you would:
    // 1. Call Twilio Porting API to initiate the port
    // 2. Store the actual Twilio port request SID
    // 3. Set up webhook to receive port status updates

    return {
      portRequestId,
      status: 'port_requested',
    };
  } catch (error) {
    console.error('Error initiating port request:', error);
    throw error;
  }
}

/**
 * Check port status by port request ID
 */
export async function checkPortStatus(
  portRequestId: string
): Promise<{ status: string; details?: any }> {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    // Find phone number by port request ID
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        portRequestId,
      },
    });

    if (!phoneNumber) {
      throw new Error('Port request not found');
    }

    // In production, you would query Twilio's Porting API
    // For MVP, return the stored status

    return {
      status: phoneNumber.portStatus,
      details: {
        portRequestId: phoneNumber.portRequestId,
        portRequestedAt: phoneNumber.portRequestedAt,
        portCompletedAt: phoneNumber.portCompletedAt,
        portFailureReason: phoneNumber.portFailureReason,
      },
    };
  } catch (error) {
    console.error('Error checking port status:', error);
    throw error;
  }
}

/**
 * Handle Twilio port status webhook
 */
export async function handlePortStatusWebhook(data: {
  portRequestId: string;
  status: string;
  phoneNumber?: string;
  twilioSid?: string;
  failureReason?: string;
}): Promise<void> {
  try {
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        portRequestId: data.portRequestId,
      },
    });

    if (!phoneNumber) {
      console.warn(`Phone number not found for port request: ${data.portRequestId}`);
      return;
    }

    const updateData: any = {
      portStatus: data.status,
    };

    if (data.status === 'ported' && data.twilioSid) {
      updateData.twilioSid = data.twilioSid;
      updateData.portCompletedAt = new Date();
      updateData.isActive = true;
      updateData.verified = true;
    } else if (data.status === 'port_failed') {
      updateData.portFailureReason = data.failureReason || 'Port request failed';
    }

    await prisma.phoneNumber.update({
      where: { id: phoneNumber.id },
      data: updateData,
    });
  } catch (error) {
    console.error('Error handling port status webhook:', error);
    throw error;
  }
}
