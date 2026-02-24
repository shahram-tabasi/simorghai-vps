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

1. Place certs in `ssl/fullchain.pem` and `ssl/privkey.pem`
2. Uncomment the HTTPS server block in `nginx/conf.d/default.conf`
3. `docker compose restart nginx-proxy`

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
├── nginx/conf.d/default.conf   # Routing + reverse proxy
├── delta-chat/                 # Pre-downloaded binaries
├── ssl/                        # Certificates (not committed)
└── .github/workflows/
    └── download-deltachat.yml
```
