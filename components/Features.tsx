'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic2, Calendar, LayoutGrid, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'Smart Receptionist',
    description: 'Human-grade AI that handles scheduling, FAQs, and routing with 99% accuracy.',
    icon: Mic2,
    color: 'from-blue-500 to-cyan-400',
    span: 'md:col-span-2'
  },
  {
    title: 'HIPAA Secure',
    description: 'Military-grade encryption for all patient data.',
    icon: Shield,
    color: 'from-emerald-500 to-teal-400',
    span: 'md:col-span-1'
  },
  {
    title: 'EMR Sync',
    description: 'Syncs directly with Epic, Cerner, and more.',
    icon: Calendar,
    color: 'from-purple-500 to-indigo-400',
    span: 'md:col-span-1'
  },
  {
    title: 'Omnichannel',
    description: 'Voice, SMS, and Web integrated into one intelligent brain.',
    icon: LayoutGrid,
    color: 'from-rose-500 to-orange-400',
    span: 'md:col-span-2'
  }
];

const Features: React.FC = () => {
  return (
    <section id="solutions-overview" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-24">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-none">
            Advanced Tech. <br/>
            <span className="text-slate-500 italic">Human Connection.</span>
          </h2>
          <p className="text-slate-400 text-xl font-medium max-w-xl">
            We bridge the gap between efficiency and care with tools that empower your clinical staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.8 }}
              className={`${feature.span} group relative`}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 rounded-[32px] overflow-hidden" 
                   style={{ backgroundImage: `linear-gradient(to right, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})` }}></div>
              
              <Link href="/solutions" className="block h-full glass p-12 rounded-[32px] flex flex-col justify-between hover:translate-y-[-8px] transition-transform duration-500">
                <div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-10 shadow-lg shadow-white/5`}>
                    <feature.icon className="text-white w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-400 text-lg leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
                
                <div className="mt-12 flex items-center text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">
                  Explore Workflow <Zap size={14} className="ml-2 text-electric" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
