import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/booking/doctors
 * List doctors for organization
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const locationId = searchParams.get('locationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const where: any = {
      organizationId,
      role: 'clinician',
    };

    // If locationId is provided, filter doctors who work at that location
    if (locationId) {
      const doctorsWithSchedule = await prisma.doctorSchedule.findMany({
        where: {
          organizationId,
          OR: [
            { locationId },
            { locationName: 'ALL' },
          ],
          startTime: { not: 'CLOSED' },
        },
        select: {
          doctorId: true,
        },
        distinct: ['doctorId'],
      });

      const doctorIds = doctorsWithSchedule.map(s => s.doctorId);
      where.id = { in: doctorIds };
    }

    const doctors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      doctors: doctors.map(d => ({
        id: d.id,
        name: `${d.firstName} ${d.lastName}`,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
      })),
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}
