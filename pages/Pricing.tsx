
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Sparkles, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const Pricing: React.FC = () => {
  return (
    <div className="pt-32 pb-20 mesh-gradient">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter text-gradient">
            Transparent <span className="text-electric">ROI.</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium leading-relaxed">
            MedVoice AI saves the average clinic over $4,000 per month in admin overhead. Our pricing is designed to scale with your volume.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-32">
          {[
            { 
              name: 'Clinic Essentials', 
              price: 'Custom Audit', 
              desc: 'For single-practitioner offices focusing on after-hours and weekend coverage.',
              features: ['1 Smart AI Voice Agent', 'Direct SMS Notifications', 'Basic Scheduling Bridge', '99.9% Uptime Guarantee'],
              cta: 'Request Essentials Audit',
              pop: false
            },
            { 
              name: 'Practice Growth', 
              price: 'Value Driven', 
              desc: 'For multi-clinician centers requiring deep EMR write-back and patient recall features.',
              features: ['Up to 3 AI Agents', 'Full EMR Integration', 'Automated Recall Workflows', 'Custom AI Voice Cloning', 'Dedicated Success Lead'],
              cta: 'Scale My Practice',
              pop: true
            },
            { 
              name: 'Health System', 
              price: 'Partner Level', 
              desc: 'For hospital networks and large multi-state medical groups with custom needs.',
              features: ['Unlimited Scale AI', 'HL7/FHIR Data Pipeline', 'On-Premise Deployment Ops', 'Advanced Compliance Reporting', 'White-Glove Implementation'],
              cta: 'Contact Enterprise',
              pop: false
            }
          ].map((tier, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-12 rounded-[40px] flex flex-col justify-between border-2 transition-all duration-500 ${
                tier.pop ? 'bg-navy border-electric shadow-3xl scale-105 z-10' : 'glass border-white/5 hover:border-white/20'
              }`}
            >
              {tier.pop && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-electric text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{tier.name}</h3>
                <p className="text-4xl font-black text-white mb-6 tracking-tighter">{tier.price}</p>
                <p className="text-slate-500 text-sm mb-10 font-medium leading-relaxed">{tier.desc}</p>
                
                <div className="space-y-4 mb-12">
                    {tier.features.map(feat => (
                        <div key={feat} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                            <Check size={14} className="text-electric flex-shrink-0" />
                            {feat}
                        </div>
                    ))}
                </div>
              </div>

              <Link href="/contact" className={`w-full py-5 rounded-2xl font-black text-center transition-all active:scale-95 ${
                tier.pop ? 'bg-white text-navy hover:bg-electric hover:text-white shadow-xl' : 'glass-card text-white hover:bg-white/5'
              }`}>
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Feature Grid Table Placeholder */}
        <div className="max-w-5xl mx-auto glass-card p-12 rounded-[40px] border-white/10 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="md:w-1/2">
                    <div className="flex items-center gap-2 text-electric font-bold uppercase tracking-widest text-xs mb-6">
                        <Shield size={16} /> Compliance Standard
                    </div>
                    <h4 className="text-3xl font-black text-white mb-4 tracking-tighter">Medical-Grade Security.</h4>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        We don't compromise. Every MedVoice AI plan includes HIPAA-compliant data encryption, automated BAA generation, and rigorous security audits.
                    </p>
                </div>
                <div className="md:w-1/2 grid grid-cols-2 gap-6">
                    {['SOC2 Type II', 'HIPAA Certified', 'GDPR Ready', '256-bit AES'].map(badge => (
                        <div key={badge} className="bg-white/5 px-6 py-4 rounded-xl border border-white/5 text-center text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center">
                            {badge}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
