// =============================================================================
// Content rendering - turns the Markdown stored in the database into safe HTML.
// Supports GitHub-flavoured tables, fenced code blocks with syntax
// highlighting, and YouTube embeds via the `@[youtube](VIDEO_ID)` shortcode.
// The output is sanitised so a compromised editor session cannot inject script.
// =============================================================================
'use strict';

const { Marked } = require('marked');
const hljs = require('highlight.js');
const sanitizeHtml = require('sanitize-html');

// A YouTube id is 11 url-safe characters. Accept either a bare id or a full
// watch/share URL pasted between the parentheses.
function extractYouTubeId(raw) {
  const value = String(raw || '').trim();
  const byId = value.match(/^[A-Za-z0-9_-]{11}$/);
  if (byId) return value;
  const byUrl = value.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return byUrl ? byUrl[1] : null;
}

// Custom Marked extension: `@[youtube](ID_OR_URL)` -> responsive 16:9 embed.
const youtubeExtension = {
  name: 'youtube',
  level: 'block',
  start(src) {
    return src.indexOf('@[youtube]');
  },
  tokenizer(src) {
    const rule = /^@\[youtube\]\(([^)]+)\)\s*(?:\n+|$)/;
    const match = rule.exec(src);
    if (match) {
      return { type: 'youtube', raw: match[0], videoId: extractYouTubeId(match[1]) };
    }
    return undefined;
  },
  renderer(token) {
    if (!token.videoId) return '';
    return (
      '<div class="video-embed">' +
      `<iframe src="https://www.youtube-nocookie.com/embed/${token.videoId}" ` +
      'title="YouTube video" loading="lazy" allowfullscreen ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">' +
      '</iframe></div>'
    );
  },
};

const marked = new Marked({
  gfm: true,
  breaks: false,
});
marked.use({ extensions: [youtubeExtension] });

// Highlight fenced code blocks at render time (no client-side JS needed).
marked.use({
  renderer: {
    // marked v14 passes the code token object: { text, lang, escaped }.
    code(token) {
      const code = token.text || '';
      const lang = (token.lang || '').match(/\S*/)[0];
      let highlighted;
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(code).value;
      }
      return `<pre class="code-block"><code class="hljs language-${lang || 'plain'}">${highlighted}</code></pre>`;
    },
  },
});

// Sanitiser whitelist: rich text plus tables, highlighted code, images, and
// the YouTube iframe produced above. Anything else is stripped.
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
    'blockquote', 'strong', 'em', 'del', 'code', 'pre', 'hr', 'br',
    'span', 'div', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'loading'],
    span: ['class'],
    div: ['class'],
    code: ['class'],
    pre: ['class'],
    td: ['align'],
    th: ['align'],
    iframe: ['src', 'title', 'allow', 'allowfullscreen', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedIframeHostnames: ['www.youtube-nocookie.com', 'www.youtube.com'],
  transformTags: {
    // Make outbound links safe and open in a new tab.
    a: (tagName, attribs) => {
      if (attribs.href && /^https?:\/\//i.test(attribs.href)) {
        attribs.target = '_blank';
        attribs.rel = 'noopener noreferrer';
      }
      return { tagName, attribs };
    },
    img: (tagName, attribs) => {
      attribs.loading = 'lazy';
      return { tagName, attribs };
    },
  },
};

function renderMarkdown(markdownText) {
  if (!markdownText) return '';
  const rawHtml = marked.parse(markdownText);
  return sanitizeHtml(rawHtml, sanitizeOptions);
}

// Plain-text excerpt for meta descriptions when no summary is provided.
function toPlainText(markdownText, maxLen = 160) {
  const html = renderMarkdown(markdownText);
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + '…';
}

module.exports = { renderMarkdown, toPlainText, extractYouTubeId };
