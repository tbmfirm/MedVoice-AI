import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAuth, getOrganizationFilter } from '@/lib/auth/api-protection';

/**
 * GET /api/admin/appointment-types
 * List appointment types for organization
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

    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {
      organizationId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const appointmentTypes = await prisma.appointmentType.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      appointmentTypes,
    });
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment types' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/appointment-types
 * Create new appointment type
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // Only admins can create appointment types
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { organizationId: bodyOrganizationId, name, duration, description, color } = body;
    
    // Apply organization filter based on user role
    const orgFilter = getOrganizationFilter(user);
    const organizationId = orgFilter
      ? orgFilter.organizationId
      : bodyOrganizationId;

    if (!organizationId || !name || !duration) {
      return NextResponse.json(
        { error: 'organizationId, name, and duration are required' },
        { status: 400 }
      );
    }

    // Verify user can manage this organization
    if (orgFilter && organizationId !== orgFilter.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot create appointment type for this organization' },
        { status: 403 }
      );
    }

    const appointmentType = await prisma.appointmentType.create({
      data: {
        organizationId,
        name,
        duration: parseInt(duration, 10),
        description,
        color,
      },
    });

    return NextResponse.json({
      success: true,
      appointmentType,
    });
  } catch (error) {
    console.error('Error creating appointment type:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment type' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/appointment-types
 * Update appointment type
 */
export async function PUT(request: NextRequest) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // Only admins can update appointment types
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, duration, description, color, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Check if appointment type exists and user can access it
    const existing = await prisma.appointmentType.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment type not found' },
        { status: 404 }
      );
    }

    const orgFilter = getOrganizationFilter(user);
    if (orgFilter && existing.organizationId !== orgFilter.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update this appointment type' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (duration !== undefined) updateData.duration = parseInt(duration, 10);
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const appointmentType = await prisma.appointmentType.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      appointmentType,
    });
  } catch (error) {
    console.error('Error updating appointment type:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment type' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/appointment-types
 * Soft delete (set isActive=false)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // Only admins can delete appointment types
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Check if appointment type exists and user can access it
    const existing = await prisma.appointmentType.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment type not found' },
        { status: 404 }
      );
    }

    const orgFilter = getOrganizationFilter(user);
    if (orgFilter && existing.organizationId !== orgFilter.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot delete this appointment type' },
        { status: 403 }
      );
    }

    const appointmentType = await prisma.appointmentType.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment type deactivated',
    });
  } catch (error) {
    console.error('Error deleting appointment type:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment type' },
      { status: 500 }
    );
  }
}
