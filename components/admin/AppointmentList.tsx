'use client';

import React from 'react';
import { format } from 'date-fns';
import { MoreVertical, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { Appointment } from '@/hooks/useAppointments';

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  loading?: boolean;
}

const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      scheduled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
      completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
      no_show: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };

    return (
      <span
        className={`
          px-2 py-1 rounded text-xs font-medium border
          ${statusClasses[status as keyof typeof statusClasses] || statusClasses.scheduled}
        `}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
        <p className="text-gray-400 text-center">Loading appointments...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
        <p className="text-gray-400 text-center">No appointments found</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Patient</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {format(new Date(appointment.scheduledAt), 'MMM d, yyyy')}
                    </span>
                    <span className="text-sm text-gray-400">
                      {format(new Date(appointment.scheduledAt), 'h:mm a')}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </span>
                    {appointment.patient.phone && (
                      <span className="text-sm text-gray-400">
                        {appointment.patient.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="text-white">{appointment.location.name}</span>
                </td>
                <td>
                  <span className="text-gray-300">
                    {appointment.appointmentType?.name || 'General'}
                  </span>
                </td>
                <td>{getStatusBadge(appointment.status)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(appointment)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(appointment)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentList;
