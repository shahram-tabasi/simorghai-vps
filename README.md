# simorghai-vps

Self-contained Docker Compose deployment for the Simorgh AI landing platform on a VPS.

## Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  nginx-proxy (80/443)                                   │
│  TLS termination & routing                              │
├─────────────────────────────────────────────────────────┤
│  /               → Landing Site (React/Vite)            │
│  /api/chat       → Chatbot API (OpenAI)                 │
│  /en/blog, /fa/blog → Blog API (SSR bilingual blog)     │
│  /admin          → Blog API (visual admin panel)        │
│  /sitemap.xml, /robots.txt → Blog API (SEO)             │
│  /chatbot/*      → RP → simorghai.electrokavir.com      │
│  /eplanix/*      → RP → simorghai.electrokavir.com      │
│  /simorgh-draft/*→ RP → simorghai.electrokavir.com      │
└─────────────────────────────────────────────────────────┘
```

## Services

| Service | Description | Port |
|---|---|---|
| **nginx-proxy** | TLS termination, reverse proxy to EKC products & local services | 80, 443 |
| **landing-site** | Simorgh AI marketing website with product cards | internal |
| **chatbot-api** | OpenAI-powered product support chatbot | internal |
| **blog-api** | Bilingual (EN/FA) server-rendered SEO blog + visual admin panel (SQLite) | internal |

## Features

- **Product Cards**: 3 products (Simorgh AI, EPLANIX Design Suite, EPLANIX) — "Launch App" buttons reverse-proxy to `simorghai.electrokavir.com`
- **AI Chat Widget**: Floating chatbot powered by the OpenAI API with full product knowledge
- **Bilingual Blog (SEO)**: Server-rendered articles in English (default) and Persian (RTL),
  with per-language meta tags, OpenGraph, `hreflang` alternates, JSON-LD Article schema,
  auto-generated `sitemap.xml` / `robots.txt` and RSS feeds — built to rank.
- **Visual Admin Panel** (`/admin`): write bilingual posts in a Markdown editor with tables,
  code blocks, YouTube embeds and image upload (auto-converted to WebP); draft/publish workflow.
- **Email capture**: an opt-in "send me the full analysis" form on each article (stored in the
  DB; optionally relayed via external SMTP).
- **Bilingual UI**: English/Persian (Farsi) with RTL support across the whole site.

## Quick Start

On a fresh Ubuntu/Debian VPS, bootstrap the server first (installs Docker,
creates swap, configures the firewall):

```bash
git clone https://github.com/shahram-tabasi/simorghai-vps.git
cd simorghai-vps
sudo bash scripts/vps-setup.sh
```

Then configure and launch:

```bash
# 1. Clone
git clone https://github.com/shahram-tabasi/simorghai-vps.git
cd simorghai-vps

# 2. Configure
cp .env.example .env
# Edit .env — at minimum set:
#   OPENAI_API_KEY        (chat widget)
#   BLOG_ADMIN_PASSWORD   (admin panel login)
#   BLOG_SESSION_SECRET   (any long random string)

# 3. Build the local images and start
docker compose up -d --build

# 4. Verify
docker compose ps
curl http://localhost/health
```

> **Note:** the four application images (`simorgh-nginx`, `simorgh-landing`,
> `simorgh-chatbot-api`, `simorgh-blog-api`) are **built on this server** from the
> Dockerfiles in this repo — they are never pulled from a registry. The
> `pull access denied for simorgh-… repository does not exist` lines you may see
> on a plain `docker compose up -d` are harmless: Compose tries a registry pull
> first, then falls back to building. Passing `--build` skips that and builds
> directly. The only image pulled from a registry is the official, public
> `certbot/certbot`.

The blog ships with one ready-made bilingual article on first run, so it is never
blank. Sign in at `https://<DOMAIN>/admin` to write more.

## Blog & Admin Panel

- Public blog: `https://<DOMAIN>/en/blog` and `https://<DOMAIN>/fa/blog`
  (English is the default; Persian-speaking visitors are gently offered a switch).
- Admin panel: `https://<DOMAIN>/admin` — log in with `BLOG_ADMIN_USER` /
  `BLOG_ADMIN_PASSWORD` from `.env`.
- Each post stores both languages side by side; leaving one language empty simply
  means it is not published in that language.
- Content, the SQLite database and uploaded images persist in the `blog_data`
  Docker volume.
- The email-capture form works without SMTP (leads are stored). To actually send
  mail, set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM` in `.env`.

> **Content note:** publish original content (or short, clearly-attributed quotes
> with a link to the source). Republishing third-party articles in full is both a
> copyright risk and bad for SEO (search engines down-rank duplicated content).

## SSL

TLS is handled entirely by Docker Compose using Let's Encrypt with the
HTTP-01 webroot challenge. `docker compose up -d` is sufficient — there is
nothing to run by hand.

Three single-purpose services, plus an in-container reloader:

| Service             | Lifecycle      | Role                                                                 |
|---------------------|----------------|----------------------------------------------------------------------|
| `certbot-bootstrap` | one-shot       | Drops a 1-day self-signed cert so `nginx-proxy` can boot its HTTPS block |
| `nginx-proxy`       | long-running   | Serves traffic; runs `inotifywait` on `/etc/letsencrypt/live` and `nginx -s reload`s on change |
| `certbot-init`      | one-shot       | After nginx is healthy, requests the real LE cert via webroot. Idempotent (marker file). Always exits 0. |
| `certbot-renew`     | long-running   | Every 12h: renews if a real cert exists, otherwise retries issuance. Lets the deployment self-heal. |

Prerequisites:

- `DOMAIN` and `CERTBOT_EMAIL` set in `.env`.
- `DOMAIN` A/AAAA records pointing at this server's public IP.
- Port 80 reachable from the internet (Let's Encrypt validators hit
  `http://${DOMAIN}/.well-known/acme-challenge/...`). If you use Cloudflare
  in front of this server, set the proxy mode to "DNS only" (gray cloud)
  for the cert request, or switch to a DNS-01 challenge.

Tunable: `RENEW_INTERVAL` in `.env` (default `12h`).

Useful commands:

```bash
# Inspect cert / issuer / expiry
docker compose run --rm certbot-renew certbot certificates

# Force-renew now (e.g. after fixing DNS)
docker compose run --rm certbot-renew certbot renew --force-renewal --webroot -w /var/www/certbot

# Reset and re-request from scratch (wipes the volume — only do this if stuck)
docker compose down
docker volume rm simorghai-vps_certbot_certs
docker compose up -d
```

## Mail Server (optional)

A self-hosted mail server (SMTP + IMAP + antispam + DKIM) is available as a
**separate, opt-in** compose project under [`mail/`](mail/). It uses
[docker-mailserver](https://docker-mailserver.github.io/docker-mailserver/)
(chosen over mailcow/Mailu because it fits a 1 vCPU / 2 GB VPS and does not use
ports 80/443, so it coexists with the web stack). It reuses this stack's
Let's Encrypt certificate volume for TLS.

> Self-hosting mail requires outbound port 25 open, a matching rDNS/PTR record,
> and SPF/DKIM/DMARC DNS records. See [`mail/README.md`](mail/README.md) for the
> full runbook and prerequisites before starting it.

## Directory Structure

```
simorghai-vps/
├── docker-compose.yml
├── .env.example
├── landing-site/               # React/Vite landing page
│   ├── Dockerfile
│   ├── src/components/
│   │   ├── FeaturesSection.tsx    # Product cards → EKC reverse proxy
│   │   ├── ChatWidget.tsx         # OpenAI-powered AI chat
│   │   ├── ArticlesSection.tsx    # Latest blog posts (from blog-api)
│   │   └── ...
│   └── public/
├── chatbot-api/                # OpenAI chat proxy
│   ├── Dockerfile
│   └── server.js
├── blog-api/                   # Bilingual SEO blog + admin (Node + SQLite)
│   ├── Dockerfile
│   ├── package.json
│   ├── public/                   # blog.css, admin panel assets, logo
│   └── src/
│       ├── server.js             # routes + page cache
│       ├── db.js                 # SQLite (WAL) schema & queries
│       ├── templates.js          # SSR HTML + full SEO head
│       ├── content.js            # Markdown → safe HTML (tables/code/YouTube)
│       ├── admin.js              # /admin panel + auth + uploads
│       ├── seo.js                # sitemap / robots / RSS
│       ├── seed.js               # first-run article
│       └── ...
├── nginx/
│   ├── Dockerfile                 # nginx:alpine + inotify-tools
│   ├── nginx.conf
│   └── templates/
│       └── default.conf.template  # ${DOMAIN} substituted at boot
├── scripts/
│   ├── certbot-bootstrap.sh       # one-shot: temp self-signed cert
│   ├── certbot-init.sh            # one-shot: real LE cert via webroot
│   ├── certbot-renew.sh           # long-running: 12h renew/retry loop
│   └── nginx-reload-watcher.sh    # in-container inotify reloader
└── .github/workflows/
```
