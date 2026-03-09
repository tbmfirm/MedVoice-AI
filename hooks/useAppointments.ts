'use client';

import { useState, useEffect } from 'react';

export interface AppointmentFilters {
  organizationId?: string | null;
  startDate?: string;
  endDate?: string;
  status?: string;
  locationId?: string;
  doctorId?: string;
  patientId?: string;
  page?: number;
  limit?: number;
}

export interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  reason?: string;
  notes?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  location: {
    id: string;
    name: string;
    address?: string;
  };
  appointmentType?: {
    id: string;
    name: string;
    duration: number;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface UseAppointmentsResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
}

export function useAppointments(
  filters: AppointmentFilters = {}
): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseAppointmentsResult['pagination']>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (filters.organizationId) {
        params.append('organizationId', filters.organizationId);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.locationId) {
        params.append('locationId', filters.locationId);
      }
      if (filters.doctorId) {
        params.append('doctorId', filters.doctorId);
      }
      if (filters.patientId) {
        params.append('patientId', filters.patientId);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await fetch(`/api/admin/appointments?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointments');
      }

      setAppointments(data.appointments || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [
    filters.organizationId,
    filters.startDate,
    filters.endDate,
    filters.status,
    filters.locationId,
    filters.doctorId,
    filters.patientId,
    filters.page,
    filters.limit,
  ]);

  return {
    appointments,
    loading,
    error,
    pagination,
    refetch: fetchAppointments,
  };
}
