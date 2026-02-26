#!/bin/bash
# =============================================================================
# init-ssl.sh - First-time SSL certificate setup for Simorgh AI VPS
# =============================================================================
# Usage:  ./init-ssl.sh yourdomain.com your@email.com
#
# This script:
#   1. Creates a temporary self-signed cert so nginx can start on port 443
#   2. Starts nginx-proxy (needed for ACME HTTP challenge on port 80)
#   3. Requests a real Let's Encrypt certificate via certbot
#   4. Reloads nginx with the real certificate
#
# After this, the certbot container handles automatic renewal.
# =============================================================================

set -e

DOMAIN="${1:?Usage: ./init-ssl.sh <domain> <email>}"
EMAIL="${2:?Usage: ./init-ssl.sh <domain> <email>}"

echo "=== Simorgh AI - SSL Setup for ${DOMAIN} ==="

# ---- Step 1: Create temp self-signed cert so nginx can start ----
echo ""
echo "[1/4] Creating temporary self-signed certificate..."

# Get the certbot_certs volume mount path
docker compose up -d --no-deps --quiet-pull nginx-proxy 2>/dev/null || true
docker compose down nginx-proxy 2>/dev/null || true

# Create cert directories in the volume
docker compose run --rm --entrypoint "" certbot sh -c "
  mkdir -p /etc/letsencrypt/live/${DOMAIN}
  if [ ! -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ]; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
      -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
      -subj '/CN=${DOMAIN}'
    echo 'Temporary self-signed cert created.'
  else
    echo 'Certificate already exists, skipping self-signed generation.'
  fi
"

# ---- Step 2: Start nginx (it can now load the temp cert) ----
echo ""
echo "[2/4] Starting nginx-proxy..."
docker compose up -d nginx-proxy
sleep 3

# Verify nginx is running
if ! docker compose ps nginx-proxy | grep -q "Up"; then
  echo "ERROR: nginx-proxy failed to start. Check: docker compose logs nginx-proxy"
  exit 1
fi
echo "nginx-proxy is running."

# ---- Step 3: Request real Let's Encrypt certificate ----
echo ""
echo "[3/4] Requesting Let's Encrypt certificate for ${DOMAIN}..."
docker compose run --rm certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

# ---- Step 4: Reload nginx with the real certificate ----
echo ""
echo "[4/4] Reloading nginx with real certificate..."
docker compose exec nginx-proxy nginx -s reload

echo ""
echo "=== SSL setup complete! ==="
echo "  - Certificate: Let's Encrypt for ${DOMAIN}"
echo "  - Auto-renewal: handled by certbot container"
echo ""
echo "Now start all services:"
echo "  docker compose up -d"
