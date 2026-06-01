import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { ServicesSection } from './components/ServicesSection';
import { AboutSection } from './components/AboutSection';
import { ArticlesSection } from './components/ArticlesSection';
import { Footer } from './components/Footer';
import { ChatWidget } from './components/ChatWidget';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// The old PDF-based /articles page is superseded by the server-rendered blog.
// Redirect any old links to the blog in the visitor's current language.
function BlogRedirect() {
  const { lang } = useLanguage();
  React.useEffect(() => {
    window.location.replace(`/${lang}/blog`);
  }, [lang]);
  return null;
}

function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ServicesSection />
      <AboutSection />
      <ArticlesSection />
      <Footer />
      <ChatWidget />
    </>
  );
}

function AppContent() {
  const { isRtl } = useLanguage();
  return (
    <main
      className={`min-h-screen bg-navy-950 text-white selection:bg-cyan-500/30 ${isRtl ? 'font-[Shabnam]' : 'font-sans'}`}
      dir={isRtl ? 'rtl' : 'ltr'}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles" element={<BlogRedirect />} />
      </Routes>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </BrowserRouter>
  );
}
