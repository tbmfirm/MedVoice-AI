import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireApiAuth, requireApiAdmin } from '@/lib/auth/api-protection';

/**
 * GET /api/admin/organizations
 * List all organizations (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and admin role
    const authResult = await requireApiAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      organizations,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
