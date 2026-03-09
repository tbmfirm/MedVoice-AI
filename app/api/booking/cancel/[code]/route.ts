import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/booking/cancel/[code]
 * Cancel appointment by confirmation code
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { reason } = body;

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
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed appointment' },
        { status: 400 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'cancelled',
        notes: reason
          ? `${appointment.notes || ''}\nCancellation reason: ${reason}`.trim()
          : appointment.notes,
      },
    });

    // TODO: Send cancellation confirmation SMS/email

    return NextResponse.json({
      success: true,
      appointment: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
