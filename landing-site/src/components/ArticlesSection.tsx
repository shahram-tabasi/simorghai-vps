import React, { useEffect, useState } from 'react';
import { FileText, Download, BookOpen, Globe, Tag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Article {
  slug: string;
  title_en: string;
  title_fa: string;
  summary_en: string;
  summary_fa: string;
  author: string;
  date: string;
  tags: string[];
  files: {
    en: string;
    fa: string;
  };
}

export function ArticlesSection() {
  const { t, lang, isRtl } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/articles/api/manifest')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: Article[]) => {
        setArticles(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const getTitle = (a: Article) => (lang === 'fa' ? a.title_fa : a.title_en);
  const getSummary = (a: Article) => (lang === 'fa' ? a.summary_fa : a.summary_en);

  return (
    <section
      id="articles"
      className="relative py-20 px-6 overflow-hidden min-h-screen scroll-mt-24"
      dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950" />
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: `${300 + i * 200}px`,
                height: `${300 + i * 200}px`,
                border: '1px solid rgba(0, 212, 255, 0.2)',
                top: `${10 + i * 25}%`,
                left: `${60 + i * 10}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative max-w-6xl mx-auto mb-12 md:mb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">{t('articles.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg">
            {t('articles.sectionPrefix')}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {t('articles.sectionTitle')}
            </span>
          </h2>
          <p className="text-base md:text-xl text-gray-400 max-w-3xl mx-auto">
            {t('articles.sectionSubtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t('articles.noArticles')}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t('articles.noArticles')}</p>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {articles.map((article) => (
              <div
                key={article.slug}
                className="group glass-card rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300">
                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {getTitle(article)}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  {article.author && <span>{article.author}</span>}
                  {article.date && (
                    <span className="flex items-center gap-1">
                      {article.date}
                    </span>
                  )}
                </div>

                {/* Summary */}
                <p className="text-gray-300 leading-relaxed mb-6 flex-1">
                  {getSummary(article)}
                </p>

                {/* Download buttons */}
                <div className="flex flex-wrap gap-3 mt-auto">
                  <a
                    href={`/articles/files/${article.files.en}`}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                             bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30
                             text-cyan-300 text-sm font-medium
                             hover:from-cyan-500/30 hover:to-cyan-600/30 hover:border-cyan-400/50
                             hover:text-white transition-all duration-300">
                    <Globe className="w-4 h-4" />
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('articles.downloadEn')}</span>
                  </a>
                  <a
                    href={`/articles/files/${article.files.fa}`}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                             bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30
                             text-purple-300 text-sm font-medium
                             hover:from-purple-500/30 hover:to-purple-600/30 hover:border-purple-400/50
                             hover:text-white transition-all duration-300">
                    <Globe className="w-4 h-4" />
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('articles.downloadFa')}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
