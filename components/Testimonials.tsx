'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Dr. Sarah Jenkins",
    role: "Chief of Staff, Metro Health",
    content: "MedVoice AI has fundamentally changed our patient intake. We've seen a 30% reduction in staff burnout because the AI handles the repetitive scheduling calls that used to bog us down.",
    image: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Mark Thompson",
    role: "Practice Manager, Apex Dermatology",
    content: "The EMR integration was seamless. Our AI assistant books directly into Modernizing Medicine, and the patient data accuracy is higher than when we did it manually.",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Dr. Julian Vance",
    role: "Founding Partner, Vance Cardiology",
    content: "The voice quality is startlingly human. Patients often don't realize they're speaking to an AI until the very end when it confirms the appointment. It's truly medical-grade tech.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            Voices of <span className="text-electric">Trust.</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium">
            Hear from the clinical leaders who are reclaiming their time and improving patient outcomes with MedVoice AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-10 rounded-[40px] border-white/5 relative flex flex-col justify-between hover:border-electric/20 transition-all group"
            >
              <Quote className="absolute top-10 right-10 text-white/5 w-20 h-20 group-hover:text-electric/10 transition-colors" />
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-electric text-electric" />)}
                </div>
                <p className="text-slate-300 text-lg leading-relaxed mb-10 italic relative z-10">
                  "{t.content}"
                </p>
              </div>
              <div className="flex items-center gap-4">
                <img src={t.image} alt={t.name} className="w-14 h-14 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all border border-white/10" />
                <div>
                  <h4 className="text-white font-bold">{t.name}</h4>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
