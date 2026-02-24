import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function FeaturesSection() {
  const { t, isRtl } = useLanguage();

  const features = [
    {
      logo: '/simorgh.jpg',
      title: 'SIMORGH AI',
      subtitle: t('features.ai.title'),
      desc: t('features.ai.desc'),
      gradient: 'from-blue-600/20 to-cyan-600/20',
      link: '/chatbot/'
    },
    {
      logo: '/EPLANIX Design Suite.png',
      title: 'EPLANIX Design Suite',
      subtitle: t('features.ml.title'),
      desc: t('features.ml.desc'),
      gradient: 'from-purple-600/20 to-pink-600/20',
      link: '/simorgh-draft/'
    },
    {
      logo: '/EpalnLogo.jpg',
      title: 'EPLANIX',
      subtitle: t('features.data.title'),
      desc: t('features.data.desc'),
      gradient: 'from-amber-600/20 to-orange-600/20',
      link: '/eplanix/'
    }
  ];

  return (
    <section id="features" className="relative py-20 px-6 overflow-hidden min-h-screen scroll-mt-24" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0">
        <img src="/33.jpg" alt="Technology Background" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/30" />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute w-64 h-64 border border-white/10 rounded-full"
              style={{ top: `${i * 20}%`, left: `${i * 15}%`, transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto mb-10 md:mb-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg">
            {t('features.sectionPrefix')}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('features.sectionTitle')}
            </span>
          </h2>
          <p className="text-base md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
            {t('features.sectionSubtitle')}
          </p>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto flex flex-col gap-8 md:gap-12">
        {features.map((feature, index) => (
          <div key={index}
            className={`group relative flex flex-col md:flex-row items-stretch md:items-center
                       backdrop-blur-md border border-white/20 rounded-2xl md:rounded-3xl overflow-hidden
                       transition-all duration-500 hover:border-white/40 hover:shadow-2xl hover:shadow-black/30
                       min-h-0 md:min-h-[220px] bg-gradient-to-r ${feature.gradient}`}>

            <div className={`absolute top-3 md:top-4 ${isRtl ? 'left-4 md:left-8' : 'right-4 md:right-8'} text-6xl md:text-8xl font-black text-white/5 select-none pointer-events-none`}
                 style={{ direction: 'ltr' }}>
              0{index + 1}
            </div>

            <a href={feature.link}
              className={`absolute bottom-4 md:bottom-5 ${isRtl ? 'left-4 md:left-6' : 'right-4 md:right-6'}
                         z-20 flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5
                         bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white text-xs md:text-sm font-semibold
                         shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40
                         hover:scale-105 hover:from-cyan-400 hover:to-blue-500 active:scale-95
                         transition-all duration-300`}>
              <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>{t('features.launch')}</span>
            </a>

            <div className={`w-full md:w-[320px] h-[160px] md:h-[220px] flex items-center justify-center
                            bg-black/30 backdrop-blur-sm rounded-t-2xl md:rounded-t-none
                            ${isRtl ? 'md:rounded-r-3xl' : 'md:rounded-l-3xl'} flex-shrink-0 relative z-10`}>
              <img src={feature.logo} alt={feature.title}
                className="max-h-[120px] md:max-h-[160px] max-w-[70%] md:max-w-[85%] object-contain
                           transition-all duration-500 group-hover:scale-110 group-hover:rotate-2 drop-shadow-2xl" />
            </div>

            <div className="flex-1 px-5 md:px-12 py-6 pb-16 md:py-8 relative z-10">
              <h3 className={`text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4 tracking-wide
                             transition-all duration-300 ${isRtl ? 'group-hover:-translate-x-2' : 'group-hover:translate-x-2'} drop-shadow-md`}>
                {feature.title}
              </h3>
              <p className="text-base md:text-xl text-white/95 mb-2 md:mb-3 font-semibold drop-shadow">
                {feature.subtitle}
              </p>
              <p className="text-sm md:text-lg text-white/90 leading-relaxed max-w-2xl drop-shadow">
                {feature.desc}
              </p>
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0
                          opacity-0 group-hover:opacity-100 transition-opacity duration-700
                          -translate-x-full group-hover:translate-x-full transform pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
}
