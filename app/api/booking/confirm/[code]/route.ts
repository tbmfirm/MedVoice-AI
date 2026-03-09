import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/booking/confirm/[code]
 * Verify appointment by confirmation code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: 'Confirmation code is required' },
        { status: 400 }
      );
    }

    // Use findFirst since confirmationCode isn't unique yet (will be after migration)
    const appointment = await prisma.appointment.findFirst({
      where: { confirmationCode: code },
      include: {
        patient: true,
        location: true,
        appointmentType: true,
        organization: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        scheduledAt: appointment.scheduledAt.toISOString(),
        duration: appointment.duration,
        status: appointment.status,
        patient: {
          firstName: appointment.patient.firstName,
          lastName: appointment.patient.lastName,
        },
        location: {
          name: appointment.location.name,
          address: appointment.location.address,
        },
        appointmentType: appointment.appointmentType
          ? {
              name: appointment.appointmentType.name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error verifying appointment:', error);
    return NextResponse.json(
      { error: 'Failed to verify appointment' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/booking/confirm/[code]
 * Confirm appointment (mark as confirmed)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: 'Confirmation code is required' },
        { status: 400 }
      );
    }

    // Use findFirst since confirmationCode isn't unique yet (will be after migration)
    const appointment = await prisma.appointment.findFirst({
      where: { confirmationCode: code },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot confirm a cancelled appointment' },
        { status: 400 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'confirmed',
      },
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm appointment' },
      { status: 500 }
    );
  }
}
