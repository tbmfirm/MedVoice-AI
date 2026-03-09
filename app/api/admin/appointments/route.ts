import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAuth, getOrganizationFilter } from '@/lib/auth/api-protection';

/**
 * GET /api/admin/appointments
 * List appointments with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    let organizationId = searchParams.get('organizationId');
    
    // Apply organization filter based on user role
    const orgFilter = getOrganizationFilter(user);
    if (orgFilter && !organizationId) {
      organizationId = orgFilter.organizationId;
    }

    // For non-super admins, organizationId is required
    if (!organizationId && orgFilter) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) {
        where.scheduledAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.scheduledAt.lte = end;
      }
    }

    if (status) {
      where.status = status;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (doctorId) {
      where.providerId = doctorId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          appointmentType: {
            select: {
              id: true,
              name: true,
              duration: true,
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
        orderBy: {
          scheduledAt: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/appointments
 * Create appointment (admin override)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    const {
      organizationId: bodyOrganizationId,
      patientId,
      locationId,
      scheduledAt,
      duration = 30,
      appointmentTypeId,
      providerId,
      reason,
      notes,
      status = 'scheduled',
    } = body;

    // Apply organization filter based on user role
    const orgFilter = getOrganizationFilter(user);
    const organizationId = orgFilter
      ? orgFilter.organizationId
      : bodyOrganizationId;

    if (!organizationId || !patientId || !locationId || !scheduledAt) {
      return NextResponse.json(
        { error: 'organizationId, patientId, locationId, and scheduledAt are required' },
        { status: 400 }
      );
    }

    // Verify user can manage this organization
    if (orgFilter && organizationId !== orgFilter.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot create appointment for this organization' },
        { status: 403 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        organizationId,
        patientId,
        locationId,
        scheduledAt: new Date(scheduledAt),
        duration,
        status,
        reason,
        notes,
        providerId: providerId || null,
        appointmentTypeId: appointmentTypeId || null,
        bookingSource: 'admin',
      },
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
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
