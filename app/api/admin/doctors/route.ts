import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAuth, getOrganizationFilter } from '@/lib/auth/api-protection';

/**
 * GET /api/admin/doctors
 * List doctors for organization
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

    const doctors = await prisma.user.findMany({
      where: {
        organizationId,
        role: 'clinician',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
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
        createdAt: d.createdAt,
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

/**
 * POST /api/admin/doctors
 * Create doctor (User with role "clinician")
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // Only admins can create doctors
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { organizationId: bodyOrganizationId, firstName, lastName, email, phone, passwordHash } = body;

    // Apply organization filter based on user role
    const orgFilter = getOrganizationFilter(user);
    const organizationId = orgFilter
      ? orgFilter.organizationId
      : bodyOrganizationId;

    if (!organizationId || !firstName || !lastName || !email || !passwordHash) {
      return NextResponse.json(
        { error: 'organizationId, firstName, lastName, email, and passwordHash are required' },
        { status: 400 }
      );
    }

    // Verify user can manage this organization
    if (orgFilter && organizationId !== orgFilter.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot create doctor for this organization' },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const doctor = await prisma.user.create({
      data: {
        organizationId,
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role: 'clinician',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { error: 'Failed to create doctor' },
      { status: 500 }
    );
  }
}
