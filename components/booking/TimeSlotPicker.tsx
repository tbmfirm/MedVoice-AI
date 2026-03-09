'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, Loader2 } from 'lucide-react';

interface TimeSlotPickerProps {
  organizationId: string;
  doctorId: string;
  locationId: string;
  date: Date;
  appointmentTypeId?: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  onBack: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  datetime: string;
}

export default function TimeSlotPicker({
  organizationId,
  doctorId,
  locationId,
  date,
  appointmentTypeId,
  selectedTime,
  onSelect,
  onBack,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeSlots();
  }, [date, organizationId, doctorId, locationId, appointmentTypeId]);

  const loadTimeSlots = async () => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const url = `/api/booking/availability?organizationId=${organizationId}&doctorId=${doctorId}&locationId=${locationId}&date=${dateStr}${appointmentTypeId ? `&appointmentTypeId=${appointmentTypeId}` : ''}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSlots(data.slots);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    // Convert "10:00" to "10:00 AM" format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const groupSlotsByTimeOfDay = () => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach((slot) => {
      if (slot.available) {
        const [hours] = slot.time.split(':').map(Number);
        if (hours < 12) {
          morning.push(slot);
        } else if (hours < 17) {
          afternoon.push(slot);
        } else {
          evening.push(slot);
        }
      }
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsByTimeOfDay();
  const availableSlots = [...morning, ...afternoon, ...evening];

  return (
    <div className="glass-card p-8 rounded-2xl">
      <h2 className="text-2xl font-black text-white mb-6">Select a Time</h2>
      <p className="text-slate-400 mb-6">
        {date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 size={32} className="animate-spin text-electric mx-auto mb-4" />
          <p className="text-slate-400">Loading available times...</p>
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-12">
          <Clock size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No available time slots for this date</p>
        </div>
      ) : (
        <div className="space-y-6">
          {morning.length > 0 && (
            <div>
              <h3 className="text-slate-400 text-sm font-bold mb-3 uppercase tracking-wider">
                Morning
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {morning.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => onSelect(slot.time)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedTime === slot.time
                        ? 'border-electric bg-electric/10 text-white'
                        : 'border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {afternoon.length > 0 && (
            <div>
              <h3 className="text-slate-400 text-sm font-bold mb-3 uppercase tracking-wider">
                Afternoon
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {afternoon.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => onSelect(slot.time)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedTime === slot.time
                        ? 'border-electric bg-electric/10 text-white'
                        : 'border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {evening.length > 0 && (
            <div>
              <h3 className="text-slate-400 text-sm font-bold mb-3 uppercase tracking-wider">
                Evening
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {evening.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => onSelect(slot.time)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedTime === slot.time
                        ? 'border-electric bg-electric/10 text-white'
                        : 'border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
