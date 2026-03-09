import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/booking/availability';

/**
 * GET /api/booking/availability
 * Get available time slots for a doctor on a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const doctorId = searchParams.get('doctorId');
    const locationId = searchParams.get('locationId');
    const dateStr = searchParams.get('date');
    const appointmentTypeId = searchParams.get('appointmentTypeId') || undefined;

    if (!organizationId || !doctorId || !locationId || !dateStr) {
      return NextResponse.json(
        { error: 'organizationId, doctorId, locationId, and date are required' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(
      organizationId,
      doctorId,
      locationId,
      date,
      appointmentTypeId
    );

    return NextResponse.json({
      success: true,
      slots: slots.map(s => ({
        time: s.time,
        available: s.available,
        datetime: s.datetime.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
