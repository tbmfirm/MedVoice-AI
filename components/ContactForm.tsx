'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

const ContactForm: React.FC = () => {
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
    const practiceName = (formData.get('practiceName') as string)?.trim() || '';
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
          practiceName: practiceName || undefined,
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
    <section id="consultation" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto glass rounded-[48px] overflow-hidden flex flex-col lg:flex-row shadow-3xl border-white/10">
          
          {/* Info Side */}
          <div className="lg:w-[40%] bg-gradient-to-br from-electric via-electric-deep to-navy p-12 md:p-20 text-white flex flex-col justify-between">
            <div>
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-10 backdrop-blur-md border border-white/20">
                    <Calendar size={32} className="text-white" />
                </div>
                <h3 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter leading-none">Book Your <br/> Audit Call.</h3>
                <p className="text-blue-100/80 text-lg leading-relaxed mb-12 font-medium">
                    Our experts will analyze your current patient intake process and show you exactly where AI can save you 15+ hours per week.
                </p>
                
                <div className="space-y-6">
                    {['24-hour turnaround', 'HIPAA assessment', 'Custom ROI report'].map(item => (
                        <div key={item} className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                            <Sparkles size={16} className="text-blue-200" /> {item}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-20 pt-10 border-t border-white/10 opacity-60">
                <p className="text-xs font-bold uppercase tracking-[0.2em]">Next Available: Today, 2:00 PM EST</p>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:w-[60%] p-12 md:p-20 bg-navy-light/20">
            {formState === 'success' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8">
                  <CheckCircle2 size={48} className="text-green-500" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Booking Confirmed!</h3>
                <p className="text-slate-400 font-medium">We'll be in touch shortly to schedule your audit call.</p>
                <button onClick={() => setFormState('idle')} className="mt-10 text-electric font-bold hover:underline">Book Another</button>
              </motion.div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                {formState === 'error' && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Full Name</label>
                    <input 
                      required
                      name="name"
                      type="text" 
                      placeholder="E.g. Dr. Sarah Chen"
                      className="w-full glass-card bg-white/5 px-6 py-5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-electric transition-all placeholder:text-slate-700"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Practice Name</label>
                    <input 
                      required
                      name="practiceName"
                      type="text" 
                      placeholder="Modern Heart Care"
                      className="w-full glass-card bg-white/5 px-6 py-5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-electric transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Work Email</label>
                  <input 
                    required
                    name="email"
                    type="email" 
                    placeholder="name@practice.com"
                    className="w-full glass-card bg-white/5 px-6 py-5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-electric transition-all placeholder:text-slate-700"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Current Call Volume</label>
                  <select name="callVolume" className="w-full glass-card bg-navy-dark px-6 py-5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-electric transition-all">
                    <option>0 - 50 calls/day</option>
                    <option>50 - 150 calls/day</option>
                    <option>150+ calls/day</option>
                  </select>
                </div>

                <div className="pt-6">
                  <button 
                    disabled={formState === 'sending'}
                    className="group w-full py-6 bg-white text-navy font-black rounded-[20px] shadow-2xl transition-all hover:bg-electric hover:text-white flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {formState === 'sending' ? 'Sending...' : 'Confirm Booking'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-center text-slate-500 text-[10px] mt-6 font-bold uppercase tracking-[0.2em]">No credit card required. HIPAA compliant.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
