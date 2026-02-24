import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, Cpu, Sparkles, Zap } from 'lucide-react';

export function AboutSection() {
  const { t, isRtl } = useLanguage();

  return (
    <section id="about" className="relative py-32 px-6 overflow-hidden scroll-mt-24" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0">
        <img src="/33.jpg" alt="Technology Background" className="w-full h-full object-cover opacity-30" style={{ transform: 'rotate(180deg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900" />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute w-64 h-64 border border-white/5 rounded-full"
            style={{ top: `${i * 20}%`, left: `${i * 15}%`, transform: 'translate(-50%, -50%)' }} />
        ))}
      </div>

      <div className="absolute top-20 left-10 text-cyan-500/20 animate-pulse"><Cpu size={40} /></div>
      <div className="absolute bottom-20 right-10 text-purple-500/20 animate-pulse"><Zap size={40} /></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 md:mb-6">
            {t('about.title1')}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('about.title2')}
            </span>
          </h2>
          <p className="text-base md:text-xl text-slate-300 max-w-3xl mx-auto">{t('about.sectionSubtitle')}</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mt-6" />
        </div>

        <div className="group relative backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden
                        bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40
                        hover:border-white/20 hover:shadow-2xl transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="absolute top-4 right-8 text-8xl font-black text-white/5 select-none">01</div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative p-6 sm:p-12 md:p-16">
            <div className="flex justify-center gap-4 mb-8">
              {[Sparkles, Cpu, Globe].map((Icon, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
              ))}
            </div>
            <div className="space-y-6 text-center">
              <p className="text-base md:text-xl text-slate-300 leading-relaxed font-light">{t('about.p1')}</p>
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
              </div>
              <p className="text-base md:text-xl text-slate-300 leading-relaxed font-light">{t('about.p2')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8 md:mt-12">
          {[t('about.badge.innovation'), t('about.badge.excellence'), t('about.badge.integrity')].map((item, i) => (
            <div key={i} className="px-3 sm:px-4 py-2 backdrop-blur-sm bg-white/5 rounded-full border border-white/10
                                  text-slate-400 text-xs sm:text-sm hover:border-blue-500/50 hover:text-blue-400 transition-all cursor-default">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
