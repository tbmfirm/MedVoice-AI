import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAuth, canAccessOrganization, requireApiAdmin } from '@/lib/auth/api-protection';
import { hashPassword } from '@/lib/auth/password';

/**
 * GET /api/admin/users/[id]
 * Get user details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const authResult = await requireApiAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { id } = await params;

    const userData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        organizationId: true,
        emailVerified: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user can access this user's organization
    if (!canAccessOrganization(user, userData.organizationId)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot access this user' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();

    // Check if user exists and user can access it
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!canAccessOrganization(user, existing.organizationId)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update this user' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.emailVerified !== undefined) updateData.emailVerified = body.emailVerified;
    
    // Hash password if provided
    if (body.password) {
      updateData.passwordHash = await hashPassword(body.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        organizationId: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { id } = await params;

    // Check if user exists and user can access it
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!canAccessOrganization(user, existing.organizationId)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot delete this user' },
        { status: 403 }
      );
    }

    // Prevent deleting yourself
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
