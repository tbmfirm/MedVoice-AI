import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getUserOrganizationId } from '@/lib/auth/session';
import StatsCard from '@/components/admin/StatsCard';
// Icons are now passed as strings to StatsCard component
import RecentAppointments from '@/components/admin/RecentAppointments';

export const metadata: Metadata = {
  title: 'Dashboard | Admin',
  description: 'Admin Dashboard Overview',
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const organizationId = getUserOrganizationId(user);
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfToday = new Date(now.setHours(23, 59, 59, 999));
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  // Build where clause
  const where: any = {};
  if (organizationId) {
    where.organizationId = organizationId;
  }

  // Today's appointments
  const todayAppointments = await prisma.appointment.count({
    where: {
      ...where,
      scheduledAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  });

  // Upcoming appointments (next 7 days)
  const upcomingAppointments = await prisma.appointment.count({
    where: {
      ...where,
      scheduledAt: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      status: {
        in: ['scheduled', 'confirmed'],
      },
    },
  });

  // Pending confirmations
  const pendingConfirmations = await prisma.appointment.count({
    where: {
      ...where,
      status: 'scheduled',
      scheduledAt: {
        gte: new Date(),
      },
    },
  });

  // Cancelled this week
  const cancelledThisWeek = await prisma.appointment.count({
    where: {
      ...where,
      status: 'cancelled',
      updatedAt: {
        gte: startOfWeek,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back, {user.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Appointments"
          value={todayAppointments}
          icon="Calendar"
          href={`/admin/appointments?startDate=${startOfToday.toISOString()}&endDate=${endOfToday.toISOString()}`}
        />
        <StatsCard
          title="Upcoming (7 days)"
          value={upcomingAppointments}
          icon="Clock"
          href="/admin/appointments?status=scheduled,confirmed"
        />
        <StatsCard
          title="Pending Confirmations"
          value={pendingConfirmations}
          icon="CheckCircle"
          href="/admin/appointments?status=scheduled"
        />
        <StatsCard
          title="Cancelled This Week"
          value={cancelledThisWeek}
          icon="XCircle"
          href="/admin/appointments?status=cancelled"
        />
      </div>

      {/* Recent Appointments */}
      <RecentAppointments organizationId={organizationId} />
    </div>
  );
}
