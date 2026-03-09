import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateConfirmationCode } from '@/lib/booking/utils';
import { validateBookingRequest } from '@/lib/booking/utils';
import { validateTimeSlot } from '@/lib/booking/validation';
import { findOrCreatePatientByPhone } from '@/lib/utils/db-helpers';
import { sendAppointmentConfirmation } from '@/lib/notifications/appointment-notifications';

/**
 * POST /api/booking/appointments
 * Create new appointment (public booking)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientInfo,
      doctorId,
      locationId,
      scheduledAt,
      appointmentTypeId,
      reason,
    } = body;

    // Validate request
    const validation = validateBookingRequest({
      patientInfo,
      doctorId,
      locationId,
      scheduledAt,
      appointmentTypeId,
      reason,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Get organization from location
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { organization: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const organizationId = location.organizationId;

    // Validate time slot is still available
    const scheduledDate = new Date(scheduledAt);
    let duration = 30; // default

    if (appointmentTypeId) {
      const appointmentType = await prisma.appointmentType.findUnique({
        where: { id: appointmentTypeId },
      });
      if (appointmentType) {
        duration = appointmentType.duration;
      }
    }

    const slotValidation = await validateTimeSlot(
      organizationId,
      doctorId,
      locationId,
      scheduledDate,
      duration
    );

    if (!slotValidation.valid) {
      return NextResponse.json(
        { error: slotValidation.error },
        { status: 400 }
      );
    }

    // Find or create patient
    const patient = await findOrCreatePatientByPhone(
      patientInfo.phone,
      organizationId,
      {
        createIfNotFound: true,
        defaultFirstName: patientInfo.firstName,
        defaultLastName: patientInfo.lastName,
      }
    );

    if (!patient) {
      return NextResponse.json(
        { error: 'Failed to create or find patient' },
        { status: 500 }
      );
    }

    // Update patient info if provided
    if (patientInfo.email || patientInfo.dateOfBirth) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          email: patientInfo.email || patient.email,
          dateOfBirth: patientInfo.dateOfBirth
            ? new Date(patientInfo.dateOfBirth)
            : patient.dateOfBirth,
        },
      });
    }

    // Generate confirmation code
    let confirmationCode = generateConfirmationCode();
    let codeExists = true;
    while (codeExists) {
      // Use findFirst since confirmationCode isn't unique yet (will be after migration)
      const existing = await prisma.appointment.findFirst({
        where: { confirmationCode },
      });
      if (!existing) {
        codeExists = false;
      } else {
        confirmationCode = generateConfirmationCode();
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        organizationId,
        patientId: patient.id,
        locationId,
        scheduledAt: scheduledDate,
        duration,
        status: 'scheduled',
        reason,
        providerId: doctorId,
        appointmentTypeId: appointmentTypeId || null,
        bookingSource: 'online',
        confirmationCode,
      },
      include: {
        patient: true,
        location: true,
        appointmentType: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send SMS/email confirmation (async, don't block response)
    sendAppointmentConfirmation(appointment.id).catch((error) => {
      console.error('Error sending appointment confirmation:', error);
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        confirmationCode: appointment.confirmationCode,
        scheduledAt: appointment.scheduledAt.toISOString(),
        duration: appointment.duration,
        status: appointment.status,
        patient: {
          firstName: appointment.patient.firstName,
          lastName: appointment.patient.lastName,
          phone: appointment.patient.phone,
        },
        location: {
          name: appointment.location.name,
          address: appointment.location.address,
        },
        appointmentType: appointment.appointmentType
          ? {
              name: appointment.appointmentType.name,
              duration: appointment.appointmentType.duration,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
