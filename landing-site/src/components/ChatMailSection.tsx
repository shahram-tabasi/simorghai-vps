import React from 'react';
import { MessageCircle, Download, Smartphone, Monitor } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function ChatMailSection() {
  const { t, isRtl } = useLanguage();

  return (
    <section id="chatmail" className="relative py-24 px-6 overflow-hidden scroll-mt-24" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-navy-950 to-slate-900" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-20 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <MessageCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400 tracking-wider">Delta Chat</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              {t('chatmail.title')}
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('chatmail.desc')}</p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12
                        hover:border-green-500/30 transition-all duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Android APK - downloaded from our GitHub releases */}
            <a href="/downloads/deltachat-android.apk"
              className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-green-600/10 to-cyan-600/10
                         border border-white/10 hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/10
                         hover:translate-y-[-2px] transition-all duration-300">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">{t('chatmail.android')}</h3>
                <p className="text-sm text-slate-400">Delta Chat APK</p>
              </div>
              <Download className="w-5 h-5 text-green-400 group-hover:translate-y-1 transition-transform" />
            </a>

            {/* Desktop - downloaded from our GitHub releases */}
            <a href="/downloads/deltachat-desktop.AppImage"
              className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-600/10 to-blue-600/10
                         border border-white/10 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10
                         hover:translate-y-[-2px] transition-all duration-300">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Monitor className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">{t('chatmail.desktop')}</h3>
                <p className="text-sm text-slate-400">Delta Chat Desktop</p>
              </div>
              <Download className="w-5 h-5 text-cyan-400 group-hover:translate-y-1 transition-transform" />
            </a>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              {isRtl
                ? 'فایل‌های دانلود از مخزن گیت‌هاب ما میزبانی می‌شوند — بدون نیاز به اینترنت آزاد'
                : 'Download files are hosted from our GitHub repository — no free internet required'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
