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
│  /api/chat       → Chatbot API (Anthropic Claude)       │
│  /downloads/*    → Delta Chat binaries (pre-downloaded) │
│  /chatbot/*      → RP → simorghai.electrokavir.com      │
│  /eplanix/*      → RP → simorghai.electrokavir.com      │
│  /simorgh-draft/*→ RP → simorghai.electrokavir.com      │
└─────────────────────────────────────────────────────────┘

Chatmail Relay: ports 25, 465, 587, 143, 993, 3478
```

## Services

| Service | Description | Port |
|---|---|---|
| **nginx-proxy** | TLS termination, reverse proxy to EKC products & local services | 80, 443 |
| **landing-site** | Simorgh AI marketing website with product cards | internal |
| **chatbot-api** | Anthropic Claude-powered product support chatbot | internal |
| **chatmail** | Privacy-focused email relay (Delta Chat compatible) | 25, 465, 587, 143, 993, 3478 |

## Features

- **Product Cards**: 3 products (Simorgh AI, EPLANIX Design Suite, EPLANIX) — "Launch App" buttons reverse-proxy to `simorghai.electrokavir.com`
- **AI Chat Widget**: Floating chatbot powered by Anthropic Claude API with full product knowledge
- **Bilingual**: English/Persian (Farsi) with RTL support
- **Delta Chat**: Pre-downloaded from GitHub (VPS has no free internet) via weekly CI workflow
- **Chatmail Relay**: Privacy-focused messaging service

## Quick Start

```bash
# 1. Clone
git clone https://github.com/shahram-tabasi/simorghai-vps.git
cd simorghai-vps

# 2. Configure
cp .env.example .env
# Edit .env — at minimum set ANTHROPIC_API_KEY

# 3. (Optional) Place Delta Chat binaries
mkdir -p delta-chat
# Place deltachat-android.apk and deltachat-desktop.AppImage in delta-chat/

# 4. Start
docker compose up -d

# 5. Verify
docker compose ps
curl http://localhost/health
```

## Delta Chat Downloads

The VPS has no free internet, so Delta Chat binaries are pre-downloaded.

**Option A: GitHub Actions (automatic)**
The `download-deltachat.yml` workflow runs weekly and publishes binaries as GitHub Release assets. Download and place in `delta-chat/`.

**Option B: Manual**
```bash
# On a machine with internet:
wget -O delta-chat/deltachat-android.apk "https://download.delta.chat/android/deltachat-android-latest.apk"
wget -O delta-chat/deltachat-desktop.AppImage "https://download.delta.chat/desktop/deltachat-desktop-latest.AppImage"
```

## Chatmail Setup

After the first start:
```bash
docker compose exec chatmail bash
./scripts/cmdeploy init chat.yourdomain.com
./scripts/cmdeploy run --ssh-host localhost
./scripts/cmdeploy dns --ssh-host localhost
```

## SSL

TLS is handled end-to-end by the `certbot` Docker Compose service using
Let's Encrypt with HTTP-01 webroot challenges. There is nothing to run
manually — `docker compose up -d` is enough.

How it works:

1. On first start, the `certbot` service drops a 1-day self-signed cert at
   `/etc/letsencrypt/live/${DOMAIN}/` so `nginx-proxy` can boot its HTTPS
   server block.
2. Once `nginx-proxy` is serving traffic on port 80, `certbot` runs the
   ACME HTTP-01 challenge and replaces the dummy with the real cert.
3. `certbot` then loops every 12 hours running `certbot renew`. Renewals
   are no-ops until the cert is within 30 days of expiry.
4. `nginx-proxy` runs a watcher that polls `fullchain.pem`'s mtime once a
   minute and runs `nginx -s reload` whenever it changes — issuance and
   renewals take effect without a restart.

Prerequisites:

- `DOMAIN` and `CERTBOT_EMAIL` set in `.env`.
- `DOMAIN` A/AAAA records pointing at this server's public IP.
- Port 80 reachable from the internet (Let's Encrypt's validation servers
  hit `http://${DOMAIN}/.well-known/acme-challenge/...`). If you use
  Cloudflare in front of this server, set the proxy mode to "DNS only"
  (gray cloud) for the cert request, or use DNS-01 challenges instead.

Useful commands:

```bash
# Inspect cert / issuer / expiry
docker compose exec certbot certbot certificates

# Force-renew now (e.g. after fixing DNS)
docker compose exec certbot certbot renew --force-renewal --webroot -w /var/www/certbot

# Reset and re-request from scratch (wipes the volume — only do this if stuck)
docker compose down
docker volume rm simorghai-vps_certbot_certs
docker compose up -d
```

## Directory Structure

```
simorghai-vps/
├── docker-compose.yml
├── .env.example
├── landing-site/               # React/Vite landing page
│   ├── Dockerfile
│   ├── src/components/
│   │   ├── FeaturesSection.tsx    # Product cards → EKC reverse proxy
│   │   ├── ChatWidget.tsx         # Anthropic-powered AI chat
│   │   ├── ChatMailSection.tsx    # Delta Chat download buttons
│   │   └── ...
│   └── public/
├── chatbot-api/                # Anthropic Claude proxy
│   ├── Dockerfile
│   └── server.js
├── chatmail/                   # Chatmail relay
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── templates/
│       └── default.conf.template  # ${DOMAIN} substituted at boot
├── scripts/
│   ├── certbot-entrypoint.sh      # bootstrap + issue + renew loop
│   └── nginx-reload-watcher.sh    # reloads nginx on cert mtime change
├── delta-chat/                    # Pre-downloaded binaries
└── .github/workflows/
    └── download-deltachat.yml
```
