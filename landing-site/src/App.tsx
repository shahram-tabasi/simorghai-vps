import React from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { ServicesSection } from './components/ServicesSection';
import { AboutSection } from './components/AboutSection';
import { ChatMailSection } from './components/ChatMailSection';
import { Footer } from './components/Footer';
import { ChatWidget } from './components/ChatWidget';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const { isRtl } = useLanguage();
  return (
    <main
      className={`min-h-screen bg-navy-950 text-white selection:bg-cyan-500/30 ${isRtl ? 'font-[Shabnam]' : 'font-sans'}`}
      dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ServicesSection />
      <AboutSection />
      <ChatMailSection />
      <Footer />
      <ChatWidget />
    </main>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
