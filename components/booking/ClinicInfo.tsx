'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Clock } from 'lucide-react';

interface ClinicInfoProps {
  organization: {
    id: string;
    name: string;
    specialty: string | null;
  };
  settings: {
    showServices: boolean;
    showDoctors: boolean;
    showLocations: boolean;
    customContent: string | null;
  };
  locations: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
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
    description: string | null;
  }>;
}

export default function ClinicInfo({
  organization,
  settings,
  locations,
  doctors,
  appointmentTypes,
}: ClinicInfoProps) {
  return (
    <section className="py-20 bg-navy-light">
      <div className="container mx-auto px-6">
        {/* Services/Specialties */}
        {settings.showServices && appointmentTypes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-black text-white mb-8">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointmentTypes.map((type) => (
                <div
                  key={type.id}
                  className="glass-card p-6 rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Clock size={20} className="text-electric" />
                    <h3 className="text-xl font-bold text-white">{type.name}</h3>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {type.duration} minutes
                  </p>
                  {type.description && (
                    <p className="text-slate-300 mt-2 text-sm">{type.description}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Doctors */}
        {settings.showDoctors && doctors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-black text-white mb-8">Our Doctors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="glass-card p-6 rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <User size={20} className="text-electric" />
                    <h3 className="text-xl font-bold text-white">{doctor.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Locations */}
        {settings.showLocations && locations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-black text-white mb-8">Our Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="glass-card p-6 rounded-2xl border border-white/10"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <MapPin size={20} className="text-electric mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{location.name}</h3>
                      <p className="text-slate-300 text-sm">
                        {location.address}
                        <br />
                        {location.city}, {location.state} {location.zipCode}
                      </p>
                      {location.phone && (
                        <p className="text-slate-400 text-sm mt-2">{location.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Custom Content */}
        {settings.customContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-2xl border border-white/10"
            dangerouslySetInnerHTML={{ __html: settings.customContent }}
          />
        )}
      </div>
    </section>
  );
}
