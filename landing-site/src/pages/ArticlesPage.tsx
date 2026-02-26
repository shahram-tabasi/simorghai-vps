import React, { useEffect, useState } from 'react';
import { FileText, Download, BookOpen, Tag, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export function ArticlesPage() {
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getTitle = (a: Article) => (lang === 'fa' ? a.title_fa : a.title_en);
  const getSummary = (a: Article) => (lang === 'fa' ? a.summary_fa : a.summary_en);
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div
      className="min-h-screen bg-navy-950 text-white"
      dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="relative bg-gradient-to-b from-navy-900 to-navy-950 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors mb-8">
            <BackArrow className="w-4 h-4" />
            <span className="text-sm font-medium">{t('nav.home')}</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <BookOpen className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              {t('articles.sectionPrefix')}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {t('articles.sectionTitle')}
              </span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">
            {t('articles.sectionSubtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
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
                className="group glass-card rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300
                           hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)]">
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
                <h2 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {getTitle(article)}
                </h2>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  {article.author && <span>{article.author}</span>}
                  {article.date && <span>{article.date}</span>}
                </div>

                {/* Summary */}
                <p className="text-gray-300 leading-relaxed mb-6 flex-1">
                  {getSummary(article)}
                </p>

                {/* Download buttons */}
                <div className="flex flex-wrap gap-3 mt-auto">
                  <a
                    href={`/articles/files/${encodeURI(article.files.en)}`}
                    download
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                             bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30
                             text-cyan-300 text-sm font-medium
                             hover:from-cyan-500/30 hover:to-cyan-600/30 hover:border-cyan-400/50
                             hover:text-white transition-all duration-300">
                    <FileText className="w-4 h-4" />
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF — {t('articles.downloadEn')}</span>
                  </a>
                  <a
                    href={`/articles/files/${encodeURI(article.files.fa)}`}
                    download
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                             bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30
                             text-purple-300 text-sm font-medium
                             hover:from-purple-500/30 hover:to-purple-600/30 hover:border-purple-400/50
                             hover:text-white transition-all duration-300">
                    <FileText className="w-4 h-4" />
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF — {t('articles.downloadFa')}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
