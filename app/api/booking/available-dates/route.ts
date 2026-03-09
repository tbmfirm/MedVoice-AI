import { NextRequest, NextResponse } from 'next/server';
import { getAvailableDates } from '@/lib/booking/availability';

/**
 * GET /api/booking/available-dates
 * Get dates with availability in a date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const doctorId = searchParams.get('doctorId');
    const locationId = searchParams.get('locationId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const appointmentTypeId = searchParams.get('appointmentTypeId') || undefined;

    if (!organizationId || !doctorId || !locationId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'organizationId, doctorId, locationId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be before or equal to endDate' },
        { status: 400 }
      );
    }

    const dates = await getAvailableDates(
      organizationId,
      doctorId,
      locationId,
      startDate,
      endDate,
      appointmentTypeId
    );

    return NextResponse.json({
      success: true,
      dates,
    });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available dates' },
      { status: 500 }
    );
  }
}
