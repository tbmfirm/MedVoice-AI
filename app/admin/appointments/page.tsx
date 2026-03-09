import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getUserOrganizationId, isSuperAdmin } from '@/lib/auth/session';
import AppointmentsClient from '@/components/admin/AppointmentsClient';

export const metadata: Metadata = {
  title: 'Appointments | Admin',
  description: 'Manage Appointments',
};

export default async function AppointmentsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const organizationId = getUserOrganizationId(user);
  const userIsSuperAdmin = isSuperAdmin(user);

  // Fetch locations
  const locationsWhere: any = {};
  if (organizationId) {
    locationsWhere.organizationId = organizationId;
  }

  const locations = await prisma.location.findMany({
    where: locationsWhere,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Fetch doctors
  const doctorsWhere: any = {
    role: 'clinician',
  };
  if (organizationId) {
    doctorsWhere.organizationId = organizationId;
  }

  const doctors = await prisma.user.findMany({
    where: doctorsWhere,
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' },
    ],
  });

  const doctorsFormatted = doctors.map((d) => ({
    id: d.id,
    name: `${d.firstName} ${d.lastName}`,
  }));

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
      <div>
        <h1 className="text-3xl font-bold text-white">Appointments</h1>
        <p className="text-gray-400 mt-1">View and manage all appointments</p>
      </div>

      <AppointmentsClient
        organizationId={organizationId}
        locations={locations}
        doctors={doctorsFormatted}
        showOrganizationFilter={userIsSuperAdmin}
        organizations={organizations}
      />
    </div>
  );
}
