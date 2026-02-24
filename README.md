# simorghai-vps

Unified Docker Compose deployment for the Simorgh AI platform on a single VPS.

## What's Included

| Service | Description | Port |
|---|---|---|
| **nginx-proxy** | TLS termination & top-level routing | 80, 443 |
| **landing-site** | Simorgh AI marketing website (React/Vite) | internal |
| **chatbot-frontend** | Chatbot React application | internal |
| **chatbot-backend** | FastAPI backend (AI, auth, docs) | internal |
| **chatbot-nginx** | Internal chatbot reverse proxy | 85 |
| **doc-processor** | Document to Markdown converter | internal |
| **tts-service** | Text-to-Speech (Edge-TTS) | internal |
| **stt-service** | Speech-to-Text (Faster-Whisper) | internal |
| **redis** | Cache & session store | internal |
| **qdrant** | Vector database | internal |
| **postgres-auth** | Auth database (PostgreSQL 16) | internal |
| **search-service** | Web search (DuckDuckGo) | internal |
| **tpms-fetcher** | TPMS project data | internal |
| **file-export** | Excel/Word/PDF export | internal |
| **chatmail** | Privacy-focused email relay | 25, 465, 587, 143, 993, 3478 |

## Prerequisites

- Docker Engine 24+ with Docker Compose v2
- VPS with minimum 4GB RAM (8GB+ recommended)
- A domain name with DNS configured
- (Optional) SSL certificate files

## Directory Structure

Clone all repositories side by side:

```
/opt/simorgh/                         # or any base directory
├── simorghai-vps/                    # This repo (docker-compose orchestrator)
│   ├── docker-compose.yml
│   ├── .env
│   ├── nginx/
│   │   ├── nginx.conf
│   │   ├── conf.d/default.conf
│   │   ├── chatbot-nginx.conf
│   │   └── chatbot-locations.inc
│   └── ssl/
│       ├── fullchain.pem             # Your SSL cert
│       └── privkey.pem               # Your SSL key
├── simorgh-site/                     # Landing site source
├── chatmail-relay-docker/            # Chatmail relay source
└── simorgh-chatbot-ekc-deploy/       # Chatbot platform source
```

## Quick Start

```bash
# 1. Clone all repositories
git clone https://github.com/shahram-tabasi/simorghai-vps.git
git clone https://github.com/shahram-tabasi/simorgh-site.git
git clone https://github.com/shahram-tabasi/chatmail-relay-docker.git
git clone https://github.com/shahram-tabasi/simorgh-chatbot-ekc-deploy.git

# 2. Configure environment
cd simorghai-vps
cp .env.example .env
# Edit .env with your values (domain, API keys, passwords, etc.)

# 3. (Optional) Add SSL certificates
cp /path/to/fullchain.pem ssl/
cp /path/to/privkey.pem ssl/
# Then uncomment the HTTPS server block in nginx/conf.d/default.conf

# 4. Start all services
docker compose up -d

# 5. Check status
docker compose ps
docker compose logs -f
```

## Chatmail Setup

After the first start, initialize chatmail inside the container:

```bash
docker compose exec chatmail bash
./scripts/cmdeploy init chat.yourdomain.com
./scripts/cmdeploy run --ssh-host localhost
./scripts/cmdeploy dns --ssh-host localhost
```

See the [chatmail-relay-docker README](https://github.com/shahram-tabasi/chatmail-relay-docker) for DNS record setup.

## SSL Configuration

To enable HTTPS:

1. Place your certificate files in `ssl/`:
   - `ssl/fullchain.pem` - Full certificate chain
   - `ssl/privkey.pem` - Private key

2. Edit `nginx/conf.d/default.conf`:
   - Uncomment the HTTPS server block at the bottom
   - In the HTTP server block, uncomment `return 301 https://$host$request_uri;`
   - Remove or comment out the HTTP location blocks

3. Restart nginx: `docker compose restart nginx-proxy`

## Useful Commands

```bash
# View logs for a specific service
docker compose logs -f chatbot-backend

# Restart a single service
docker compose restart chatbot-backend

# Rebuild and restart landing site after code changes
docker compose up -d --build landing-site

# Scale down chatmail if not needed
docker compose stop chatmail

# Full restart
docker compose down && docker compose up -d

# Check disk usage of volumes
docker system df -v
```

## Environment Variables

See `.env.example` for all available configuration options.

## Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────┐
│  nginx-proxy (80/443)                           │
│  TLS termination & routing                      │
├─────────────────────────────────────────────────┤
│  /           → landing-site                     │
│  /chatbot/*  → chatbot-nginx → frontend         │
│  /api/*      → chatbot-nginx → backend          │
│  /api/stt/*  → chatbot-nginx → stt-service      │
│  /api/tts/*  → chatbot-nginx → tts-service      │
└─────────────────────────────────────────────────┘
    │
    ▼
┌──────────────┐  ┌──────────┐  ┌──────────────┐
│ Redis        │  │ Qdrant   │  │ PostgreSQL   │
│ (cache/sess) │  │ (vectors)│  │ (auth)       │
└──────────────┘  └──────────┘  └──────────────┘

Chatmail Relay: ports 25, 465, 587, 143, 993, 3478
```
