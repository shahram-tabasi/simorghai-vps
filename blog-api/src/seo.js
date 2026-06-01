// =============================================================================
// SEO endpoints: a multilingual sitemap (with hreflang alternates), robots.txt
// and per-language RSS feeds. These are generated live from the database, so a
// newly published article is announced to search engines automatically.
// =============================================================================
'use strict';

const { LANGS } = require('./i18n');
const { hasLang } = require('./templates');

function xmlEscape(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(value) {
  if (!value) return new Date().toISOString();
  const d = new Date(value.replace(' ', 'T') + (String(value).includes('T') ? '' : 'Z'));
  return isNaN(d) ? new Date().toISOString() : d.toISOString();
}

// Build the XML sitemap. Each URL lists its hreflang siblings, which is what
// tells Google "these two pages are the same article in different languages".
function buildSitemap(siteUrl, allPosts) {
  const urls = [];

  // Landing homepage.
  urls.push({ loc: `${siteUrl}/` });

  // The two blog index pages.
  for (const lang of LANGS) {
    urls.push({
      loc: `${siteUrl}/${lang}/blog`,
      alternates: LANGS.map((l) => ({ lang: l, url: `${siteUrl}/${l}/blog` })),
    });
  }

  // Published articles, one entry per available language.
  for (const post of allPosts) {
    if (post.status !== 'published') continue;
    const available = LANGS.filter((l) => hasLang(post, l));
    for (const lang of available) {
      urls.push({
        loc: `${siteUrl}/${lang}/blog/${encodeURIComponent(post.slug)}`,
        lastmod: isoDate(post.updated_at || post.published_at || post.created_at),
        alternates: available.map((l) => ({
          lang: l,
          url: `${siteUrl}/${l}/blog/${encodeURIComponent(post.slug)}`,
        })),
      });
    }
  }

  const body = urls
    .map((u) => {
      const alts = (u.alternates || [])
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${xmlEscape(a.url)}" />`)
        .join('\n');
      return `  <url>
    <loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
${alts}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`;
}

function buildRobots(siteUrl) {
  // Explicitly welcome major AI / answer-engine crawlers so the site's content
  // can be read and cited by AI assistants, while keeping the admin panel out.
  const aiBots = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'Claude-Web', 'anthropic-ai',
    'PerplexityBot', 'Google-Extended', 'Applebot-Extended',
    'CCBot', 'Bytespider', 'Amazonbot', 'cohere-ai',
  ];
  const aiBlocks = aiBots
    .map((bot) => `User-agent: ${bot}\nAllow: /\nDisallow: /admin\n`)
    .join('\n');

  return `User-agent: *
Allow: /
Disallow: /admin

${aiBlocks}
Sitemap: ${siteUrl}/sitemap.xml
`;
}

function buildRss(siteUrl, lang, posts) {
  const items = posts
    .filter((p) => hasLang(p, lang))
    .slice(0, 20)
    .map((p) => {
      const url = `${siteUrl}/${lang}/blog/${encodeURIComponent(p.slug)}`;
      return `    <item>
      <title>${xmlEscape(p[`title_${lang}`])}</title>
      <link>${xmlEscape(url)}</link>
      <guid>${xmlEscape(url)}</guid>
      <pubDate>${new Date(isoDate(p.published_at || p.created_at)).toUTCString()}</pubDate>
      <description>${xmlEscape(p[`summary_${lang}`] || '')}</description>
    </item>`;
    })
    .join('\n');

  const title = lang === 'fa' ? 'بلاگ سیمرغ' : 'Simorgh AI Blog';
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
    <title>${title}</title>
    <link>${siteUrl}/${lang}/blog</link>
    <language>${lang === 'fa' ? 'fa-ir' : 'en-us'}</language>
${items}
</channel></rss>`;
}

module.exports = { buildSitemap, buildRobots, buildRss };
