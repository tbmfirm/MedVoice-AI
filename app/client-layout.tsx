'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// Scroll to top on route change
const ScrollToTop = () => {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show Navbar/Footer for admin routes or login
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/logout');

  if (isAdminRoute) {
    // For admin routes, just render children without Navbar/Footer
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-electric selection:text-white">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <PageWrapper key={pathname}>{children}</PageWrapper>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

