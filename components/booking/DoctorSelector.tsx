'use client';

import React, { useState } from 'react';
import { User, Search } from 'lucide-react';

interface DoctorSelectorProps {
  doctors: Array<{
    id: string;
    name: string;
    firstName: string;
    lastName: string;
  }>;
  selectedDoctorId: string | null;
  onSelect: (doctorId: string) => void;
}

export default function DoctorSelector({
  doctors,
  selectedDoctorId,
  onSelect,
}: DoctorSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-card p-8 rounded-2xl">
      <h2 className="text-2xl font-black text-white mb-6">Select a Doctor</h2>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search doctors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-navy border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric"
        />
      </div>

      {/* Doctor List */}
      <div className="space-y-3">
        {filteredDoctors.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No doctors found</p>
        ) : (
          filteredDoctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => onSelect(doctor.id)}
              className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                selectedDoctorId === doctor.id
                  ? 'border-electric bg-electric/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-electric/20 flex items-center justify-center">
                  <User size={24} className="text-electric" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{doctor.name}</h3>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
