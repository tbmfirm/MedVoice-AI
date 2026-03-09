'use client';

import React, { useState, useEffect } from 'react';
import { Appointment } from '@/hooks/useAppointments';
import LoadingSpinner from './LoadingSpinner';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  onSave,
  onCancel,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState({
    scheduledAt: appointment
      ? new Date(appointment.scheduledAt).toISOString().slice(0, 16)
      : '',
    duration: appointment?.duration || 30,
    status: appointment?.status || 'scheduled',
    reason: appointment?.reason || '',
    notes: appointment?.notes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave({
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Date & Time *
        </label>
        <input
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
          required
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Duration (minutes) *
        </label>
        <input
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          required
          min="15"
          step="15"
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Status *
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          required
          className="admin-input"
        >
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Reason
        </label>
        <input
          type="text"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="admin-input"
          placeholder="Appointment reason"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="admin-input"
          placeholder="Additional notes"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="admin-btn admin-btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" />
          ) : (
            mode === 'create' ? 'Create' : 'Save'
          )}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;
