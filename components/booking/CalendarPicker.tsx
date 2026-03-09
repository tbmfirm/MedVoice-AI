'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarPickerProps {
  organizationId: string;
  doctorId: string;
  locationId: string;
  appointmentTypeId?: string;
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  onBack: () => void;
}

export default function CalendarPicker({
  organizationId,
  doctorId,
  locationId,
  appointmentTypeId,
  selectedDate,
  onSelect,
  onBack,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableDates();
  }, [currentMonth, organizationId, doctorId, locationId, appointmentTypeId]);

  const loadAvailableDates = async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const response = await fetch(
        `/api/booking/available-dates?organizationId=${organizationId}&doctorId=${doctorId}&locationId=${locationId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}${appointmentTypeId ? `&appointmentTypeId=${appointmentTypeId}` : ''}`
      );

      const data = await response.json();
      if (data.success) {
        const dates = new Set(
          data.dates
            .filter((d: { hasAvailability: boolean }) => d.hasAvailability)
            .map((d: { date: string }) => d.date)
        );
        setAvailableDates(dates);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateStr = date.toISOString().split('T')[0];

    if (availableDates.has(dateStr) && date >= new Date(new Date().setHours(0, 0, 0, 0))) {
      onSelect(date);
    }
  };

  const formatDateKey = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="glass-card p-8 rounded-2xl">
      <h2 className="text-2xl font-black text-white mb-6">Select a Date</h2>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h3 className="text-xl font-bold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading available dates...</div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-slate-400 text-sm font-bold py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = formatDateKey(day);
              const isAvailable = availableDates.has(dateStr);
              const isPast = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              ) < new Date(new Date().setHours(0, 0, 0, 0));
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={!isAvailable || isPast}
                  className={`aspect-square rounded-lg transition-all ${
                    isSelected
                      ? 'bg-electric text-white'
                      : isAvailable && !isPast
                      ? 'bg-white/5 hover:bg-white/10 text-white cursor-pointer'
                      : 'bg-white/0 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button
        onClick={onBack}
        className="mt-6 px-6 py-3 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <ChevronLeft size={20} />
        Back
      </button>
    </div>
  );
}
