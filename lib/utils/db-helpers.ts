import { prisma } from '@/lib/db';
import type { 
  OrganizationCreateInput,
  LocationCreateInput,
  PatientCreateInput,
  AppointmentCreateInput,
  CallCreateInput,
  CallUpdateInput,
  EMRIntegrationCreateInput
} from '@/lib/types';
import { NotFoundError, DatabaseError } from '@/lib/types';
import { getPhoneNumberByNumber } from './phone-routing';

/**
 * Organization Helpers
 */
export async function getOrganizationById(id: string) {
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      settings: true,
    },
  });

  if (!organization) {
    throw new NotFoundError('Organization', id);
  }

  return organization;
}

export async function createOrganization(data: OrganizationCreateInput) {
  try {
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        specialty: data.specialty,
        practiceName: data.practiceName,
        phone: data.phone,
        email: data.email,
        callVolume: data.callVolume,
        subscriptionTier: data.subscriptionTier || 'essentials',
        status: 'active',
      },
    });

    // Create default settings
    await prisma.organizationSettings.create({
      data: {
        organizationId: organization.id,
      },
    });

    return organization;
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to create organization'
    );
  }
}

/**
 * Location Helpers
 */
export async function getLocationById(id: string, organizationId?: string) {
  const where: any = { id };
  if (organizationId) {
    where.organizationId = organizationId;
  }

  const location = await prisma.location.findFirst({
    where,
    include: {
      organization: true,
    },
  });

  if (!location) {
    throw new NotFoundError('Location', id);
  }

  return location;
}

export async function getLocationsByOrganization(organizationId: string, activeOnly: boolean = true) {
  const where: any = { organizationId };
  if (activeOnly) {
    where.isActive = true;
  }

  return await prisma.location.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function createLocation(data: LocationCreateInput) {
  try {
    return await prisma.location.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        businessHours: data.businessHours,
        timezone: data.timezone,
      },
    });
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to create location'
    );
  }
}

/**
 * User-Location Assignment Helpers
 */
export async function assignUserToLocation(userId: string, locationId: string) {
  return await prisma.userLocation.upsert({
    where: {
      userId_locationId: {
        userId,
        locationId,
      },
    },
    create: {
      userId,
      locationId,
    },
    update: {},
  });
}

export async function removeUserFromLocation(userId: string, locationId: string) {
  return await prisma.userLocation.delete({
    where: {
      userId_locationId: {
        userId,
        locationId,
      },
    },
  });
}

export async function getUserLocations(userId: string) {
  return await prisma.userLocation.findMany({
    where: { userId },
    include: {
      location: {
        include: {
          organization: true,
        },
      },
    },
  });
}

export async function getLocationUsers(locationId: string) {
  return await prisma.userLocation.findMany({
    where: { locationId },
    include: {
      user: true,
    },
  });
}

/**
 * Patient Helpers
 */
export async function getPatientById(id: string, organizationId?: string) {
  const where: any = { id };
  if (organizationId) {
    where.organizationId = organizationId;
  }

  const patient = await prisma.patient.findFirst({
    where,
  });

  if (!patient) {
    throw new NotFoundError('Patient', id);
  }

  return patient;
}

export async function createPatient(data: PatientCreateInput) {
  try {
    return await prisma.patient.create({
      data: {
        organizationId: data.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        emrPatientId: data.emrPatientId,
        medicalRecordNumber: data.medicalRecordNumber,
        primaryLocationId: data.primaryLocationId,
      },
    });
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to create patient'
    );
  }
}

export async function findPatientByPhone(phone: string, organizationId: string) {
  return await prisma.patient.findFirst({
    where: {
      phone,
      organizationId,
    },
  });
}

/**
 * Find or create patient by phone number
 * Normalizes phone number for lookup (handles +1, spaces, etc.)
 */
export async function findOrCreatePatientByPhone(
  phone: string,
  organizationId: string,
  options?: {
    createIfNotFound?: boolean;
    defaultFirstName?: string;
    defaultLastName?: string;
  }
) {
  // Normalize phone number - remove all non-digit characters for comparison
  const normalizePhone = (p: string) => p.replace(/\D/g, '');
  const normalizedPhone = normalizePhone(phone);
  
  // Get all patients for this organization
  const patients = await prisma.patient.findMany({
    where: { organizationId },
  });
  
  // Find by normalized phone (handles +1, spaces, dashes, etc.)
  let patient = patients.find(p => normalizePhone(p.phone) === normalizedPhone);
  
  // If not found and createIfNotFound is true, create new patient
  if (!patient && options?.createIfNotFound) {
    // Format phone to E.164 format for storage
    const formattedPhone = phone.startsWith('+') ? phone : `+${normalizedPhone}`;
    
    patient = await prisma.patient.create({
      data: {
        organizationId,
        firstName: options.defaultFirstName || 'Unknown',
        lastName: options.defaultLastName || 'Caller',
        phone: formattedPhone, // Store in E.164 format
      },
    });
  }
  
  return patient || null;
}

/**
 * Appointment Helpers
 */
export async function getAppointmentById(id: string, organizationId?: string) {
  const where: any = { id };
  if (organizationId) {
    where.organizationId = organizationId;
  }

  const appointment = await prisma.appointment.findFirst({
    where,
    include: {
      patient: true,
      location: true,
    },
  });

  if (!appointment) {
    throw new NotFoundError('Appointment', id);
  }

  return appointment;
}

export async function createAppointment(data: AppointmentCreateInput) {
  try {
    if (!data.locationId) {
      throw new DatabaseError('locationId is required for appointments');
    }

    const appointment = await prisma.appointment.create({
      data: {
        organizationId: data.organizationId,
        patientId: data.patientId,
        locationId: data.locationId,
        scheduledAt: data.scheduledAt,
        duration: data.duration || 30,
        status: data.status || 'scheduled',
        appointmentType: data.appointmentType,
        reason: data.reason,
        notes: data.notes,
        providerName: data.providerName,
        providerId: data.providerId,
        emrAppointmentId: data.emrAppointmentId,
        createdById: data.createdById,
      },
      include: {
        patient: true,
        location: true,
      },
    });

    // Send SMS confirmation (async - don't wait, send within 10 seconds)
    setTimeout(() => {
      import('@/lib/sms/sender').then(({ sendAppointmentConfirmation }) => {
        sendAppointmentConfirmation(appointment.id).catch(error => {
          console.error('Error sending SMS confirmation:', error);
          // Don't fail the appointment creation if SMS fails
        });
      });
    }, 1000); // Send within 1 second (well under 10 second requirement)

    return appointment;
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to create appointment'
    );
  }
}

export async function getAppointmentsByDateRange(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  locationId?: string
) {
  const where: any = {
    organizationId,
    scheduledAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (locationId) {
    where.locationId = locationId;
  }

  return await prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      location: true,
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  });
}

/**
 * Call Helpers
 */
export async function createCall(data: CallCreateInput) {
  try {
    return await prisma.call.create({
      data: {
        organizationId: data.organizationId,
        patientId: data.patientId,
        locationId: data.locationId,
        callSid: data.callSid,
        phoneNumber: data.phoneNumber,
        direction: data.direction,
        status: data.status || 'initiated',
        startedAt: data.startedAt || new Date(),
        aiAgentUsed: data.aiAgentUsed || false,
        aiAgentId: data.aiAgentId,
        handledById: data.handledById,
      },
      include: {
        patient: true,
        location: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to create call'
    );
  }
}

export async function findCallBySid(callSid: string) {
  return await prisma.call.findFirst({
    where: { callSid },
  });
}

export async function updateCall(id: string, data: CallUpdateInput) {
  try {
    return await prisma.call.update({
      where: { id },
      data: {
        status: data.status,
        answeredAt: data.answeredAt,
        endedAt: data.endedAt,
        duration: data.duration,
        aiTranscript: data.aiTranscript,
        aiIntent: data.aiIntent,
        aiConfidence: data.aiConfidence,
        outcome: data.outcome,
        notes: data.notes,
        recordingUrl: data.recordingUrl,
        recordingDuration: data.recordingDuration,
        transcriptionUrl: data.transcriptionUrl,
      },
    });
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to update call'
    );
  }
}

/**
 * EMR Integration Helpers
 */
export async function getEMRIntegrationById(id: string, organizationId?: string) {
  const where: any = { id };
  if (organizationId) {
    where.organizationId = organizationId;
  }

  const integration = await prisma.eMRIntegration.findFirst({
    where,
  });

  if (!integration) {
    throw new NotFoundError('EMR Integration', id);
  }

  return integration;
}

export async function createEMRIntegration(data: EMRIntegrationCreateInput) {
  try {
    return await prisma.eMRIntegration.create({
      data: {
        organizationId: data.organizationId,
        emrSystem: data.emrSystem,
        integrationType: data.integrationType,
        apiEndpoint: data.apiEndpoint,
        apiKey: data.apiKey,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        hl7Endpoint: data.hl7Endpoint,
        fhirBaseUrl: data.fhirBaseUrl,
        syncAppointments: data.syncAppointments ?? true,
        syncPatients: data.syncPatients ?? true,
        syncDirection: data.syncDirection || 'bidirectional',
        doctorId: data.doctorId,
        status: 'inactive', // Start as inactive until tested
      },
    });
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to create EMR integration'
    );
  }
}

export async function getActiveEMRIntegration(organizationId: string) {
  return await prisma.eMRIntegration.findFirst({
    where: {
      organizationId,
      status: 'active',
    },
  });
}

export async function getEMRIntegrationsByDoctor(doctorId: string) {
  return await prisma.eMRIntegration.findMany({
    where: {
      doctorId,
    },
    include: {
      organization: true,
      doctor: true,
    },
  });
}

/**
 * Phone Number Helpers
 */
// Note: getPhoneNumberByNumber is already exported from phone-routing.ts

export async function getClinicPhoneNumber(
  organizationId: string,
  locationId?: string
) {
  // Try location primary phone number first
  if (locationId) {
    const locationPhone = await prisma.phoneNumber.findFirst({
      where: {
        locationId,
        isPrimary: true,
        isActive: true,
        purpose: {
          in: ['sms', 'voice_sms'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (locationPhone) {
      return locationPhone;
    }

    // Try any location phone number
    const anyLocationPhone = await prisma.phoneNumber.findFirst({
      where: {
        locationId,
        isActive: true,
        purpose: {
          in: ['sms', 'voice_sms'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (anyLocationPhone) {
      return anyLocationPhone;
    }
  }

  // Try organization primary phone number
  const orgPhone = await prisma.phoneNumber.findFirst({
    where: {
      organizationId,
      isPrimary: true,
      isActive: true,
      purpose: {
        in: ['sms', 'voice_sms'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (orgPhone) {
    return orgPhone;
  }

  // Try any organization phone number
  return await prisma.phoneNumber.findFirst({
    where: {
      organizationId,
      isActive: true,
      purpose: {
        in: ['sms', 'voice_sms'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function createPhoneNumber(data: {
  phoneNumber: string;
  organizationId?: string;
  locationId?: string;
  numberType?: string;
  purpose?: string;
  isPrimary?: boolean;
  twilioSid?: string;
  portStatus?: string;
  numberSource?: string;
  friendlyName?: string;
}) {
  try {
    return await prisma.phoneNumber.create({
      data: {
        phoneNumber: data.phoneNumber,
        organizationId: data.organizationId,
        locationId: data.locationId,
        numberType: data.numberType || 'main',
        purpose: data.purpose || 'voice_sms',
        isPrimary: data.isPrimary || false,
        twilioSid: data.twilioSid,
        portStatus: data.portStatus || 'not_ported',
        numberSource: data.numberSource || 'twilio',
        friendlyName: data.friendlyName,
      },
    });
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to create phone number'
    );
  }
}

export async function setPrimaryPhoneNumber(phoneNumberId: string) {
  try {
    // Get the phone number to find its organization/location
    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id: phoneNumberId },
    });

    if (!phoneNumber) {
      throw new NotFoundError('PhoneNumber', phoneNumberId);
    }

    // Unset all other primary numbers for the same org/location
    if (phoneNumber.locationId) {
      await prisma.phoneNumber.updateMany({
        where: {
          locationId: phoneNumber.locationId,
          id: { not: phoneNumberId },
        },
        data: {
          isPrimary: false,
        },
      });
    } else if (phoneNumber.organizationId) {
      await prisma.phoneNumber.updateMany({
        where: {
          organizationId: phoneNumber.organizationId,
          locationId: null,
          id: { not: phoneNumberId },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Set this one as primary
    return await prisma.phoneNumber.update({
      where: { id: phoneNumberId },
      data: { isPrimary: true },
    });
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Failed to set primary phone number'
    );
  }
}
