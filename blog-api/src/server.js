// =============================================================================
// Simorgh AI Blog - main server.
// Serves a bilingual (English default, Persian supported) server-rendered blog
// for strong SEO, a visual admin panel at /admin, an email-capture endpoint,
// and live sitemap / robots / RSS. Designed to stay light on a small VPS:
// SQLite storage, in-memory page cache, no client-side rendering for content.
// =============================================================================
'use strict';

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const db = require('./db');
const cache = require('./cache');
const { LANGS, DEFAULT_LANG } = require('./i18n');
const { listPage, articlePage } = require('./templates');
const { buildSitemap, buildRobots, buildRss } = require('./seo');
const { mailerEnabled, notifyOwner } = require('./mailer');
const admin = require('./admin');

const PORT = Number(process.env.PORT) || 4000;
// SITE_URL is the public origin, used to build absolute SEO URLs.
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

const app = express();
app.disable('x-powered-by');
app.use(cookieParser());

// Baseline security headers (nginx adds more in production).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// --- Static assets ---------------------------------------------------------
// Brand assets (logo) come from the landing site's public dir at build time.
app.use('/blog-assets', express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d' }));
app.use('/uploads', express.static(db.UPLOAD_DIR, { maxAge: '30d' }));
app.use('/simorgh.jpg', express.static(path.join(__dirname, '..', 'public', 'simorgh.jpg')));

// --- Health ----------------------------------------------------------------
app.get('/health', (req, res) => res.type('text').send('healthy'));

// --- SEO endpoints ---------------------------------------------------------
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(buildRobots(SITE_URL));
});

app.get('/sitemap.xml', (req, res) => {
  const cached = cache.get('sitemap');
  if (cached) return res.type('application/xml').send(cached);
  const xml = buildSitemap(SITE_URL, db.getAllPostsForAdmin());
  cache.set('sitemap', xml);
  res.type('application/xml').send(xml);
});

app.get('/:lang/rss.xml', (req, res, next) => {
  const lang = req.params.lang;
  if (!LANGS.includes(lang)) return next();
  const xml = buildRss(SITE_URL, lang, db.getPublishedPosts(lang, 20, 0));
  res.type('application/xml').send(xml);
});

// --- Email capture ---------------------------------------------------------
app.post('/subscribe', express.json(), async (req, res) => {
  const email = String((req.body && req.body.email) || '').trim();
  const lang = LANGS.includes(req.body && req.body.lang) ? req.body.lang : DEFAULT_LANG;
  const slug = String((req.body && req.body.slug) || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid email' });
  }
  try {
    db.addSubscriber({ email, lang, post_slug: slug });
    // Best-effort notification; never fail the request if SMTP hiccups.
    if (mailerEnabled) notifyOwner({ email, lang, post_slug: slug }).catch(() => {});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// --- Admin -----------------------------------------------------------------
app.use('/admin', admin.buildRouter());

// --- Public blog -----------------------------------------------------------
// /blog -> default language index.
app.get('/blog', (req, res) => res.redirect(302, `/${DEFAULT_LANG}/blog`));

// /:lang/blog -> list
app.get('/:lang/blog', (req, res, next) => {
  const lang = req.params.lang;
  if (!LANGS.includes(lang)) return next();
  const key = `list:${lang}`;
  const cached = cache.get(key);
  if (cached) return res.type('html').send(cached);
  const html = listPage(lang, db.getPublishedPosts(lang, 60, 0), SITE_URL);
  cache.set(key, html);
  res.type('html').send(html);
});

// /:lang/blog/:slug -> article
app.get('/:lang/blog/:slug', (req, res, next) => {
  const lang = req.params.lang;
  if (!LANGS.includes(lang)) return next();
  const slug = decodeURIComponent(req.params.slug);
  const key = `post:${lang}:${slug}`;

  const cached = cache.get(key);
  if (cached) return res.type('html').send(cached);

  const post = db.getPostBySlug(slug);
  // 404 if the post is missing, unpublished, or has no content in this language.
  if (!post || post.status !== 'published' || !post[`body_${lang}`] || !post[`title_${lang}`]) {
    return next();
  }
  // The capture form is always shown; subscribers are stored even if SMTP is
  // not configured, so no leads are lost.
  const html = articlePage(lang, post, SITE_URL, true);
  cache.set(key, html);
  res.type('html').send(html);
});

// --- 404 -------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).type('html').send(
    `<!doctype html><html><head><meta charset="utf-8"><title>Not found</title></head>` +
    `<body style="background:#02040a;color:#e7ecf5;font-family:system-ui;text-align:center;padding:80px">` +
    `<h1>404</h1><p>Page not found.</p><p><a style="color:#00d4ff" href="/${DEFAULT_LANG}/blog">Go to the blog</a></p>` +
    `</body></html>`
  );
});

app.listen(PORT, () => {
  console.log(`[blog-api] listening on :${PORT} (site: ${SITE_URL}, mailer: ${mailerEnabled ? 'on' : 'off'})`);
});
