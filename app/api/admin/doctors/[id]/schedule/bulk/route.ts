import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateDoctorSchedule } from '@/lib/booking/validation';

/**
 * POST /api/admin/doctors/[id]/schedule/bulk
 * Bulk import/update schedule (for importing JSON format)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: doctorId } = params;
    const body = await request.json();
    const { organizationId, schedule } = body;

    if (!organizationId || !schedule || !Array.isArray(schedule)) {
      return NextResponse.json(
        { error: 'organizationId and schedule array are required' },
        { status: 400 }
      );
    }

    // First, delete existing schedules for this doctor
    await prisma.doctorSchedule.deleteMany({
      where: {
        doctorId,
        organizationId,
      },
    });

    // Create new schedules
    const createdSchedules = [];
    const errors = [];

    for (const entry of schedule) {
      const {
        day,
        location,
        start,
        end,
        note,
      } = entry;

      // Convert day to uppercase
      const dayOfWeek = day?.toUpperCase();
      
      // Handle location - could be location name or "ALL"
      let locationId = null;
      let locationName = null;

      if (location === 'ALL') {
        locationName = 'ALL';
      } else {
        // Try to find location by name
        const foundLocation = await prisma.location.findFirst({
          where: {
            organizationId,
            name: { equals: location, mode: 'insensitive' },
          },
        });
        if (foundLocation) {
          locationId = foundLocation.id;
        } else {
          locationName = location; // Store as name if not found
        }
      }

      // Handle CLOSED
      const startTime = start === 'CLOSED' ? 'CLOSED' : start;
      const endTime = end === 'CLOSED' ? 'CLOSED' : end;
      const isAlternating = note === 'ALT' || note?.includes('ALT');

      // Validate
      const validation = validateDoctorSchedule({
        dayOfWeek,
        locationId,
        locationName,
        startTime,
        endTime,
        isAlternating,
        note: note && note !== 'ALT' ? note : null,
      });

      if (!validation.valid) {
        errors.push({
          entry,
          errors: validation.errors,
        });
        continue;
      }

      try {
        const created = await prisma.doctorSchedule.create({
          data: {
            organizationId,
            doctorId,
            dayOfWeek,
            locationId,
            locationName,
            startTime,
            endTime,
            isAlternating,
            note: note && note !== 'ALT' ? note : null,
          },
        });
        createdSchedules.push(created);
      } catch (error) {
        errors.push({
          entry,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: createdSchedules.length,
      errors: errors.length > 0 ? errors : undefined,
      schedules: createdSchedules,
    });
  } catch (error) {
    console.error('Error bulk importing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to bulk import schedule' },
      { status: 500 }
    );
  }
}
