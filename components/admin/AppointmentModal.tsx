'use client';

import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment } from '@/hooks/useAppointments';
import AppointmentForm from './AppointmentForm';

interface AppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  mode?: 'view' | 'edit' | 'create';
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSave,
  mode = 'view',
}) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'create' ? 'Create Appointment' : mode === 'edit' ? 'Edit Appointment' : 'Appointment Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {mode === 'view' && appointment ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Date & Time</label>
                <p className="text-white mt-1">
                  {format(new Date(appointment.scheduledAt), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Patient</label>
                <p className="text-white mt-1">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                {appointment.patient.phone && (
                  <p className="text-gray-400 text-sm mt-1">{appointment.patient.phone}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Location</label>
                <p className="text-white mt-1">{appointment.location.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Status</label>
                <p className="text-white mt-1 capitalize">{appointment.status}</p>
              </div>
              {appointment.reason && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Reason</label>
                  <p className="text-white mt-1">{appointment.reason}</p>
                </div>
              )}
              {appointment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Notes</label>
                  <p className="text-white mt-1">{appointment.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <AppointmentForm
              appointment={appointment}
              onSave={onSave}
              onCancel={onClose}
              mode={mode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
