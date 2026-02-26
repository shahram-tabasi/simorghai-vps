#!/bin/bash
# =============================================================================
# init-ssl.sh - First-time SSL certificate setup for Simorgh AI VPS
# =============================================================================
# Usage:  ./init-ssl.sh yourdomain.com your@email.com
#
# This script:
#   1. Pre-flight checks (DNS, port 80, Let's Encrypt connectivity)
#   2. Creates a temporary self-signed cert so nginx can start on port 443
#   3. Starts nginx-proxy (needed for ACME HTTP challenge on port 80)
#   4. Requests a real Let's Encrypt certificate via certbot
#   5. Reloads nginx with the real certificate
#
# After this, the certbot container handles automatic renewal.
# =============================================================================

set -euo pipefail

DOMAIN="${1:?Usage: ./init-ssl.sh <domain> <email>}"
EMAIL="${2:?Usage: ./init-ssl.sh <domain> <email>}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

echo "=== Simorgh AI - SSL Setup for ${DOMAIN} ==="

# ---- Step 1: Pre-flight checks ----
echo ""
echo "[1/5] Running pre-flight checks..."

# Check DNS resolution
info "Checking DNS resolution for ${DOMAIN}..."
RESOLVED_IP=$(dig +short "${DOMAIN}" 2>/dev/null | tail -1)
if [ -z "${RESOLVED_IP}" ]; then
    # dig might not be available, try getent
    RESOLVED_IP=$(getent hosts "${DOMAIN}" 2>/dev/null | awk '{print $1}' | head -1)
fi

if [ -z "${RESOLVED_IP}" ]; then
    error "DNS resolution failed for ${DOMAIN}"
    echo "  Make sure your domain's A record points to this server's IP."
    echo "  You can check with: dig ${DOMAIN} or nslookup ${DOMAIN}"
    exit 1
fi

# Try to detect our public IP
SERVER_IP=$(curl -s --connect-timeout 10 ifconfig.me 2>/dev/null \
    || curl -s --connect-timeout 10 icanhazip.com 2>/dev/null \
    || curl -s --connect-timeout 10 api.ipify.org 2>/dev/null \
    || echo "unknown")

info "Domain ${DOMAIN} resolves to: ${RESOLVED_IP}"
info "This server's public IP: ${SERVER_IP}"

if [ "${SERVER_IP}" != "unknown" ] && [ "${RESOLVED_IP}" != "${SERVER_IP}" ]; then
    warn "DNS mismatch! ${DOMAIN} points to ${RESOLVED_IP} but this server is ${SERVER_IP}"
    warn "Let's Encrypt HTTP challenge will fail if the domain doesn't point here."
    echo ""
    read -r -p "Continue anyway? (y/N): " CONTINUE
    if [ "${CONTINUE}" != "y" ] && [ "${CONTINUE}" != "Y" ]; then
        echo "Aborted."
        exit 1
    fi
fi

# Check Let's Encrypt connectivity
info "Checking connectivity to Let's Encrypt..."
if curl -s --connect-timeout 15 --max-time 20 -o /dev/null -w "%{http_code}" https://acme-v02.api.letsencrypt.org/directory 2>/dev/null | grep -q "200"; then
    info "Let's Encrypt ACME server is reachable."
else
    error "Cannot reach Let's Encrypt ACME server (https://acme-v02.api.letsencrypt.org)."
    echo ""
    echo "  This is a common issue on Iranian VPS servers due to network restrictions."
    echo "  Possible solutions:"
    echo "    1. Use a DNS challenge instead of HTTP challenge (requires DNS API access)"
    echo "    2. Obtain the certificate on another machine and copy it to this server"
    echo "    3. Use a reverse proxy/CDN (like Cloudflare) that provides its own SSL"
    echo "    4. Check if your VPS provider offers a proxy/tunnel for outbound HTTPS"
    echo ""
    read -r -p "Try anyway? (y/N): " CONTINUE
    if [ "${CONTINUE}" != "y" ] && [ "${CONTINUE}" != "Y" ]; then
        echo "Aborted."
        exit 1
    fi
fi

# ---- Step 2: Create temp self-signed cert so nginx can start ----
echo ""
echo "[2/5] Creating temporary self-signed certificate..."

docker compose up -d --no-deps --quiet-pull nginx-proxy 2>/dev/null || true
docker compose down nginx-proxy 2>/dev/null || true

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

# ---- Step 3: Start nginx (it can now load the temp cert) ----
echo ""
echo "[3/5] Starting nginx-proxy..."
docker compose up -d nginx-proxy
sleep 3

# Verify nginx is running
if ! docker compose ps nginx-proxy | grep -q "Up"; then
    error "nginx-proxy failed to start. Check: docker compose logs nginx-proxy"
    exit 1
fi
info "nginx-proxy is running."

# Verify ACME challenge path is working
info "Verifying ACME challenge path is accessible..."
ACME_TEST=$(docker compose exec nginx-proxy wget -qO- http://127.0.0.1:80/.well-known/acme-challenge/ 2>&1 || true)
info "ACME path check done (404 is expected if no challenge file exists yet)."

# ---- Step 4: Request real Let's Encrypt certificate ----
echo ""
echo "[4/5] Requesting Let's Encrypt certificate for ${DOMAIN}..."
echo "      (this may take a minute - using verbose mode for diagnostics)"
echo ""

if docker compose run --rm certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "${DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    --verbose; then
    info "Certificate obtained successfully!"
else
    CERTBOT_EXIT=$?
    echo ""
    error "Certbot failed (exit code: ${CERTBOT_EXIT})."
    echo ""
    echo "  Common causes:"
    echo "    1. Domain DNS doesn't point to this server (${DOMAIN} -> ${RESOLVED_IP})"
    echo "    2. Port 80 is blocked by firewall (check: ufw status, iptables -L)"
    echo "    3. Let's Encrypt servers can't reach this server (sanctions/geo-blocking)"
    echo "    4. Rate limit exceeded (check https://letsencrypt.org/docs/rate-limits/)"
    echo ""
    echo "  Debugging steps:"
    echo "    - Check certbot logs: docker compose run --rm certbot certificates"
    echo "    - Test port 80 from outside: curl -I http://${DOMAIN}/.well-known/acme-challenge/test"
    echo "    - Check nginx logs: docker compose logs nginx-proxy"
    echo ""
    echo "  Alternative: Use Cloudflare DNS proxy for free SSL without Let's Encrypt."
    exit 1
fi

# ---- Step 5: Reload nginx with the real certificate ----
echo ""
echo "[5/5] Reloading nginx with real certificate..."
docker compose exec nginx-proxy nginx -s reload

echo ""
echo "=== SSL setup complete! ==="
echo "  - Certificate: Let's Encrypt for ${DOMAIN}"
echo "  - Auto-renewal: handled by certbot container"
echo ""
echo "Now start all services:"
echo "  docker compose up -d"
