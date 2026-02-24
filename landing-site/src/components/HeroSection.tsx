import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ParticleBackground } from './ParticleBackground';
import { useLanguage } from '../contexts/LanguageContext';

export function HeroSection() {
  const { t, isRtl } = useLanguage();
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative w-full min-h-screen flex flex-col items-center justify-end overflow-hidden bg-navy-900">
      <div className="absolute inset-0 z-0">
        <img src="/23.jpg" alt="Simorgh AI Hero" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-transparent to-navy-900" />
        <div className="absolute inset-0 bg-navy-900/20" />
      </div>

      <ParticleBackground />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto pb-24 pt-[50vh] sm:pt-[60vh]">
        <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-4 relative">
          <span className="text-white" style={{ textShadow: '0 0 40px rgba(0,212,255,0.3), 0 0 80px rgba(123,47,247,0.2), 0 2px 4px rgba(0,0,0,0.8)' }}>
            {t('hero.title')}
          </span>
        </h1>
        <p className="text-sm sm:text-lg md:text-2xl text-gray-200 font-light tracking-widest mb-10 max-w-2xl mx-auto"
           style={{ textShadow: '0 0 20px rgba(0,212,255,0.2), 0 1px 3px rgba(0,0,0,0.8)' }}>
          {t('hero.subtitle')}
        </p>
        <div className="relative w-full max-w-4xl h-16 mb-10 flex justify-center items-end">
          <div className="absolute bottom-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#00d4ff,0_0_40px_#00d4ff]" />
          <div className="absolute bottom-0 w-[80%] h-[80px] bg-gradient-to-t from-cyan-500/15 to-transparent blur-xl rounded-t-full" />
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <button onClick={() => scrollTo('features')}
            className="group relative px-10 py-4 rounded-[14px] text-white font-semibold text-lg transition-all duration-300 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2ff7, #ff6fd8)', boxShadow: '0 0 20px rgba(0,212,255,0.4), 0 0 40px rgba(123,47,247,0.2)' }}>
            <span className="relative z-10 flex items-center gap-2">
              {t('hero.cta1')}
              <ArrowRight className={`w-5 h-5 transition-transform ${isRtl ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
            </span>
          </button>
          <button onClick={() => scrollTo('about')}
            className="group relative px-10 py-4 rounded-[14px] overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]">
            <div className="absolute inset-0 rounded-[14px] bg-gradient-to-r from-cyan-500 to-purple-600 p-[1px]">
              <div className="w-full h-full rounded-[13px] bg-navy-900/90 backdrop-blur-md" />
            </div>
            <span className="relative z-10 text-cyan-400 font-semibold text-lg group-hover:text-white transition-colors">
              {t('hero.cta2')}
            </span>
          </button>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-40 z-10">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
