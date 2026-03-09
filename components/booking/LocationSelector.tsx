'use client';

import React from 'react';
import { MapPin, ArrowLeft } from 'lucide-react';

interface LocationSelectorProps {
  locations: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  selectedLocationId: string | null;
  onSelect: (locationId: string) => void;
  onBack: () => void;
}

export default function LocationSelector({
  locations,
  selectedLocationId,
  onSelect,
  onBack,
}: LocationSelectorProps) {
  return (
    <div className="glass-card p-8 rounded-2xl">
      <h2 className="text-2xl font-black text-white mb-6">Select a Location</h2>

      <div className="space-y-3">
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => onSelect(location.id)}
            className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
              selectedLocationId === location.id
                ? 'border-electric bg-electric/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-4">
              <MapPin size={24} className="text-electric mt-1" />
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{location.name}</h3>
                <p className="text-slate-400 text-sm">{location.address}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-6 px-6 py-3 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <ArrowLeft size={20} />
        Back
      </button>
    </div>
  );
}
