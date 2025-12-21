'use client';

import React from 'react';
import { motion } from 'framer-motion';

const logos = [
  { name: 'Twilio', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Twilio-logo-red.svg' },
  { name: 'ElevenLabs', url: 'https://cdn.worldvectorlogo.com/logos/elevenlabs.svg' },
  { name: 'n8n', url: 'https://cdn.worldvectorlogo.com/logos/n8n-io.svg' },
  { name: 'Google Workspace', url: 'https://cdn.worldvectorlogo.com/logos/google-workspace.svg' },
];

const TrustSection: React.FC = () => {
  return (
    <section className="py-24 border-y border-white/5 relative bg-navy/30">
      <div className="container mx-auto px-6 relative z-10">
        <p className="text-center text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mb-16 opacity-70">
          POWERING THE WORLD'S MOST EFFICIENT CLINICAL WORKFLOWS
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24">
          {logos.map((logo) => (
            <motion.div
                key={logo.name}
                whileHover={{ scale: 1.05, opacity: 1 }}
                className="flex items-center gap-3 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 cursor-default group"
            >
                <div className="w-10 h-10 glass-card rounded-xl overflow-hidden flex items-center justify-center p-2.5 group-hover:border-electric/50 transition-colors">
                    <img 
                      src={`https://picsum.photos/seed/${logo.name}/100`} 
                      alt={logo.name} 
                      className="w-full h-full object-contain filter brightness-200 contrast-100" 
                    />
                </div>
                <span className="text-lg font-black text-slate-300 tracking-tighter group-hover:text-white">{logo.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
