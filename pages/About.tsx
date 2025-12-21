
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Target, Sparkles } from 'lucide-react';
import Link from 'next/link';

const About: React.FC = () => {
  return (
    <div className="pt-32 pb-20 mesh-gradient">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mb-24"
        >
          <h1 className="text-6xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-none text-gradient">
            Engineering <br/> <span className="text-electric">Empathy.</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl">
            MedVoice AI was founded on a simple realization: medical staff are burnt out by administrative friction, and patients are tired of waiting on hold.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32 items-center">
            <div className="relative aspect-square glass rounded-[48px] overflow-hidden group">
                <img 
                    src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=2000" 
                    alt="Our Vision" 
                    className="w-full h-full object-cover grayscale opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                    <p className="text-white font-black text-3xl tracking-tight mb-2">Technology that listens.</p>
                    <p className="text-slate-300 font-medium">Designed by clinicians, for clinicians.</p>
                </div>
            </div>
            <div className="space-y-12">
                {[
                    { title: 'The Mission', desc: 'To eliminate wait times in healthcare through intelligent, empathetic automation that feels human.', icon: Target },
                    { title: 'The Philosophy', desc: 'We believe technology should enhance the doctor-patient relationship, not get in the way of it.', icon: Heart },
                    { title: 'The Result', desc: 'Lower burnout for clinic staff and immediate care for patients, 24 hours a day, 7 days a week.', icon: Sparkles }
                ].map((item, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-6 group"
                    >
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:border-electric transition-colors">
                            <item.icon className="text-electric w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-electric transition-colors">{item.title}</h3>
                            <p className="text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        <div className="glass-card p-12 md:p-20 rounded-[56px] text-center relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-electric/10 rounded-full blur-[80px] group-hover:bg-electric/20 transition-all duration-1000"></div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter relative z-10">Ready to see the future?</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto font-medium relative z-10">
                Our team is ready to build your custom clinical workflow. Let's reclaim your practice's time.
            </p>
            <div className="flex justify-center gap-6 relative z-10">
                <Link 
                  href="/contact" 
                  className="px-10 py-5 bg-electric text-white rounded-2xl font-black shadow-2xl shadow-electric/30 hover:scale-105 transition-transform active:scale-95"
                >
                    Book a Consultation
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default About;
