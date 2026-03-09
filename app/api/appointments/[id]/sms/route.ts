import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentConfirmation } from '@/lib/sms/sender';
import { prisma } from '@/lib/db';

/**
 * Trigger SMS sending for an appointment
 * POST /api/appointments/[id]/sms
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Verify appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if patient has phone number
    if (!appointment.patient.phone) {
      return NextResponse.json(
        { error: 'Patient phone number not available' },
        { status: 400 }
      );
    }

    // Send SMS
    const result = await sendAppointmentConfirmation(appointmentId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully',
        messageSid: result.messageSid,
        smsLogId: result.smsLogId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send SMS',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in SMS trigger endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get SMS status for an appointment
 * GET /api/appointments/[id]/sms
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Get SMS logs for this appointment
    const smsLogs = await prisma.sMSLog.findMany({
      where: {
        appointmentId,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      smsLogs: smsLogs.map(log => ({
        id: log.id,
        messageType: log.messageType,
        status: log.status,
        sentAt: log.sentAt,
        deliveredAt: log.deliveredAt,
        failedAt: log.failedAt,
        errorCode: log.errorCode,
        errorMessage: log.errorMessage,
      })),
    });
  } catch (error) {
    console.error('Error getting SMS status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
