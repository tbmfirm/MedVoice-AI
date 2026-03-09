import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateDoctorSchedule } from '@/lib/booking/validation';

/**
 * GET /api/admin/doctors/[id]/schedule
 * Get doctor's schedule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: doctorId } = params;
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        organizationId,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error('Error fetching doctor schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor schedule' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/doctors/[id]/schedule
 * Create schedule entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: doctorId } = params;
    const body = await request.json();
    const { organizationId, dayOfWeek, locationId, locationName, startTime, endTime, isAlternating, note } = body;

    if (!organizationId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'organizationId, dayOfWeek, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    // Validate schedule entry
    const validation = validateDoctorSchedule({
      dayOfWeek,
      locationId,
      locationName,
      startTime,
      endTime,
      isAlternating,
      note,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const schedule = await prisma.doctorSchedule.create({
      data: {
        organizationId,
        doctorId,
        dayOfWeek,
        locationId: locationId || null,
        locationName: locationName || null,
        startTime,
        endTime,
        isAlternating: isAlternating || false,
        note: note || null,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error('Error creating schedule entry:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule entry' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/doctors/[id]/schedule
 * Update schedule entry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { scheduleId, dayOfWeek, locationId, locationName, startTime, endTime, isAlternating, note } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (locationId !== undefined) updateData.locationId = locationId;
    if (locationName !== undefined) updateData.locationName = locationName;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (isAlternating !== undefined) updateData.isAlternating = isAlternating;
    if (note !== undefined) updateData.note = note;

    const schedule = await prisma.doctorSchedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error('Error updating schedule entry:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/doctors/[id]/schedule
 * Delete schedule entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      );
    }

    await prisma.doctorSchedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule entry deleted',
    });
  } catch (error) {
    console.error('Error deleting schedule entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule entry' },
      { status: 500 }
    );
  }
}
