import React from 'react';
import { Globe, Settings, Brain, Sparkles, Users, Clock, CheckCircle2, ChevronRight, CircuitBoard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function ServicesSection() {
  const { t, isRtl } = useLanguage();

  const stats = [
    { icon: Users, valueKey: 'services.stat.clients.value', labelKey: 'services.stat.clients.label', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { icon: Clock, valueKey: 'services.stat.support.value', labelKey: 'services.stat.support.label', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { icon: CheckCircle2, valueKey: 'services.stat.projects.value', labelKey: 'services.stat.projects.label', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
  ];

  const platformFeatures = [
    { icon: Settings, key: 'services.platform1', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    { icon: Globe, key: 'services.platform2', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { icon: Brain, key: 'services.platform3', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
  ];

  return (
    <section id="services" className="relative py-32 px-6 overflow-hidden scroll-mt-24" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0">
        <img src="/3.jpg" alt="Technology Background" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
            <CircuitBoard className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400 tracking-wider">
              {t('services.sectionPrefix')}{t('services.sectionTitle')}
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('services.sectionTitle')}
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
            {t('services.sectionSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="group relative text-center">
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8
                              hover:border-white/20 hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-500">
                  <div className={`w-16 h-16 rounded-full ${stat.bg} border ${stat.border}
                                flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-500`}>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                    {t(stat.valueKey)}
                  </div>
                  <div className="text-slate-500">{t(stat.labelKey)}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative mb-20">
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all duration-700">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="p-12 md:p-16 text-center">
              <div className="flex justify-center mb-8">
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-light max-w-4xl mx-auto">
                {t('services.intro')}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('services.platformTitle')}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group relative">
                  <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 h-full
                                hover:border-white/20 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-500 overflow-hidden">
                    <div className="absolute top-3 right-5 text-5xl font-black text-white/5 select-none">0{index + 1}</div>
                    <div className={`p-4 rounded-xl ${feature.bg} border ${feature.border} w-fit mb-6 group-hover:scale-110 transition-all duration-500`}>
                      <Icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <p className="text-lg text-slate-200 leading-relaxed">{t(feature.key)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all duration-700">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="p-12 md:p-16 text-center">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {t('services.cta.title')}
                  </span>
                </h3>
                <p className="text-xl text-white/60 mb-8 leading-relaxed">{t('services.cta.desc')}</p>
                <a href="mailto:simorgh.ekc.ai@gmail.com"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500
                             rounded-2xl text-white font-medium hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:scale-105">
                  <span>{t('services.cta.button')}</span>
                  <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isRtl ? 'scale-x-[-1]' : ''}`} />
                </a>
                <p className="text-sm text-slate-500 mt-6">{t('services.cta.note')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
