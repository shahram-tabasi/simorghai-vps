// =============================================================================
// Tiny in-memory page cache for server-rendered public pages.
// Rendering Markdown + sanitising on every request would waste CPU on a small
// VPS, so finished HTML is cached and only re-rendered when content changes
// (the admin clears the cache on every save/delete).
// =============================================================================
'use strict';

const store = new Map();
const TTL_MS = 1000 * 60 * 10; // safety expiry: 10 minutes

module.exports = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.exp) { store.delete(key); return null; }
    return entry.html;
  },
  set(key, html) {
    store.set(key, { html, exp: Date.now() + TTL_MS });
  },
  clear() {
    store.clear();
  },
};
