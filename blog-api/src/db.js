// =============================================================================
// Database layer - SQLite (better-sqlite3) in WAL mode.
// WAL keeps reads fast and memory use tiny, which suits a small VPS.
// The database file and uploaded images live under DATA_DIR (a Docker volume),
// so all content survives container restarts and rebuilds.
// =============================================================================
'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || '/data';
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

// Make sure the persistent directories exist before opening the database.
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'blog.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
// A post holds both languages side by side. Either language may be empty,
// in which case that language simply is not published for the post.
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT NOT NULL UNIQUE,
    title_en      TEXT NOT NULL DEFAULT '',
    title_fa      TEXT NOT NULL DEFAULT '',
    summary_en    TEXT NOT NULL DEFAULT '',
    summary_fa    TEXT NOT NULL DEFAULT '',
    body_en       TEXT NOT NULL DEFAULT '',
    body_fa       TEXT NOT NULL DEFAULT '',
    cover_image   TEXT NOT NULL DEFAULT '',
    tags          TEXT NOT NULL DEFAULT '',
    author        TEXT NOT NULL DEFAULT 'Simorgh AI Team',
    source_name   TEXT NOT NULL DEFAULT '',
    source_url    TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'draft',
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    published_at  TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status, published_at);

  CREATE TABLE IF NOT EXISTS subscribers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT NOT NULL,
    lang        TEXT NOT NULL DEFAULT 'en',
    post_slug   TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers (email);
`);

// ---------------------------------------------------------------------------
// Prepared statements / query helpers
// ---------------------------------------------------------------------------
const stmts = {
  insertPost: db.prepare(`
    INSERT INTO posts
      (slug, title_en, title_fa, summary_en, summary_fa, body_en, body_fa,
       cover_image, tags, author, source_name, source_url, status, published_at)
    VALUES
      (@slug, @title_en, @title_fa, @summary_en, @summary_fa, @body_en, @body_fa,
       @cover_image, @tags, @author, @source_name, @source_url, @status, @published_at)
  `),
  updatePost: db.prepare(`
    UPDATE posts SET
      slug=@slug, title_en=@title_en, title_fa=@title_fa,
      summary_en=@summary_en, summary_fa=@summary_fa,
      body_en=@body_en, body_fa=@body_fa,
      cover_image=@cover_image, tags=@tags, author=@author,
      source_name=@source_name, source_url=@source_url,
      status=@status, published_at=@published_at,
      updated_at=datetime('now')
    WHERE id=@id
  `),
  deletePost: db.prepare(`DELETE FROM posts WHERE id = ?`),
  getById: db.prepare(`SELECT * FROM posts WHERE id = ?`),
  getBySlug: db.prepare(`SELECT * FROM posts WHERE slug = ?`),
  slugExists: db.prepare(`SELECT id FROM posts WHERE slug = ? AND id != ?`),
  allForAdmin: db.prepare(`SELECT * FROM posts ORDER BY updated_at DESC`),
  insertSubscriber: db.prepare(`
    INSERT INTO subscribers (email, lang, post_slug) VALUES (@email, @lang, @post_slug)
  `),
  allSubscribers: db.prepare(`SELECT * FROM subscribers ORDER BY created_at DESC`),
};

// better-sqlite3 cannot bind a column name, so build the two language variants
// of the "published list" query up front (only the trusted 'en'/'fa' tokens
// are interpolated). Each returns published posts that have content in that
// language, newest first.
function publishedQuery(lang) {
  return db.prepare(`
    SELECT * FROM posts
    WHERE status = 'published' AND body_${lang} != ''
    ORDER BY COALESCE(published_at, created_at) DESC
    LIMIT ? OFFSET ?
  `);
}
const publishedQueries = {
  en: publishedQuery('en'),
  fa: publishedQuery('fa'),
};

module.exports = {
  db,
  DATA_DIR,
  UPLOAD_DIR,

  createPost(data) {
    return stmts.insertPost.run(data);
  },
  updatePost(data) {
    return stmts.updatePost.run(data);
  },
  deletePost(id) {
    return stmts.deletePost.run(id);
  },
  getPostById(id) {
    return stmts.getById.get(id);
  },
  getPostBySlug(slug) {
    return stmts.getBySlug.get(slug);
  },
  slugTaken(slug, exceptId = 0) {
    return !!stmts.slugExists.get(slug, exceptId);
  },
  getAllPostsForAdmin() {
    return stmts.allForAdmin.all();
  },
  getPublishedPosts(lang, limit = 50, offset = 0) {
    return (publishedQueries[lang] || publishedQueries.en).all(limit, offset);
  },
  addSubscriber(data) {
    return stmts.insertSubscriber.run(data);
  },
  getAllSubscribers() {
    return stmts.allSubscribers.all();
  },
};
