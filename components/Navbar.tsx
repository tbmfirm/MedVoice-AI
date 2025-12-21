
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneCall, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle Escape key to close menu
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Close mobile menu when route changes and handle body scroll lock
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'Solutions', href: '/solutions' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => pathname === path;

  const menuContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    },
    exit: {
      opacity: 0,
      transition: { staggerChildren: 0.05, staggerDirection: -1, when: "afterChildren" }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.6 }
    },
    exit: { 
      opacity: 0, 
      y: 15, 
      filter: 'blur(5px)',
      transition: { duration: 0.3 }
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-[cubic-bezier(0.21,0.47,0.32,0.98)] ${
        isScrolled ? 'py-3 md:py-2' : 'py-6 md:py-8'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.21,0.47,0.32,0.98)] rounded-[24px] md:rounded-[32px] flex justify-between items-center px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3.5 ${
            isScrolled || isMobileMenuOpen ? 'glass shadow-2xl border-white/10' : 'bg-transparent border-transparent'
        }`}>
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group relative z-[110]">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-electric rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-electric/20">
                    <PhoneCall className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">
                    MedVoice<span className="text-electric">AI</span>
                </span>
            </Link>

            {/* Desktop & Tablet Links - Optimized for iPad (md) */}
            <div className="hidden md:flex items-center gap-5 lg:gap-10">
                {navLinks.map((link) => (
                    <Link 
                        key={link.name} 
                        href={link.href} 
                        className={`transition-all text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] relative group py-2 ${
                          isActive(link.href) ? 'text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {link.name}
                        <span className={`absolute -bottom-1 left-0 h-0.5 bg-electric transition-all duration-500 rounded-full ${
                          isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full opacity-70'
                        }`}></span>
                    </Link>
                ))}
                <Link 
                    href="/contact" 
                    className="ml-2 lg:ml-4 bg-white text-navy font-black px-5 lg:px-8 py-2.5 lg:py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-electric hover:text-white shadow-xl hover:shadow-electric/30 active:scale-95 flex items-center gap-2"
                >
                    Book Audit <ArrowRight size={14} />
                </Link>
            </div>

            {/* Enhanced Mobile Toggle Button */}
            <button 
                className={`md:hidden relative z-[120] w-11 h-11 flex flex-col items-center justify-center gap-1.5 focus:outline-none rounded-full transition-all duration-500 ${
                  isMobileMenuOpen ? 'bg-electric shadow-xl scale-110' : 'bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
                {isMobileMenuOpen ? (
                  <X className="text-white w-6 h-6" />
                ) : (
                  <>
                    <span className="w-5 h-0.5 bg-white rounded-full"></span>
                    <span className="w-5 h-0.5 bg-white rounded-full"></span>
                    <span className="w-5 h-0.5 bg-white rounded-full"></span>
                  </>
                )}
            </button>
        </div>
      </div>

      {/* High-End Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] md:hidden h-screen w-screen"
          >
            {/* Dark Backdrop with heavy blur - Clicking this closes menu */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/98 backdrop-blur-3xl" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            <motion.div
              variants={menuContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative h-full flex flex-col justify-between px-8 py-28 sm:py-36 overflow-y-auto"
            >
              <div className="flex flex-col gap-6 sm:gap-8 mt-4">
                {navLinks.map((link) => (
                  <motion.div key={link.name} variants={menuItemVariants}>
                    <Link 
                      href={link.href} 
                      className={`text-5xl sm:text-6xl font-black tracking-tighter transition-all duration-500 inline-block group py-2 ${
                        isActive(link.href) ? 'text-electric' : 'text-white'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="relative inline-block">
                        {link.name}
                        <span className={`absolute bottom-0 left-0 w-full h-1 bg-electric transition-transform duration-500 origin-left ${isActive(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={menuItemVariants} className="mt-auto mb-4">
                <Link 
                  href="/contact" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group w-full bg-white text-navy p-6 sm:p-8 rounded-[32px] font-black text-xl sm:text-2xl flex items-center justify-between shadow-2xl active:scale-[0.98] transition-all overflow-hidden relative"
                >
                  <span className="relative z-10">Start Your Audit</span>
                  <div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 bg-electric text-white rounded-[20px] flex items-center justify-center group-hover:translate-x-2 transition-transform shadow-lg shadow-electric/20">
                    <ArrowRight size={28} />
                  </div>
                  <div className="absolute inset-0 bg-electric opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                </Link>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                   <div className="glass-card py-4 px-2 rounded-2xl text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-white/5">HIPAA Compliant</div>
                   <div className="glass-card py-4 px-2 rounded-2xl text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-white/5">HL7 Bridge</div>
                </div>

                {/* Close instruction for mobile users */}
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full mt-10 text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors py-4"
                >
                  Tap to close menu
                </button>
              </motion.div>
            </motion.div>
            
            {/* Background Decorations */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute bottom-[-10%] left-[-20%] w-[100%] aspect-square bg-electric/20 rounded-full blur-[120px] -z-10" 
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
              className="absolute top-[10%] right-[-10%] w-[60%] aspect-square bg-blue-900/10 rounded-full blur-[120px] -z-10" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
