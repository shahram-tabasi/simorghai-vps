import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const toggleLanguage = () => setLang(lang === 'en' ? 'fa' : 'en');

  const scrollTo = (id: string) => {
    setIsOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNav = (id: string, link?: string) => {
    setIsOpen(false);
    if (link) {
      navigate(link);
    } else {
      scrollTo(id);
    }
  };

  useEffect(() => {
    const sections = ['hero', 'features', 'services', 'about', 'articles', 'chatmail', 'contact'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3 }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const navItems = [
    { id: 'hero', label: t('nav.home') },
    { id: 'features', label: t('nav.products') },
    { id: 'services', label: t('nav.solutions') },
    { id: 'about', label: t('nav.about') },
    { id: 'articles', label: t('nav.articles'), link: '/articles' },
    { id: 'contact', label: t('nav.contact') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto glass-panel rounded-full px-8 py-4 flex items-center justify-between">
        <button onClick={() => handleNav('hero')} className="flex items-center gap-3 cursor-pointer">
          <img src="/simorgh.jpg" alt="Simorgh AI Logo" className="w-10 h-10 rounded-full object-cover" />
          <span className="text-xl font-bold tracking-wider text-white">SIMORGH</span>
        </button>

        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id, item.link)}
              className={`text-sm font-medium transition-colors relative ${activeSection === item.id ? 'text-cyan-400' : 'text-gray-300 hover:text-cyan-400'}`}>
              {item.label}
              {activeSection === item.id && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={toggleLanguage} className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/10 transition-all">
            {lang === 'en' ? 'FA' : 'EN'}
          </button>
          <button onClick={() => scrollTo('features')} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:scale-105 transition-all duration-300">
            {t('nav.getStarted')}
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-24 left-6 right-6 glass-panel rounded-2xl p-6 flex flex-col gap-4 md:hidden">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => handleNav(item.id, item.link)}
              className={`py-2 font-medium text-start ${activeSection === item.id ? 'text-cyan-400' : 'text-gray-300 hover:text-cyan-400'}`}>
              {item.label}
            </button>
          ))}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button onClick={toggleLanguage} className="px-4 py-2 rounded-lg bg-white/10 text-sm font-bold text-white">
              {lang === 'en' ? 'فارسی' : 'English'}
            </button>
            <button onClick={() => scrollTo('features')} className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold shadow-lg">
              {t('nav.getStarted')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
