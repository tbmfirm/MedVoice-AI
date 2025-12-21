'use client';

import React from 'react';
import { PhoneCall, Linkedin, Twitter, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-navy pt-32 pb-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-electric rounded-xl flex items-center justify-center shadow-lg shadow-electric/20">
                    <PhoneCall className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white">
                    MedVoice<span className="text-electric">AI</span>
                </span>
            </Link>
            <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-sm">
                Engineering empathy into every medical interaction.
            </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h5 className="text-white font-bold tracking-tight">Platform</h5>
            <ul className="space-y-4 text-slate-500 font-medium">
              <li><Link href="/solutions" className="hover:text-white transition-colors">Solutions</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2">Docs <ArrowUpRight size={14}/></a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h5 className="text-white font-bold tracking-tight">Company</h5>
            <ul className="space-y-4 text-slate-500 font-medium">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-8">
            <h5 className="text-white font-bold tracking-tight">Newsletter</h5>
            <div className="relative">
                <input 
                    type="email" 
                    placeholder="Enter email" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-electric transition-colors"
                />
                <button className="absolute right-2 top-2 bottom-2 bg-white text-navy px-4 rounded-lg font-bold text-xs">Join</button>
            </div>
            <div className="flex gap-6 text-slate-500">
                <a href="#" className="hover:text-white transition-colors"><Twitter size={20}/></a>
                <a href="#" className="hover:text-white transition-colors"><Linkedin size={20}/></a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-16 border-t border-white/5">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                © 2025 MedVoice AI Inc.
            </p>
            <div className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
