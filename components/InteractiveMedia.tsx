'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Headset, Check } from 'lucide-react';
import Link from 'next/link';

const AudioDemoCard: React.FC<{ title: string; desc: string; duration: string; audioSrc: string }> = ({ title, desc, duration, audioSrc }) => {
  const [isActive, setIsActive] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = new Audio(audioSrc);
    audioElement.addEventListener('ended', () => setIsActive(false));
    setAudio(audioElement);

    return () => {
      audioElement.pause();
      audioElement.removeEventListener('ended', () => setIsActive(false));
    };
  }, [audioSrc]);

  const handleToggle = () => {
    if (!audio) return;
    
    if (isActive) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      audio.play();
    }
    setIsActive(!isActive);
  };

  return (
    <div className={`p-8 rounded-[32px] border transition-all duration-500 cursor-pointer ${
        isActive ? 'glass-card border-electric shadow-2xl' : 'bg-white/5 border-white/5 hover:border-white/10'
    }`}
    onClick={handleToggle}>
        <div className="flex justify-between items-start mb-8">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                isActive ? 'bg-electric scale-110' : 'bg-white/10'
            }`}>
                {isActive ? <Pause size={20} fill="white" className="text-white" /> : <Play size={20} fill="white" className="text-white ml-1" />}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{duration}</span>
        </div>
        <h4 className="text-white font-bold text-xl mb-2">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">{desc}</p>
        
        <div className="flex items-end gap-[3px] h-10 w-full overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={isActive ? { height: [4, Math.random() * 24 + 4, 4] } : { height: 4 }}
                    transition={isActive ? { repeat: Infinity, duration: 0.6 + Math.random() * 0.4 } : {}}
                    className={`flex-1 rounded-full transition-colors duration-500 ${isActive ? 'bg-electric' : 'bg-white/10'}`}
                />
            ))}
        </div>
    </div>
  );
};

const InteractiveMedia: React.FC = () => {
  return (
    <section id="demo" className="py-32 relative scroll-mt-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 text-electric font-bold uppercase tracking-widest text-xs mb-6">
                    <Headset size={16} /> Live Simulation
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter leading-none">
                    Unrivaled <br className="hidden md:block"/>
                    <span className="text-electric">Intelligence.</span>
                </h2>
                
                <div className="space-y-6 mb-12">
                    {[
                        'Natural inflection and emotional tone',
                        'Real-time appointment booking API',
                        'Emergency triage with instant escalation',
                        'Multi-language support (English, Spanish, French)'
                    ].map(item => (
                        <div key={item} className="flex items-center gap-4 text-slate-300 font-medium">
                            <div className="w-6 h-6 rounded-full bg-electric/20 flex items-center justify-center text-electric">
                                <Check size={14} />
                            </div>
                            {item}
                        </div>
                    ))}
                </div>

                <Link 
                  href="/contact" 
                  className="inline-block px-10 py-5 bg-electric text-white rounded-2xl font-bold shadow-2xl shadow-electric/30 hover:scale-105 transition-transform active:scale-95"
                >
                    Start Your Trial
                </Link>
            </div>

            <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <AudioDemoCard 
                  title="Clinic Reception" 
                  desc="Handling peak call volumes with ease." 
                  duration="0:45" 
                  audioSrc="/audio/clinic-reception.mp3"
                />
                <AudioDemoCard 
                  title="Patient Triage" 
                  desc="Screening symptoms and routing fast." 
                  duration="1:20" 
                  audioSrc="/audio/patient-triage.mp3"
                />
                <AudioDemoCard 
                  title="Emergency Call" 
                  desc="Rapid response and critical care routing." 
                  duration="0:38" 
                  audioSrc="/audio/emergency-call.mp3"
                />
                <div className="md:col-span-2 p-1 glass rounded-[32px] overflow-hidden group relative">
                    <div className="relative aspect-video rounded-[28px] overflow-hidden">
                        <img 
                            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=2000" 
                            alt="Video Thumbnail" 
                            className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-navy/60 flex items-center justify-center group-hover:bg-navy/40 transition-colors">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500 cursor-pointer">
                                <Play size={28} className="text-navy ml-1" fill="currentColor" />
                            </div>
                        </div>
                        <div className="absolute bottom-6 left-6 text-white pointer-events-none">
                            <p className="font-bold text-lg">See the Workflow</p>
                            <p className="text-xs opacity-70 uppercase tracking-widest font-medium">Demo Video • 2:40</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveMedia;
