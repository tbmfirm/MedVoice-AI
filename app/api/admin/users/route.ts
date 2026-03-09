import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAuth, getOrganizationFilter, requireApiAdmin } from '@/lib/auth/api-protection';
import { hashPassword } from '@/lib/auth/password';

/**
 * GET /api/admin/users
 * List users for organization
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

    const role = searchParams.get('role');
    const where: any = {};
    
    if (organizationId) {
      where.organizationId = organizationId;
    }
    
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
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
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    const {
      organizationId: bodyOrganizationId,
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'staff',
    } = body;

    // Apply organization filter based on user role
    const orgFilter = getOrganizationFilter(user);
    const organizationId = orgFilter
      ? orgFilter.organizationId
      : bodyOrganizationId;

    if (!organizationId || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'organizationId, email, password, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    // Verify user can manage this organization
    if (orgFilter && organizationId !== orgFilter.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot create user for this organization' },
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

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        organizationId,
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
