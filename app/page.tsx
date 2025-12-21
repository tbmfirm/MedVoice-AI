import Hero from '@/components/Hero';
import TrustSection from '@/components/TrustSection';
import Features from '@/components/Features';
import InteractiveMedia from '@/components/InteractiveMedia';
import Testimonials from '@/components/Testimonials';
import ContactForm from '@/components/ContactForm';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustSection />
      <Features />
      <InteractiveMedia />
      <Testimonials />
      <div id="contact-section">
        <ContactForm />
      </div>
    </>
  );
}

