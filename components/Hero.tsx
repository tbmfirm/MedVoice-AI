'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';

const Hero: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-44 pb-32 overflow-hidden mesh-gradient">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 glass-card text-slate-300 text-xs font-bold uppercase tracking-[0.2em] mb-10 mx-auto">
            <Sparkles size={14} className="text-electric animate-pulse" />
            Empowering Modern Medicine
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-tighter mb-10 max-w-5xl mx-auto leading-[0.95] text-gradient">
            The Future of <br className="hidden md:block"/>
            <span className="text-electric inline-block">Patient Care.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
            Deploy hyper-realistic AI voice agents that handle your calls, scheduling, and admin tasks with medical-grade precision.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link 
              href="/contact" 
              className="group w-full sm:w-auto px-10 py-5 bg-white text-navy rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-electric hover:text-white shadow-2xl hover:shadow-electric/40 active:scale-95"
            >
              Request Free Audit <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={scrollToDemo}
              className="w-full sm:w-auto px-10 py-5 glass-card text-white rounded-2xl font-bold flex items-center justify-center gap-3 border border-white/10 hover:border-white/20 transition-all hover:bg-white/5 active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-electric flex items-center justify-center">
                <Play size={14} fill="white" className="ml-0.5" />
              </div>
              Watch Demo
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="mt-28 max-w-6xl mx-auto relative group"
        >
          <div className="absolute -inset-4 bg-electric/20 rounded-[48px] blur-3xl opacity-30 animate-pulse-slow group-hover:opacity-50 transition-opacity"></div>
          <div className="relative glass p-4 rounded-[40px] shadow-3xl overflow-hidden border border-white/10">
             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
             <img 
               src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" 
               alt="Healthcare Dashboard" 
               className="w-full rounded-[28px] object-cover aspect-video shadow-2xl grayscale-[0.2] contrast-[1.1] transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-[1.02]"
             />
             <div className="absolute bottom-12 left-12 flex items-center gap-4 bg-navy/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 animate-float shadow-2xl">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <div>
                    <p className="text-white font-bold text-sm tracking-tight">System Active</p>
                    <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">12.4k Calls Handled</p>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Background Floating Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-electric/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 -right-[10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px]"></div>
      </div>
    </section>
  );
};

export default Hero;
