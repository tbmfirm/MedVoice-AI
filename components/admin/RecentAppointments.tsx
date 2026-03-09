import React from 'react';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';

interface RecentAppointmentsProps {
  organizationId: string | null;
}

const RecentAppointments: React.FC<RecentAppointmentsProps> = async ({
  organizationId,
}) => {
  const where: any = {};
  if (organizationId) {
    where.organizationId = organizationId;
  }

  const recentAppointments = await prisma.appointment.findMany({
    where: {
      ...where,
      scheduledAt: {
        gte: new Date(),
      },
    },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
      appointmentType: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: 5,
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Recent Appointments</h2>
        <Link
          href="/admin/appointments"
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {recentAppointments.length === 0 ? (
        <p className="text-gray-400 text-sm">No upcoming appointments</p>
      ) : (
        <div className="space-y-3">
          {recentAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1">
                <p className="text-white font-medium">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                <p className="text-sm text-gray-400">
                  {format(new Date(appointment.scheduledAt), 'MMM d, yyyy h:mm a')}
                  {' • '}
                  {appointment.location.name}
                  {appointment.appointmentType && ` • ${appointment.appointmentType.name}`}
                </p>
              </div>
              <span
                className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${
                    appointment.status === 'confirmed'
                      ? 'bg-green-500/10 text-green-400'
                      : appointment.status === 'cancelled'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }
                `}
              >
                {appointment.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentAppointments;
