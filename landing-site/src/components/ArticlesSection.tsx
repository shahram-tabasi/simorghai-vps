import React, { useEffect, useState } from 'react';
import { FileText, BookOpen, Tag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// A post as returned by the blog service's lightweight JSON feed
// (GET /:lang/blog.json). The full articles live on the server-rendered,
// SEO-optimised blog; this section just previews the latest few.
interface BlogPost {
  slug: string;
  url: string;
  title: string;
  summary: string;
  cover_image: string;
  date: string;
  tags: string[];
}

export function ArticlesSection() {
  const { t, lang, isRtl } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/${lang}/blog.json?limit=4`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: BlogPost[]) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [lang]);

  const ViewArrow = isRtl ? ArrowLeft : ArrowRight;
  const blogIndex = `/${lang}/blog`;
  const hasPosts = !loading && !error && posts.length > 0;

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

        {!loading && (error || posts.length === 0) && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t('articles.noArticles')}</p>
          </div>
        )}

        {hasPosts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {posts.map((post) => (
              <a
                key={post.slug}
                href={post.url}
                className="group glass-card rounded-2xl overflow-hidden flex flex-col transition-all duration-300
                           hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                {post.cover_image && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
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
                    {post.title}
                  </h3>

                  {/* Meta */}
                  {post.date && (
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <span>{post.date.slice(0, 10)}</span>
                    </div>
                  )}

                  {/* Summary */}
                  <p className="text-gray-300 leading-relaxed mb-6 flex-1">{post.summary}</p>

                  {/* Read more */}
                  <span className="inline-flex items-center gap-2 text-cyan-300 text-sm font-medium mt-auto">
                    {t('articles.readMore')}
                    <ViewArrow className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* View All Articles button -> full server-rendered blog */}
        {hasPosts && (
          <div className="text-center mt-12">
            <a
              href={blogIndex}
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full
                       bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold
                       shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]
                       hover:scale-105 transition-all duration-300">
              {t('articles.viewAll')}
              <ViewArrow className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
