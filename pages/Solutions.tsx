
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PhoneCall, Calendar, ClipboardCheck, Zap, ArrowRight, Settings, ShieldCheck, Database } from 'lucide-react';
import Link from 'next/link';

const workflowSteps = [
  {
    title: "Clinical Audit",
    desc: "We analyze your call logs and workflow bottlenecks to identify the highest-impact automation targets.",
    icon: Settings
  },
  {
    title: "HIPAA Security Mapping",
    desc: "Our engineers map the data flow to ensure end-to-end encryption and EMR compliance protocols.",
    icon: ShieldCheck
  },
  {
    title: "AI Personality Tuning",
    desc: "We voice-clone your preferred receptionist tone or select from our library of empathetic clinical voices.",
    icon: PhoneCall
  },
  {
    title: "EMR & API Bridge",
    desc: "Direct integration with your scheduling engine (Epic, Cerner, etc.) for real-time bi-directional sync.",
    icon: Database
  }
];

const Solutions: React.FC = () => {
  return (
    <div className="pt-32 pb-20 mesh-gradient">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter text-gradient">
            Clinical Workflow <span className="text-electric">Automation.</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium leading-relaxed">
            Engineered for the complexities of modern medicine. We build the "digital nervous system" for your front-office operations.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-32">
          {[
            { title: 'AI Reception', icon: PhoneCall, text: 'Handle 100% of inbound calls, FAQs, and routing without a human operator.' },
            { title: 'Recall Engine', icon: ClipboardCheck, text: 'Automated post-op calls to ensure recovery safety and reduce readmission rates.' },
            { title: 'Setter Pro', icon: Calendar, text: 'Interactive voice scheduling that handles reschedules as easily as new bookings.' }
          ].map((sol, idx) => (
            <motion.div key={idx} className="glass p-10 rounded-[40px] border-white/5 hover:border-electric/30 transition-all group">
              <div className="w-16 h-16 bg-electric/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <sol.icon className="text-electric w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{sol.title}</h3>
              <p className="text-slate-400 mb-8 leading-relaxed font-medium">{sol.text}</p>
              <Link href="/contact" className="inline-flex items-center gap-2 text-electric font-bold text-sm uppercase tracking-widest hover:gap-4 transition-all">
                Get This Solution <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Process Section */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4">The Implementation Pipeline</h2>
            <p className="text-slate-500 font-medium">From initial audit to "Live" in as little as 14 days.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {workflowSteps.map((step, i) => (
              <div key={i} className="relative">
                <div className="glass-card p-8 rounded-3xl h-full flex flex-col">
                  <span className="text-electric/20 text-6xl font-black absolute top-4 right-4 leading-none">0{i+1}</span>
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 relative z-10">
                    <step.icon className="text-white" size={24} />
                  </div>
                  <h4 className="text-white font-bold text-lg mb-3 relative z-10">{step.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium relative z-10">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EMR Integration Section */}
        <div className="glass rounded-[48px] p-12 md:p-20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter">
                    Native EMR <span className="text-slate-500 italic">Protocols.</span>
                </h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                    Our agents speak HL7 and FHIR natively. We don't just "scrape" your screen; we integrate with the core APIs of your patient management software.
                </p>
                <Link href="/contact" className="inline-block px-8 py-4 bg-white text-navy font-bold rounded-xl hover:bg-electric hover:text-white transition-all shadow-xl">
                    Request Integration Guide
                </Link>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                {['Epic Systems', 'Cerner Oracle', 'AthenaHealth', 'NextGen Healthcare', 'ModMed', 'Kareo'].map(name => (
                    <div key={name} className="glass-card px-6 py-8 rounded-2xl flex items-center justify-center text-center font-bold text-slate-300 hover:text-white hover:border-electric transition-all cursor-default">
                        {name}
                    </div>
                ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-electric/5 rounded-full blur-[100px]" />
        </div>
      </div>
    </div>
  );
};

export default Solutions;
