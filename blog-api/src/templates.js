// =============================================================================
// HTML templates for the public, server-rendered blog.
// Every page ships a complete <head> (title, description, canonical, OpenGraph,
// Twitter card, hreflang alternates and JSON-LD) so search engines and AI
// crawlers see real content - this is what makes the blog rank.
// Templates are plain string functions: no template engine, no client JS for
// rendering, which keeps the service light on a small VPS.
// =============================================================================
'use strict';

const { t, otherLang, strings } = require('./i18n');
const { renderMarkdown, toPlainText } = require('./content');

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function localized(post, lang, field) {
  return post[`${field}_${lang}`] || '';
}

// Does the post have a usable version in the given language?
function hasLang(post, lang) {
  return !!(post[`body_${lang}`] && post[`title_${lang}`]);
}

function formatDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('T') ? '' : 'Z'));
  if (isNaN(d)) return iso;
  try {
    return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

// ---------------------------------------------------------------------------
// Shared document shell
// ---------------------------------------------------------------------------
function layout({ lang, title, description, canonical, alternates, ogImage, jsonLd, bodyHtml }) {
  const s = strings[lang] || strings.en;
  const altTags = (alternates || [])
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${escapeHtml(a.url)}" />`)
    .join('\n  ');
  const xDefault = (alternates || []).find((a) => a.lang === 'en');

  return `<!doctype html>
<html lang="${s.htmlLang}" dir="${s.dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  ${altTags}
  ${xDefault ? `<link rel="alternate" hreflang="x-default" href="${escapeHtml(xDefault.url)}" />` : ''}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(s.siteName)}" />
  <meta property="og:locale" content="${s.locale}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ''}
  <meta name="theme-color" content="#02040a" />
  <link rel="icon" href="/simorgh.jpg" />
  <link rel="stylesheet" href="/blog-assets/blog.css" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body dir="${s.dir}">
  ${topbar(lang)}
  ${bodyHtml}
  ${footer(lang)}
  ${langBanner(lang)}
</body>
</html>`;
}

function topbar(lang) {
  const otherUrl = `/${otherLang(lang)}/blog`;
  return `<header class="topbar"><div class="inner">
    <a class="brand" href="/"><img src="/simorgh.jpg" alt="Simorgh AI" /><span>SIMORGH</span></a>
    <nav class="navlinks">
      <a href="/">${escapeHtml(t(lang, 'backToHome'))}</a>
      <a href="/${lang}/blog">${escapeHtml(t(lang, 'blog'))}</a>
      <a class="lang-pill" href="${otherUrl}">${escapeHtml(t(lang, 'otherLang'))}</a>
    </nav>
  </div></header>`;
}

function footer(lang) {
  const year = new Date().getFullYear();
  return `<footer class="site-foot"><div class="container">© ${year} ${escapeHtml(t(lang, 'siteName'))} — ${escapeHtml(t(lang, 'blogTitle'))}</div></footer>`;
}

// A small, dependency-free banner that suggests Persian to Persian-speaking
// visitors who landed on the English (default) site. Shown once per browser.
function langBanner(lang) {
  if (lang !== 'en') return '';
  return `<div class="lang-banner" id="langBanner">
    <span>${escapeHtml(t('en', 'switchPrompt'))}</span>
    <a class="btn" href="/fa/blog">${escapeHtml(t('en', 'switchYes'))}</a>
    <button class="btn ghost" type="button" onclick="dismissLangBanner()">${escapeHtml(t('en', 'switchNo'))}</button>
  </div>
  <script>
    (function () {
      try {
        if (localStorage.getItem('simorgh_lang_pref')) return;
        var langs = (navigator.languages || [navigator.language || '']).join(',').toLowerCase();
        if (langs.indexOf('fa') !== -1 || langs.indexOf('pe') !== -1) {
          var b = document.getElementById('langBanner');
          if (b) b.classList.add('show');
        }
      } catch (e) {}
    })();
    function dismissLangBanner() {
      try { localStorage.setItem('simorgh_lang_pref', 'en'); } catch (e) {}
      var b = document.getElementById('langBanner');
      if (b) b.classList.remove('show');
    }
  </script>`;
}

// ---------------------------------------------------------------------------
// Blog list page
// ---------------------------------------------------------------------------
function listPage(lang, posts, siteUrl) {
  const cards = posts.length
    ? `<div class="grid wide container">` + posts.map((p) => {
        const url = `/${lang}/blog/${encodeURIComponent(p.slug)}`;
        const title = escapeHtml(localized(p, lang, 'title'));
        const summary = escapeHtml(localized(p, lang, 'summary') || toPlainText(localized(p, lang, 'body')));
        const tags = (p.tags || '').split(',').map((x) => x.trim()).filter(Boolean);
        return `<article class="card">
          ${p.cover_image ? `<a href="${url}"><img class="cover" src="${escapeHtml(p.cover_image)}" alt="${title}" loading="lazy" /></a>` : ''}
          <div class="body">
            ${tags.length ? `<div class="tags">${tags.map((tg) => `<span class="tag">${escapeHtml(tg)}</span>`).join('')}</div>` : ''}
            <h2><a href="${url}">${title}</a></h2>
            <p class="summary">${summary}</p>
            <div class="meta">${escapeHtml(formatDate(p.published_at || p.created_at, lang))}</div>
          </div>
        </article>`;
      }).join('') + `</div>`
    : `<div class="container"><p style="text-align:center;color:#93a0b8;padding:60px 0">${escapeHtml(t(lang, 'noPosts'))}</p></div>`;

  const body = `
    <section class="page-head"><div class="container">
      <h1><span class="accent">${escapeHtml(t(lang, 'blogTitle'))}</span></h1>
      <p class="tagline">${escapeHtml(t(lang, 'blogTagline'))}</p>
    </div></section>
    ${cards}`;

  return layout({
    lang,
    title: `${t(lang, 'blogTitle')} | ${t(lang, 'siteName')}`,
    description: t(lang, 'blogTagline'),
    canonical: `${siteUrl}/${lang}/blog`,
    alternates: [
      { lang: 'en', url: `${siteUrl}/en/blog` },
      { lang: 'fa', url: `${siteUrl}/fa/blog` },
    ],
    bodyHtml: body,
  });
}

// ---------------------------------------------------------------------------
// Single article page
// ---------------------------------------------------------------------------
function articlePage(lang, post, siteUrl, captureEnabled) {
  const title = localized(post, lang, 'title');
  const summary = localized(post, lang, 'summary');
  const bodyHtml = renderMarkdown(localized(post, lang, 'body'));
  const description = summary || toPlainText(localized(post, lang, 'body'));
  const canonical = `${siteUrl}/${lang}/blog/${encodeURIComponent(post.slug)}`;
  const ogImage = post.cover_image ? `${siteUrl}${post.cover_image}` : '';
  const tags = (post.tags || '').split(',').map((x) => x.trim()).filter(Boolean);

  // hreflang alternates only for languages this post actually has.
  const alternates = [];
  if (hasLang(post, 'en')) alternates.push({ lang: 'en', url: `${siteUrl}/en/blog/${encodeURIComponent(post.slug)}` });
  if (hasLang(post, 'fa')) alternates.push({ lang: 'fa', url: `${siteUrl}/fa/blog/${encodeURIComponent(post.slug)}` });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    inLanguage: lang === 'fa' ? 'fa-IR' : 'en-US',
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: { '@type': 'Organization', name: post.author || 'Simorgh AI Team' },
    publisher: {
      '@type': 'Organization',
      name: 'Simorgh AI',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/simorgh.jpg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    ...(ogImage ? { image: [ogImage] } : {}),
    ...(tags.length ? { keywords: tags.join(', ') } : {}),
  };

  const sourceBox = post.source_name
    ? `<div class="source-box">${escapeHtml(t(lang, 'source'))}: ${
        post.source_url
          ? `<a href="${escapeHtml(post.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(post.source_name)}</a>`
          : escapeHtml(post.source_name)
      }</div>`
    : '';

  const capture = captureEnabled
    ? `<div class="capture">
        <h3>${escapeHtml(t(lang, 'getFull'))}</h3>
        <p>${escapeHtml(t(lang, 'getFullDesc'))}</p>
        <form id="captureForm" onsubmit="return submitCapture(event)">
          <input type="email" name="email" required placeholder="${escapeHtml(t(lang, 'emailPlaceholder'))}" />
          <button class="btn" type="submit">${escapeHtml(t(lang, 'subscribe'))}</button>
        </form>
        <p class="note" id="captureNote"></p>
      </div>
      <script>
        async function submitCapture(ev) {
          ev.preventDefault();
          var form = ev.target, note = document.getElementById('captureNote');
          var email = form.email.value.trim();
          if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
            note.className = 'note err'; note.textContent = ${JSON.stringify(t(lang, 'emailInvalid'))}; return false;
          }
          try {
            var res = await fetch('/subscribe', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email, lang: ${JSON.stringify(lang)}, slug: ${JSON.stringify(post.slug)} })
            });
            if (!res.ok) throw new Error('bad');
            note.className = 'note ok'; note.textContent = ${JSON.stringify(t(lang, 'subscribeOk'))};
            form.reset();
          } catch (e) {
            note.className = 'note err'; note.textContent = ${JSON.stringify(t(lang, 'subscribeErr'))};
          }
          return false;
        }
      </script>`
    : '';

  const body = `<article class="post"><div class="container">
    <a href="/${lang}/blog" style="color:#93a0b8;font-size:14px">← ${escapeHtml(t(lang, 'backToBlog'))}</a>
    ${tags.length ? `<div class="tags" style="margin-top:18px">${tags.map((tg) => `<span class="tag">${escapeHtml(tg)}</span>`).join('')}</div>` : ''}
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
      <span>${escapeHtml(t(lang, 'by'))} ${escapeHtml(post.author || 'Simorgh AI Team')}</span>
      <span>${escapeHtml(t(lang, 'publishedOn'))}: ${escapeHtml(formatDate(post.published_at || post.created_at, lang))}</span>
    </div>
    ${post.cover_image ? `<img class="cover" src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(title)}" />` : ''}
    <div class="prose">${bodyHtml}</div>
    ${sourceBox}
    ${capture}
  </div></article>`;

  return layout({
    lang,
    title: `${title} | ${t(lang, 'siteName')}`,
    description,
    canonical,
    alternates,
    ogImage,
    jsonLd,
    bodyHtml: body,
  });
}

module.exports = { layout, listPage, articlePage, escapeHtml, hasLang, formatDate };
