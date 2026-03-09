'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import DoctorSelector from './DoctorSelector';
import LocationSelector from './LocationSelector';
import CalendarPicker from './CalendarPicker';
import TimeSlotPicker from './TimeSlotPicker';

interface BookingWizardProps {
  organizationId: string;
  locations: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  doctors: Array<{
    id: string;
    name: string;
    firstName: string;
    lastName: string;
  }>;
  appointmentTypes: Array<{
    id: string;
    name: string;
    duration: number;
  }>;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface BookingData {
  doctorId: string | null;
  locationId: string | null;
  appointmentTypeId: string | null;
  date: Date | null;
  time: string | null;
  patientInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    dateOfBirth: string;
  };
  reason: string;
}

export default function BookingWizard({
  organizationId,
  locations,
  doctors,
  appointmentTypes,
}: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    doctorId: null,
    locationId: null,
    appointmentTypeId: null,
    date: null,
    time: null,
    patientInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dateOfBirth: '',
    },
    reason: '',
  });
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  const totalSteps = 8;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => (prev + 1) as Step);
      setError(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setError(null);
    }
  };

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!bookingData.doctorId || !bookingData.locationId || !bookingData.date || !bookingData.time) {
        throw new Error('Please complete all required fields');
      }

      // Combine date and time
      const [hours, minutes] = bookingData.time.split(':').map(Number);
      const scheduledAt = new Date(bookingData.date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const response = await fetch('/api/booking/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientInfo: bookingData.patientInfo,
          doctorId: bookingData.doctorId,
          locationId: bookingData.locationId,
          scheduledAt: scheduledAt.toISOString(),
          appointmentTypeId: bookingData.appointmentTypeId,
          reason: bookingData.reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      setConfirmationCode(data.appointment.confirmationCode);
      setCurrentStep(8);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 mx-1 rounded-full ${
                step <= currentStep
                  ? 'bg-electric'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-slate-400 text-sm">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Steps */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <DoctorSelector
              doctors={doctors}
              selectedDoctorId={bookingData.doctorId}
              onSelect={(doctorId) => {
                updateBookingData({ doctorId });
                nextStep();
              }}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <LocationSelector
              locations={locations}
              selectedLocationId={bookingData.locationId}
              onSelect={(locationId) => {
                updateBookingData({ locationId });
                nextStep();
              }}
              onBack={prevStep}
            />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-black text-white mb-6">Select Appointment Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointmentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      updateBookingData({ appointmentTypeId: type.id });
                      nextStep();
                    }}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      bookingData.appointmentTypeId === type.id
                        ? 'border-electric bg-electric/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-white mb-2">{type.name}</h3>
                    <p className="text-slate-400">{type.duration} minutes</p>
                  </button>
                ))}
              </div>
              <button
                onClick={prevStep}
                className="mt-6 px-6 py-3 text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 4 && bookingData.doctorId && bookingData.locationId && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CalendarPicker
              organizationId={organizationId}
              doctorId={bookingData.doctorId}
              locationId={bookingData.locationId}
              appointmentTypeId={bookingData.appointmentTypeId || undefined}
              selectedDate={bookingData.date}
              onSelect={(date) => {
                updateBookingData({ date });
                nextStep();
              }}
              onBack={prevStep}
            />
          </motion.div>
        )}

        {currentStep === 5 && bookingData.doctorId && bookingData.locationId && bookingData.date && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <TimeSlotPicker
              organizationId={organizationId}
              doctorId={bookingData.doctorId}
              locationId={bookingData.locationId}
              date={bookingData.date}
              appointmentTypeId={bookingData.appointmentTypeId || undefined}
              selectedTime={bookingData.time}
              onSelect={(time) => {
                updateBookingData({ time });
                nextStep();
              }}
              onBack={prevStep}
            />
          </motion.div>
        )}

        {currentStep === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-black text-white mb-6">Patient Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">First Name *</label>
                  <input
                    type="text"
                    value={bookingData.patientInfo.firstName}
                    onChange={(e) =>
                      updateBookingData({
                        patientInfo: { ...bookingData.patientInfo, firstName: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-navy border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={bookingData.patientInfo.lastName}
                    onChange={(e) =>
                      updateBookingData({
                        patientInfo: { ...bookingData.patientInfo, lastName: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-navy border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={bookingData.patientInfo.phone}
                    onChange={(e) =>
                      updateBookingData({
                        patientInfo: { ...bookingData.patientInfo, phone: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-navy border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={bookingData.patientInfo.email}
                    onChange={(e) =>
                      updateBookingData({
                        patientInfo: { ...bookingData.patientInfo, email: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-navy border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={bookingData.patientInfo.dateOfBirth}
                    onChange={(e) =>
                      updateBookingData({
                        patientInfo: { ...bookingData.patientInfo, dateOfBirth: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-navy border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!bookingData.patientInfo.firstName || !bookingData.patientInfo.lastName || !bookingData.patientInfo.phone}
                  className="ml-auto px-8 py-3 bg-electric text-white rounded-xl font-bold hover:bg-electric-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 7 && (
          <motion.div
            key="step7"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-black text-white mb-6">Additional Information</h2>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Reason for Visit (Optional)</label>
                <textarea
                  value={bookingData.reason}
                  onChange={(e) => updateBookingData({ reason: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-navy border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric"
                  placeholder="Please describe the reason for your visit..."
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="ml-auto px-8 py-3 bg-electric text-white rounded-xl font-bold hover:bg-electric-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      Confirm Booking <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 8 && confirmationCode && (
          <motion.div
            key="step8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-2xl text-center"
          >
            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">Appointment Confirmed!</h2>
            <p className="text-slate-400 mb-6">
              Your appointment has been successfully booked.
            </p>
            <div className="bg-navy p-6 rounded-xl mb-6">
              <p className="text-slate-400 text-sm mb-2">Confirmation Code</p>
              <p className="text-3xl font-black text-electric">{confirmationCode}</p>
            </div>
            <p className="text-slate-300 text-sm">
              You will receive a confirmation SMS shortly. Please save this confirmation code for your records.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
