/**
 * Number forwarding utilities for clinics that can't port numbers
 * This is a fallback option when number porting is not possible
 */

import { prisma } from '@/lib/db';

export interface ForwardingConfig {
  originalNumber: string; // Clinic's existing number (not in Twilio)
  forwardingNumber: string; // Twilio number that receives forwarded calls
  organizationId: string;
  locationId?: string;
}

/**
 * Set up number forwarding configuration
 */
export async function setupNumberForwarding(
  config: ForwardingConfig
): Promise<void> {
  // Create or update phone number record with forwarding status
  const normalizedNumber = config.originalNumber.replace(/[+\s-()]/g, '');

  await prisma.phoneNumber.upsert({
    where: {
      phoneNumber: normalizedNumber,
    },
    create: {
      phoneNumber: normalizedNumber,
      organizationId: config.organizationId,
      locationId: config.locationId,
      portStatus: 'forwarding',
      numberSource: 'forwarded',
      isActive: true,
      purpose: 'voice_sms',
      notes: `Forwarding to ${config.forwardingNumber}`,
    },
    update: {
      portStatus: 'forwarding',
      numberSource: 'forwarded',
      isActive: true,
      notes: `Forwarding to ${config.forwardingNumber}`,
    },
  });
}

/**
 * Route call based on forwarding number or caller ID
 * This is used when calls come through forwarding
 */
export async function routeForwardedCall(
  forwardingNumber: string,
  callerId?: string
): Promise<{ organizationId?: string; locationId?: string } | null> {
  // Find phone number by forwarding number
  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      OR: [
        { phoneNumber: forwardingNumber.replace(/[+\s-()]/g, '') },
        { phoneNumber: forwardingNumber },
        { notes: { contains: forwardingNumber } },
      ],
      portStatus: 'forwarding',
      isActive: true,
    },
  });

  if (phoneNumber) {
    return {
      organizationId: phoneNumber.organizationId || undefined,
      locationId: phoneNumber.locationId || undefined,
    };
  }

  return null;
}
