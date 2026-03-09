import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAuth, getOrganizationFilter, canAccessOrganization } from '@/lib/auth/api-protection';

/**
 * GET /api/admin/booking-page
 * Get booking page settings for organization
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

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    let settings = await prisma.bookingPageSettings.findUnique({
      where: { organizationId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      });

      settings = await prisma.bookingPageSettings.create({
        data: {
          organizationId,
          welcomeTitle: 'Book an Appointment',
          welcomeMessage: `Welcome to ${organization?.name || 'our clinic'}. Book your appointment online.`,
          displayPhone: true,
          displayEmail: true,
          displayAddress: true,
          showServices: true,
          showDoctors: true,
          showLocations: true,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching booking page settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking page settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/booking-page
 * Update booking page settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // Only admins can update booking page settings
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { organizationId: bodyOrganizationId, ...updateData } = body;
    
    // Apply organization filter based on user role
    const orgFilter = getOrganizationFilter(user);
    const organizationId = orgFilter
      ? orgFilter.organizationId
      : bodyOrganizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const existing = await prisma.bookingPageSettings.findUnique({
      where: { organizationId },
    });

    let settings;
    if (existing) {
      settings = await prisma.bookingPageSettings.update({
        where: { organizationId },
        data: updateData,
      });
    } else {
      settings = await prisma.bookingPageSettings.create({
        data: {
          organizationId,
          ...updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error updating booking page settings:', error);
    return NextResponse.json(
      { error: 'Failed to update booking page settings' },
      { status: 500 }
    );
  }
}
