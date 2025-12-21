'use client';

import React from 'react';
import { PhoneCall, Linkedin, Twitter, Instagram, ArrowUpRight } from 'lucide-react';
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
            <h5 className="text-white font-bold tracking-tight">Contact</h5>
            <div className="space-y-4 text-slate-500 font-medium">
              <p className="text-white">179 Trail lane, Markham ON</p>
              <p><a href="tel:+14372211910" className="hover:text-electric transition-colors">+1 437 2211910</a></p>
              <p><a href="mailto:masterawahab@gmail.com" className="hover:text-electric transition-colors">masterawahab@gmail.com</a></p>
              <p><a href="https://techbymaster.com" target="_blank" rel="noopener noreferrer" className="hover:text-electric transition-colors">techbymaster.com</a></p>
            </div>
            <div className="flex gap-6 text-slate-500">
                <a 
                  href="https://x.com/AAbdurrash" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-electric transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter size={20}/>
                </a>
                <a 
                  href="https://www.linkedin.com/in/abdul-wahab-abdurrasheed-6231341b9/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-electric transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20}/>
                </a>
                <a 
                  href="https://www.instagram.com/master_tecs/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-electric transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={20}/>
                </a>
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
