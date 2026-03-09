'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, Mail, MapPin, ArrowDown } from 'lucide-react';
import { applyBrandingStyles } from '@/lib/booking/landing-page';

interface ClinicLandingProps {
  organization: {
    id: string;
    name: string;
    specialty: string | null;
    practiceName: string | null;
    phone: string | null;
    email: string | null;
  };
  settings: {
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    backgroundColor: string | null;
    welcomeTitle: string | null;
    welcomeMessage: string | null;
    heroImageUrl: string | null;
    displayPhone: boolean;
    displayEmail: boolean;
    displayAddress: boolean;
  };
}

export default function ClinicLanding({ organization, settings }: ClinicLandingProps) {
  const styles = applyBrandingStyles(settings);
  const primaryColor = settings.primaryColor || '#2563eb';

  const scrollToBooking = () => {
    const element = document.getElementById('booking-wizard');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Image Background */}
      {settings.heroImageUrl && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${settings.heroImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2,
          }}
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy/90 to-navy z-0" />

      <div className="container mx-auto px-6 relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          {settings.logoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <img
                src={settings.logoUrl}
                alt={organization.name}
                className="h-24 mx-auto object-contain"
              />
            </motion.div>
          )}

          {/* Welcome Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter"
          >
            {settings.welcomeTitle || 'Book an Appointment'}
          </motion.h1>

          {/* Welcome Message */}
          {settings.welcomeMessage && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed"
            >
              {settings.welcomeMessage}
            </motion.p>
          )}

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 mb-12"
          >
            {settings.displayPhone && organization.phone && (
              <div className="flex items-center gap-2 text-slate-300">
                <Phone size={20} />
                <span>{organization.phone}</span>
              </div>
            )}
            {settings.displayEmail && organization.email && (
              <div className="flex items-center gap-2 text-slate-300">
                <Mail size={20} />
                <span>{organization.email}</span>
              </div>
            )}
          </motion.div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            onClick={scrollToBooking}
            className="group px-12 py-6 bg-white text-navy font-black rounded-2xl hover:bg-electric hover:text-white transition-all shadow-2xl flex items-center gap-3 mx-auto"
            style={{
              backgroundColor: primaryColor,
              color: 'white',
            }}
          >
            <Calendar size={24} />
            Book Appointment
            <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
