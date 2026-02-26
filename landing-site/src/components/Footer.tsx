import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t, isRtl } = useLanguage();

  return (
    <footer id="contact" className="relative bg-navy-950 border-t border-white/5 pt-20 pb-10 scroll-mt-24" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/simorgh.jpg" alt="Simorgh AI Logo" className="w-10 h-10 rounded-full object-cover" />
              <span className="text-2xl font-bold tracking-wider text-white">SIMORGH AI</span>
            </div>
            <p className="text-gray-400 max-w-md text-lg font-light leading-relaxed">{t('footer.desc')}</p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg">{t('footer.platform')}</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#services" className="hover:text-cyan-400 transition-colors">{t('footer.solutions')}</a></li>
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">{t('footer.integration')}</a></li>
              <li><a href="#chatmail" className="hover:text-cyan-400 transition-colors">{t('chatmail.title')}</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('footer.docs')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg">{t('footer.company')}</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#about" className="hover:text-cyan-400 transition-colors">{t('nav.about')}</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('footer.careers')}</a></li>
              <li><Link to="/articles" className="hover:text-cyan-400 transition-colors">{t('nav.articles')}</Link></li>
              <li><a href="#contact" className="hover:text-cyan-400 transition-colors">{t('nav.contact')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm">{t('footer.copyright')}</p>
          <div className="flex gap-6">
            {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
              <a key={i} href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-cyan-500/20 transition-all">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
