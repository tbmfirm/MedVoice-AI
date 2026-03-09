import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getUserOrganizationId, isSuperAdmin } from '@/lib/auth/session';
import UsersClient from '@/components/admin/UsersClient';

export const metadata: Metadata = {
  title: 'Users | Admin',
  description: 'Manage Users',
};

export default async function UsersPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Only admins can access user management
  if (user.role !== 'admin') {
    redirect('/admin?error=unauthorized');
  }

  const organizationId = getUserOrganizationId(user);
  const userIsSuperAdmin = isSuperAdmin(user);

  // Fetch organizations for super admin
  let organizations: Array<{ id: string; name: string }> = [];
  if (userIsSuperAdmin) {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    organizations = orgs;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage staff and admin users</p>
        </div>
      </div>

      <UsersClient
        organizationId={organizationId}
        showOrganizationFilter={userIsSuperAdmin}
        organizations={organizations}
      />
    </div>
  );
}
