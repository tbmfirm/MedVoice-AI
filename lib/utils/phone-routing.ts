import { prisma } from '@/lib/db';

export interface PhoneRoutingResult {
  organizationId: string;
  organization: any;
  locationId?: string;
  location?: any;
  phoneNumber?: any;
  phoneNumberId?: string;
}

/**
 * Find organization and location by phone number
 * Supports both PhoneNumber model and legacy phone fields
 */
export async function findClinicByPhoneNumber(
  phoneNumber: string
): Promise<PhoneRoutingResult | null> {
  // Normalize phone number (remove + and spaces)
  const normalizedPhone = phoneNumber.replace(/[+\s-()]/g, '');

  // First, try to find in PhoneNumber model
  const phoneNumberRecord = await prisma.phoneNumber.findFirst({
    where: {
      OR: [
        { phoneNumber: normalizedPhone },
        { phoneNumber: phoneNumber }, // Also try with original format
        { phoneNumber: `+${normalizedPhone}` }, // Try with +
      ],
      isActive: true,
    },
    include: {
      organization: {
        include: {
          locations: true,
        },
      },
      location: true,
    },
  });

  if (phoneNumberRecord) {
    return {
      organizationId: phoneNumberRecord.organizationId!,
      organization: phoneNumberRecord.organization,
      locationId: phoneNumberRecord.locationId || undefined,
      location: phoneNumberRecord.location || undefined,
      phoneNumber: phoneNumberRecord,
      phoneNumberId: phoneNumberRecord.id,
    };
  }

  // Fallback to legacy phone fields
  // Try location phone first
  const location = await prisma.location.findFirst({
    where: {
      phone: {
        in: [
          normalizedPhone,
          phoneNumber,
          `+${normalizedPhone}`,
          phoneNumber.replace(/[^0-9]/g, ''), // Digits only
        ],
      },
      isActive: true,
    },
    include: {
      organization: {
        include: {
          locations: true,
        },
      },
    },
  });

  if (location) {
    return {
      organizationId: location.organizationId,
      organization: location.organization,
      locationId: location.id,
      location: location,
    };
  }

  // Try organization phone
  const organization = await prisma.organization.findFirst({
    where: {
      phone: {
        in: [
          normalizedPhone,
          phoneNumber,
          `+${normalizedPhone}`,
          phoneNumber.replace(/[^0-9]/g, ''), // Digits only
        ],
      },
      status: 'active',
    },
    include: {
      locations: true,
    },
  });

  if (organization) {
    return {
      organizationId: organization.id,
      organization: organization,
      locationId: organization.locations[0]?.id,
      location: organization.locations[0] || undefined,
    };
  }

  return null;
}

/**
 * Get phone number record by phone number string
 */
export async function getPhoneNumberByNumber(
  phoneNumber: string
): Promise<any | null> {
  const normalizedPhone = phoneNumber.replace(/[+\s-()]/g, '');

  return await prisma.phoneNumber.findFirst({
    where: {
      OR: [
        { phoneNumber: normalizedPhone },
        { phoneNumber: phoneNumber },
        { phoneNumber: `+${normalizedPhone}` },
      ],
    },
    include: {
      organization: true,
      location: true,
    },
  });
}
