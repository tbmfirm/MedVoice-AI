import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAuth, canAccessOrganization } from '@/lib/auth/api-protection';

/**
 * GET /api/admin/appointments/[id]
 * Get single appointment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { id } = params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        location: true,
        appointmentType: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user can access this appointment's organization
    if (!canAccessOrganization(user, appointment.organizationId)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot access this appointment' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/appointments/[id]
 * Update appointment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { id } = params;
    
    // Check if appointment exists and user can access it
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (!canAccessOrganization(user, existing.organizationId)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update this appointment' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      scheduledAt,
      duration,
      status,
      locationId,
      providerId,
      appointmentTypeId,
      reason,
      notes,
    } = body;

    const updateData: any = {};

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = new Date(scheduledAt);
    }
    if (duration !== undefined) {
      updateData.duration = duration;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (locationId !== undefined) {
      updateData.locationId = locationId;
    }
    if (providerId !== undefined) {
      updateData.providerId = providerId;
    }
    if (appointmentTypeId !== undefined) {
      updateData.appointmentTypeId = appointmentTypeId;
    }
    if (reason !== undefined) {
      updateData.reason = reason;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        location: true,
        appointmentType: true,
      },
    });

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/appointments/[id]
 * Cancel/delete appointment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // Only admins can delete appointments
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if appointment exists and user can access it
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (!canAccessOrganization(user, existing.organizationId)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot cancel this appointment' },
        { status: 403 }
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
