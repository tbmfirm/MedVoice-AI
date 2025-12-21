'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('sending');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim() || '';
    const email = (formData.get('email') as string)?.trim() || '';
    const specialty = (formData.get('specialty') as string)?.trim() || '';
    const callVolume = (formData.get('callVolume') as string)?.trim() || '';

    // Client-side validation
    if (!name || !email) {
      setFormState('error');
      setErrorMessage('Name and email are required');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          specialty: specialty || undefined,
          callVolume: callVolume || undefined,
        }),
      });

      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        if (isJson) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            errorMessage = `Server error (${response.status}). Please try again.`;
          }
        } else {
          errorMessage = `Server error (${response.status}). Please make sure the server is running.`;
        }
        throw new Error(errorMessage);
      }

      // Success response
      if (isJson) {
        await response.json(); // Consume the response
      }

      setFormState('success');
      // Reset form using ref to avoid null reference errors
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error) {
      setFormState('error');
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage('Unable to connect to server. Please make sure the server is running on port 3001.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="pt-32 pb-20 mesh-gradient">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-10 tracking-tighter text-gradient">
                Let's <br/> <span className="text-electric text-glow">Connect.</span>
            </h1>
            <p className="text-slate-400 text-xl font-medium leading-relaxed mb-12 max-w-lg">
                Book your clinical automation audit today. Discover how 150+ clinics are reclaiming their time.
            </p>

            <div className="space-y-10">
                {[
                    { label: 'Address', value: '179 Trail lane, Markham ON', icon: MapPin },
                    { label: 'Email', value: 'masterawahab@gmail.com', icon: Mail },
                    { label: 'Phone', value: '+1 437 2211910', icon: Phone }
                ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-center group">
                        <div className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-electric group-hover:border-electric transition-all shadow-xl">
                            <item.icon size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{item.label}</p>
                            <p className="text-white font-bold text-xl group-hover:text-electric transition-colors">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-12 rounded-[48px] border-white/10 shadow-3xl relative overflow-hidden"
          >
            {formState === 'success' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8">
                  <CheckCircle2 size={48} className="text-green-500" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Audit Requested!</h3>
                <p className="text-slate-400 font-medium">One of our clinical automation leads will reach out within 2 hours.</p>
                <button onClick={() => setFormState('idle')} className="mt-10 text-electric font-bold hover:underline">Send another message</button>
              </motion.div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                {formState === 'error' && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                        <input required name="name" type="text" placeholder="Dr. Julian Vance" className="w-full glass-card bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-electric transition-all placeholder:text-slate-700" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Practice Specialty</label>
                        <input required name="specialty" type="text" placeholder="Cardiology" className="w-full glass-card bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-electric transition-all placeholder:text-slate-700" />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                    <input required name="email" type="email" placeholder="vance@clinic.md" className="w-full glass-card bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-electric transition-all placeholder:text-slate-700" />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Daily Call Volume</label>
                    <select name="callVolume" className="w-full glass-card bg-navy border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-electric transition-all">
                        <option>0-25 calls/day</option>
                        <option>25-100 calls/day</option>
                        <option>100-500 calls/day</option>
                        <option>500+ (Hospital level)</option>
                    </select>
                </div>
                <button 
                  disabled={formState === 'sending'}
                  className="group w-full py-6 bg-white text-navy font-black rounded-2xl hover:bg-electric hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {formState === 'sending' ? 'Securing Connection...' : 'Schedule My Audit'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 text-electric font-bold uppercase tracking-[0.3em] text-[10px] mb-4">
                    <HelpCircle size={16} /> Knowledge Base
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter">Support & Safety</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { q: "Data Sovereignty", a: "We offer private VPC deployments for enterprise partners ensuring data never leaves your infrastructure." },
                  { q: "Clinical Training", a: "Our AI is fine-tuned on medical ontologies to understand terminology across all major specialties." },
                  { q: "Voice Customization", a: "Clone your actual staff's voice (with consent) to maintain practice familiarity for long-term patients." },
                  { q: "API Documentation", a: "We provide comprehensive HL7/FHIR endpoint documentation for internal IT team integrations." }
                ].map((item, i) => (
                    <div key={i} className="glass-card p-10 rounded-[32px] border-white/5">
                        <h4 className="text-white font-bold mb-4 tracking-tight">{item.q}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.a}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
