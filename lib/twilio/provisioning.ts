import { twilioClient } from './client';
import { prisma } from '@/lib/db';
import { formatPhoneNumber } from './client';

export interface ProvisionNumberResult {
  phoneNumber: string;
  phoneNumberSid: string;
  success: boolean;
  error?: string;
}

/**
 * Provision a Twilio phone number for a clinic
 * Searches for a local number by area code and purchases it
 */
export async function provisionClinicNumber(
  organizationId: string,
  areaCode?: string
): Promise<ProvisionNumberResult> {
  if (!twilioClient) {
    return {
      phoneNumber: '',
      phoneNumberSid: '',
      success: false,
      error: 'Twilio client not initialized',
    };
  }

  try {
    // Get organization to find area code from location if not provided
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        locations: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!organization) {
      return {
        phoneNumber: '',
        phoneNumberSid: '',
        success: false,
        error: 'Organization not found',
      };
    }

    // Extract area code from location phone or use provided area code
    let searchAreaCode = areaCode;
    if (!searchAreaCode && organization.locations.length > 0) {
      const locationPhone = organization.locations[0].phone;
      if (locationPhone) {
        // Extract area code from phone number (assuming US format)
        const digits = locationPhone.replace(/\D/g, '');
        if (digits.length >= 10) {
          searchAreaCode = digits.slice(-10, -7); // Get area code from last 10 digits
        }
      }
    }

    // Search for available phone numbers
    const searchParams: any = {
      voiceEnabled: true,
      smsEnabled: true,
      limit: 10,
    };

    if (searchAreaCode) {
      searchParams.areaCode = searchAreaCode;
    } else {
      // If no area code, search in US
      searchParams.inRegion = 'US';
    }

    const availableNumbers = await twilioClient.availablePhoneNumbers('US').local.list(searchParams);

    if (availableNumbers.length === 0) {
      return {
        phoneNumber: '',
        phoneNumberSid: '',
        success: false,
        error: 'No available phone numbers found',
      };
    }

    // Purchase the first available number
    const numberToPurchase = availableNumbers[0];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const webhookUrl = `${appUrl}/api/twilio/voice`;

    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: numberToPurchase.phoneNumber,
      voiceUrl: webhookUrl,
      voiceMethod: 'POST',
      smsUrl: `${appUrl}/api/twilio/sms/webhook`,
      smsMethod: 'POST',
      statusCallback: `${appUrl}/api/twilio/voice/status`,
      statusCallbackMethod: 'POST',
    });

    // Update organization with provisioned number
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        twilioPhoneNumber: formatPhoneNumber(purchasedNumber.phoneNumber),
        twilioNumberSid: purchasedNumber.sid,
      },
    });

    return {
      phoneNumber: formatPhoneNumber(purchasedNumber.phoneNumber),
      phoneNumberSid: purchasedNumber.sid,
      success: true,
    };
  } catch (error) {
    console.error('Error provisioning clinic number:', error);
    return {
      phoneNumber: '',
      phoneNumberSid: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
