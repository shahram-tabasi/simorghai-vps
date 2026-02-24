# simorghai-vps

Docker Compose deployment for Simorgh AI VPS - combines the landing page website with chatmail (Delta Chat) relay service behind an nginx reverse proxy.

## Architecture

```
                    ┌─────────────────┐
                    │   nginx-proxy   │
                    │   (port 80/443) │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    simorghai.com              chat.simorghai.com
              │                             │
    ┌─────────▼─────────┐     ┌─────────────▼─────────────┐
    │   simorgh-site    │     │        chatmail            │
    │  (React/Vite app) │     │  (Delta Chat relay)        │
    │   internal :80    │     │  internal :80 + mail ports │
    └───────────────────┘     └───────────────────────────┘
                                     │
                              Direct host ports:
                              25, 143, 465, 587,
                              993, 3340, 3478
```

## Services

| Service | Description | Domain |
|---------|-------------|--------|
| **simorgh-site** | React/Vite landing page | simorghai.com |
| **chatmail** | Delta Chat mail relay (chatmail-relay-docker) | chat.simorghai.com |
| **nginx-proxy** | Reverse proxy routing by domain | - |
| **certbot** | TLS certificate management | - |

## Prerequisites

1. A VPS with Docker and Docker Compose installed
2. DNS records configured:
   ```
   simorghai.com.          A     <VPS_IP>
   www.simorghai.com.      CNAME simorghai.com.
   chat.simorghai.com.     A     <VPS_IP>
   www.chat.simorghai.com. CNAME chat.simorghai.com.
   mta-sts.chat.simorghai.com. CNAME chat.simorghai.com.
   ```
3. Required ports open: 25, 80, 143, 443, 465, 587, 993, 3340, 3478

## Repository Structure

This repo expects the following sibling repos:
```
parent-dir/
├── simorghai-vps/           # This repo
│   ├── docker-compose.yml
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       └── default.conf
│   └── setup.sh
├── simorgh-site/            # Landing page React app
│   ├── Dockerfile
│   └── ...
└── chatmail-relay-docker/   # Chatmail relay
    ├── Dockerfile
    └── ...
```

## Quick Start

```bash
# Clone all repos side by side
git clone https://github.com/shahram-tabasi/simorghai-vps.git
git clone https://github.com/shahram-tabasi/simorgh-site.git
git clone https://github.com/shahram-tabasi/chatmail-relay-docker.git

# Deploy
cd simorghai-vps
./setup.sh
```

## Deployment Steps

### 1. Build and start
```bash
docker compose up -d --build
```

### 2. Install pre-downloaded binaries (for Iran VPS)
```bash
docker compose exec chatmail /opt/chatmail-predownloaded/install-predownloaded.sh
```

### 3. Initialize chatmail
```bash
docker compose exec chatmail bash
cd /opt/chatmail
./scripts/cmdeploy init chat.simorghai.com
./scripts/cmdeploy run --ssh-host localhost
```

### 4. Configure DNS
```bash
# Inside chatmail container
./scripts/cmdeploy dns --ssh-host localhost
# Run repeatedly until successful
```

### 5. Enable HTTPS (optional)
```bash
# Get certificates
docker compose exec certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d simorghai.com -d www.simorghai.com \
  --email admin@simorghai.com --agree-tos --no-eff-email

# Uncomment HTTPS blocks in nginx/conf.d/default.conf
# Then restart nginx
docker compose restart nginx-proxy
```

## Iran VPS Notes

The chatmail Docker image pre-downloads all binaries during build (GitHub Actions). This avoids the need to access blocked URLs (github.com, download.delta.chat) from the VPS. The GitHub Actions workflow builds the image and pushes it to GHCR.
