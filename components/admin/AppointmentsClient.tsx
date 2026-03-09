'use client';

import React, { useState } from 'react';
import { useAppointments, AppointmentFilters } from '@/hooks/useAppointments';
import AppointmentFiltersComponent from './AppointmentFilters';
import AppointmentList from './AppointmentList';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import { Calendar, List } from 'lucide-react';

interface AppointmentsClientProps {
  organizationId: string | null;
  locations: Array<{ id: string; name: string }>;
  doctors: Array<{ id: string; name: string }>;
  showOrganizationFilter?: boolean;
  organizations?: Array<{ id: string; name: string }>;
}

const AppointmentsClient: React.FC<AppointmentsClientProps> = ({
  organizationId,
  locations,
  doctors,
  showOrganizationFilter = false,
  organizations = [],
}) => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState<AppointmentFilters>({
    organizationId: organizationId || undefined,
  });

  const { appointments, loading, error, pagination, refetch } = useAppointments(filters);

  const handleEdit = (appointment: any) => {
    // TODO: Open edit modal
    console.log('Edit appointment:', appointment);
  };

  const handleDelete = (appointment: any) => {
    // TODO: Show delete confirmation
    console.log('Delete appointment:', appointment);
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`
              px-4 py-2 rounded-md transition-colors flex items-center gap-2
              ${
                view === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }
            `}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`
              px-4 py-2 rounded-md transition-colors flex items-center gap-2
              ${
                view === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }
            `}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
        </div>
      </div>

      {/* Filters */}
      <AppointmentFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        locations={locations}
        doctors={doctors}
        showOrganizationFilter={showOrganizationFilter}
        organizations={organizations}
      />

      {/* Error Display */}
      {error && <ErrorDisplay error={error} />}

      {/* Content */}
      {view === 'list' ? (
        <>
          {loading ? (
            <LoadingSpinner text="Loading appointments..." />
          ) : (
            <>
              <AppointmentList
                appointments={appointments}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
              />
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} appointments
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setFilters({ ...filters, page: pagination.page - 1 })
                      }
                      className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                    >
                      Previous
                    </button>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setFilters({ ...filters, page: pagination.page + 1 })
                      }
                      className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Calendar view coming soon</p>
        </div>
      )}
    </div>
  );
};

export default AppointmentsClient;
