// =============================================================================
// Admin panel - the visual editor for writing and managing bilingual posts.
// Protected by a single owner login (credentials from env). Sessions are kept
// in memory (one small instance, single author), backed by an httpOnly cookie.
// Markdown editing happens client-side; this module renders the panel HTML and
// handles save / delete / upload / subscriber routes.
// =============================================================================
'use strict';

const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const express = require('express');

const db = require('./db');
const cache = require('./cache');
const { escapeHtml } = require('./templates');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

// token -> expiry timestamp
const sessions = new Map();

function newSession() {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}
function validSession(token) {
  const exp = sessions.get(token);
  if (!exp) return false;
  if (Date.now() > exp) { sessions.delete(token); return false; }
  return true;
}

// Constant-time-ish credential check.
function checkCredentials(user, pass) {
  if (!ADMIN_PASSWORD) return false;
  const a = Buffer.from(String(user));
  const b = Buffer.from(ADMIN_USER);
  const c = Buffer.from(String(pass));
  const d = Buffer.from(ADMIN_PASSWORD);
  const userOk = a.length === b.length && crypto.timingSafeEqual(a, b);
  const passOk = c.length === d.length && crypto.timingSafeEqual(c, d);
  return userOk && passOk;
}

function requireAuth(req, res, next) {
  if (validSession(req.cookies && req.cookies.sid)) return next();
  return res.redirect('/admin/login');
}

// ---------------------------------------------------------------------------
// Image upload (cover + in-article). Everything is re-encoded to WebP and
// width-capped, so heavy originals never reach the disk or the visitor.
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

async function saveImage(buffer) {
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.webp`;
  const outPath = path.join(db.UPLOAD_DIR, name);
  await sharp(buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath);
  return `/uploads/${name}`;
}

// ---------------------------------------------------------------------------
// HTML shell for admin pages
// ---------------------------------------------------------------------------
function adminShell(title, body) {
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(title)} — Simorgh Admin</title>
  <link rel="stylesheet" href="https://unpkg.com/easymde/dist/easymde.min.css" />
  <link rel="stylesheet" href="/blog-assets/admin.css" />
</head>
<body>
  <div class="admin-wrap">${body}</div>
  <script src="https://unpkg.com/easymde/dist/easymde.min.js"></script>
  <script src="/blog-assets/admin.js"></script>
</body>
</html>`;
}

function loginPage(error) {
  return adminShell('Login', `
    <div class="login-card">
      <h1>Simorgh Admin</h1>
      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
      <form method="post" action="/admin/login">
        <label>Username<input name="user" autocomplete="username" required /></label>
        <label>Password<input name="pass" type="password" autocomplete="current-password" required /></label>
        <button class="btn" type="submit">Sign in</button>
      </form>
    </div>`);
}

function dashboardPage(posts) {
  const rows = posts.length
    ? posts.map((p) => `
      <tr>
        <td>
          <strong>${escapeHtml(p.title_en || p.title_fa || '(untitled)')}</strong><br/>
          <span class="muted">${escapeHtml(p.slug)}</span>
        </td>
        <td><span class="badge ${p.status}">${p.status}</span></td>
        <td>${p.body_en ? 'EN' : ''} ${p.body_fa ? 'FA' : ''}</td>
        <td>${escapeHtml((p.updated_at || '').slice(0, 16))}</td>
        <td class="actions">
          <a class="link" href="/admin/edit/${p.id}">Edit</a>
          ${p.status === 'published' ? `<a class="link" href="/en/blog/${encodeURIComponent(p.slug)}" target="_blank">View</a>` : ''}
          <form method="post" action="/admin/delete/${p.id}" onsubmit="return confirm('Delete this post permanently?')">
            <button class="link danger" type="submit">Delete</button>
          </form>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="muted" style="padding:30px;text-align:center">No posts yet. Create your first one.</td></tr>`;

  return adminShell('Dashboard', `
    <header class="admin-top">
      <h1>Posts</h1>
      <div>
        <a class="btn ghost" href="/admin/subscribers">Subscribers</a>
        <a class="btn" href="/admin/new">+ New post</a>
        <a class="link" href="/admin/logout">Logout</a>
      </div>
    </header>
    <table class="admin-table">
      <thead><tr><th>Title</th><th>Status</th><th>Langs</th><th>Updated</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
}

function field(label, name, value, attrs = '') {
  return `<label class="field"><span>${label}</span><input name="${name}" value="${escapeHtml(value)}" ${attrs} /></label>`;
}

function editorPage(post) {
  const p = post || {
    id: '', slug: '', title_en: '', title_fa: '', summary_en: '', summary_fa: '',
    body_en: '', body_fa: '', cover_image: '', tags: '', author: 'Simorgh AI Team',
    source_name: '', source_url: '', status: 'draft',
  };
  return adminShell(p.id ? 'Edit post' : 'New post', `
    <header class="admin-top">
      <h1>${p.id ? 'Edit post' : 'New post'}</h1>
      <a class="link" href="/admin">← Back</a>
    </header>
    <form id="postForm" method="post" action="/admin/save">
      <input type="hidden" name="id" value="${escapeHtml(p.id)}" />
      <input type="hidden" name="body_en" id="body_en_input" />
      <input type="hidden" name="body_fa" id="body_fa_input" />
      <input type="hidden" name="cover_image" id="cover_image" value="${escapeHtml(p.cover_image)}" />

      <div class="row">
        ${field('Slug (URL, English, no spaces)', 'slug', p.slug, 'placeholder="a-new-age-of-nations"')}
        ${field('Author', 'author', p.author)}
      </div>
      <div class="row">
        ${field('Tags (comma separated)', 'tags', p.tags, 'placeholder="AI, Geopolitics"')}
        <label class="field"><span>Status</span>
          <select name="status">
            <option value="draft" ${p.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="published" ${p.status === 'published' ? 'selected' : ''}>Published</option>
          </select>
        </label>
      </div>
      <div class="row">
        ${field('Source name (attribution, optional)', 'source_name', p.source_name, 'placeholder="RAND — Michael J. Mazarr"')}
        ${field('Source URL (optional)', 'source_url', p.source_url, 'placeholder="https://www.rand.org/..."')}
      </div>

      <div class="field cover-field">
        <span>Cover image</span>
        <div class="cover-row">
          <img id="coverPreview" src="${escapeHtml(p.cover_image)}" alt="" class="${p.cover_image ? '' : 'hidden'}" />
          <input type="file" id="coverFile" accept="image/*" />
          <button type="button" class="btn ghost" onclick="document.getElementById('coverFile').click()">Upload cover</button>
        </div>
      </div>

      <div class="tabs">
        <button type="button" class="tab active" data-tab="en">English</button>
        <button type="button" class="tab" data-tab="fa">فارسی</button>
      </div>

      <div class="tab-pane" data-pane="en">
        ${field('Title (EN)', 'title_en', p.title_en)}
        ${field('Summary (EN)', 'summary_en', p.summary_en, 'placeholder="One-sentence summary for cards & SEO"')}
        <label class="field"><span>Body (EN — Markdown)</span><textarea id="body_en">${escapeHtml(p.body_en)}</textarea></label>
      </div>

      <div class="tab-pane hidden" data-pane="fa" dir="rtl">
        ${field('عنوان (فارسی)', 'title_fa', p.title_fa)}
        ${field('خلاصه (فارسی)', 'summary_fa', p.summary_fa, 'placeholder="خلاصه‌ی یک‌خطی برای کارت و سئو"')}
        <label class="field"><span>متن (فارسی — Markdown)</span><textarea id="body_fa">${escapeHtml(p.body_fa)}</textarea></label>
      </div>

      <div class="save-bar">
        <button class="btn" type="submit">Save</button>
        <span class="muted">Tip: use the toolbar for tables, code blocks and YouTube embeds.</span>
      </div>
    </form>`);
}

function subscribersPage(subs) {
  const rows = subs.length
    ? subs.map((s) => `<tr><td>${escapeHtml(s.email)}</td><td>${escapeHtml(s.lang)}</td><td>${escapeHtml(s.post_slug)}</td><td>${escapeHtml((s.created_at || '').slice(0, 16))}</td></tr>`).join('')
    : `<tr><td colspan="4" class="muted" style="padding:30px;text-align:center">No subscribers yet.</td></tr>`;
  return adminShell('Subscribers', `
    <header class="admin-top">
      <h1>Subscribers</h1>
      <a class="link" href="/admin">← Back</a>
    </header>
    <table class="admin-table">
      <thead><tr><th>Email</th><th>Lang</th><th>Article</th><th>When</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
function buildRouter() {
  const router = express.Router();

  router.get('/login', (req, res) => res.send(loginPage('')));

  router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
    if (checkCredentials(req.body.user, req.body.pass)) {
      const token = newSession();
      res.cookie('sid', token, { httpOnly: true, sameSite: 'lax', maxAge: SESSION_TTL_MS });
      return res.redirect('/admin');
    }
    res.status(401).send(loginPage('Invalid username or password.'));
  });

  router.get('/logout', (req, res) => {
    if (req.cookies && req.cookies.sid) sessions.delete(req.cookies.sid);
    res.clearCookie('sid');
    res.redirect('/admin/login');
  });

  // Everything below requires a valid session.
  router.use(requireAuth);

  router.get('/', (req, res) => res.send(dashboardPage(db.getAllPostsForAdmin())));
  router.get('/new', (req, res) => res.send(editorPage(null)));
  router.get('/edit/:id', (req, res) => {
    const post = db.getPostById(Number(req.params.id));
    if (!post) return res.redirect('/admin');
    res.send(editorPage(post));
  });

  router.post('/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'no file' });
      const url = await saveImage(req.file.buffer);
      res.json({ url });
    } catch (e) {
      res.status(500).json({ error: 'upload failed' });
    }
  });

  router.post('/save', express.urlencoded({ extended: true, limit: '5mb' }), (req, res) => {
    const b = req.body;
    let slug = String(b.slug || '').trim().toLowerCase()
      .replace(/[^a-z0-9؀-ۿ\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) slug = `post-${Date.now()}`;

    const id = Number(b.id) || 0;
    // Ensure slug uniqueness.
    let candidate = slug, n = 2;
    while (db.slugTaken(candidate, id)) candidate = `${slug}-${n++}`;
    slug = candidate;

    const status = b.status === 'published' ? 'published' : 'draft';
    const data = {
      slug,
      title_en: String(b.title_en || '').trim(),
      title_fa: String(b.title_fa || '').trim(),
      summary_en: String(b.summary_en || '').trim(),
      summary_fa: String(b.summary_fa || '').trim(),
      body_en: String(b.body_en || ''),
      body_fa: String(b.body_fa || ''),
      cover_image: String(b.cover_image || '').trim(),
      tags: String(b.tags || '').trim(),
      author: String(b.author || 'Simorgh AI Team').trim(),
      source_name: String(b.source_name || '').trim(),
      source_url: String(b.source_url || '').trim(),
      status,
    };

    if (id) {
      const existing = db.getPostById(id);
      data.id = id;
      data.published_at = status === 'published'
        ? (existing && existing.published_at) || new Date().toISOString()
        : (existing && existing.published_at) || null;
      db.updatePost(data);
    } else {
      data.published_at = status === 'published' ? new Date().toISOString() : null;
      db.createPost(data);
    }
    cache.clear(); // content changed: drop stale rendered pages
    res.redirect('/admin');
  });

  router.post('/delete/:id', (req, res) => {
    db.deletePost(Number(req.params.id));
    cache.clear();
    res.redirect('/admin');
  });

  router.get('/subscribers', (req, res) => res.send(subscribersPage(db.getAllSubscribers())));

  return router;
}

module.exports = { buildRouter };
