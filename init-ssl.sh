#!/bin/bash
# =============================================================================
# init-ssl.sh - First-time SSL certificate setup for Simorgh AI VPS
# =============================================================================
# Usage:
#   ./init-ssl.sh <domain> <email>                  # Let's Encrypt via certbot
#   ./init-ssl.sh --cloudflare <domain>              # Cloudflare Origin Cert
#   ./init-ssl.sh --self-signed <domain>             # Self-signed (dev/testing)
#
# This script:
#   1. Pre-flight checks (DNS, connectivity)
#   2. Creates SSL certificate (Let's Encrypt, Cloudflare, or self-signed)
#   3. Starts/reloads nginx with the certificate
#
# After this, the certbot container handles automatic renewal (LE mode only).
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }
step()  { echo -e "\n${CYAN}$*${NC}"; }

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
MODE="letsencrypt"
DOMAIN=""
EMAIL=""

case "${1:-}" in
    --cloudflare)
        MODE="cloudflare"
        DOMAIN="${2:?Usage: ./init-ssl.sh --cloudflare <domain> [cert.pem] [key.pem]}"
        CF_CERT_FILE="${3:-}"
        CF_KEY_FILE="${4:-}"
        ;;
    --self-signed)
        MODE="self-signed"
        DOMAIN="${2:?Usage: ./init-ssl.sh --self-signed <domain>}"
        ;;
    --help|-h)
        echo "Usage:"
        echo "  ./init-ssl.sh <domain> <email>                     # Let's Encrypt"
        echo "  ./init-ssl.sh --cloudflare <domain> cert.pem key.pem  # Cloudflare Origin Cert"
        echo "  ./init-ssl.sh --self-signed <domain>               # Self-signed (dev/testing)"
        exit 0
        ;;
    *)
        DOMAIN="${1:?Usage: ./init-ssl.sh <domain> <email>}"
        EMAIL="${2:?Usage: ./init-ssl.sh <domain> <email>}"
        ;;
esac

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

echo "=== Simorgh AI - SSL Setup for ${DOMAIN} (mode: ${MODE}) ==="

# ---------------------------------------------------------------------------
# Pre-flight: Detect if Cloudflare is in front
# ---------------------------------------------------------------------------
detect_cloudflare() {
    info "Checking if Cloudflare is in front of ${DOMAIN}..."

    # Check if resolved IPs belong to Cloudflare ranges
    local resolved_ip
    resolved_ip=$(dig +short "${DOMAIN}" 2>/dev/null | head -1)
    if [ -z "${resolved_ip}" ]; then
        resolved_ip=$(getent hosts "${DOMAIN}" 2>/dev/null | awk '{print $1}' | head -1)
    fi

    if [ -z "${resolved_ip}" ]; then
        warn "Could not resolve ${DOMAIN}"
        return 1
    fi

    # Check common Cloudflare IP ranges
    local cf_detected=false
    if echo "${resolved_ip}" | grep -qE '^(104\.(1[6-9]|2[0-7])\.|172\.(6[4-9]|7[0-1])\.|103\.2[12]\.|141\.101\.|108\.162\.|190\.93\.|188\.114\.|197\.234\.|198\.41\.|162\.158\.|131\.0\.7)'; then
        cf_detected=true
    fi

    # Also check HTTP headers
    local cf_header
    cf_header=$(curl -sI --connect-timeout 10 "http://${DOMAIN}" 2>/dev/null | grep -i "cf-ray:" || true)
    if [ -n "${cf_header}" ]; then
        cf_detected=true
    fi

    if [ "${cf_detected}" = true ]; then
        info "Cloudflare detected! Your domain is proxied through Cloudflare."
        return 0
    fi
    return 1
}

# ---------------------------------------------------------------------------
# Step 1: Pre-flight checks
# ---------------------------------------------------------------------------
step "[1/4] Running pre-flight checks..."

# Check DNS
info "Checking DNS resolution for ${DOMAIN}..."
RESOLVED_IP=$(dig +short "${DOMAIN}" 2>/dev/null | tail -1)
if [ -z "${RESOLVED_IP}" ]; then
    RESOLVED_IP=$(getent hosts "${DOMAIN}" 2>/dev/null | awk '{print $1}' | head -1)
fi

if [ -z "${RESOLVED_IP}" ]; then
    error "DNS resolution failed for ${DOMAIN}"
    echo "  Make sure your domain's A record points to this server's IP."
    exit 1
fi

# Detect public IP
SERVER_IP=$(curl -s --connect-timeout 10 ifconfig.me 2>/dev/null \
    || curl -s --connect-timeout 10 icanhazip.com 2>/dev/null \
    || curl -s --connect-timeout 10 api.ipify.org 2>/dev/null \
    || echo "unknown")

info "Domain ${DOMAIN} resolves to: ${RESOLVED_IP}"
info "This server's public IP: ${SERVER_IP}"

# Cloudflare detection
IS_CLOUDFLARE=false
if detect_cloudflare; then
    IS_CLOUDFLARE=true
    if [ "${MODE}" = "letsencrypt" ]; then
        echo ""
        warn "Cloudflare is proxying your domain. Let's Encrypt HTTP challenge will likely FAIL"
        warn "because Cloudflare intercepts the challenge request."
        echo ""
        echo "  Recommended: Use Cloudflare Origin Certificate instead:"
        echo "    ./init-ssl.sh --cloudflare ${DOMAIN} cert.pem key.pem"
        echo ""
        echo "  Or in Cloudflare dashboard, set SSL mode to 'Full' and use self-signed:"
        echo "    ./init-ssl.sh --self-signed ${DOMAIN}"
        echo ""
        read -r -p "Try Let's Encrypt anyway? (y/N): " CONTINUE
        if [ "${CONTINUE}" != "y" ] && [ "${CONTINUE}" != "Y" ]; then
            echo "Aborted. Re-run with --cloudflare or --self-signed."
            exit 1
        fi
    fi
elif [ "${MODE}" = "letsencrypt" ]; then
    # IP mismatch check (only matters for non-Cloudflare Let's Encrypt)
    if [ "${SERVER_IP}" != "unknown" ] && [ "${RESOLVED_IP}" != "${SERVER_IP}" ]; then
        warn "DNS mismatch! ${DOMAIN} -> ${RESOLVED_IP}, but this server is ${SERVER_IP}"
        warn "Let's Encrypt HTTP challenge will fail if the domain doesn't point here."
        echo ""
        read -r -p "Continue anyway? (y/N): " CONTINUE
        if [ "${CONTINUE}" != "y" ] && [ "${CONTINUE}" != "Y" ]; then
            echo "Aborted."
            exit 1
        fi
    fi
fi

# ---------------------------------------------------------------------------
# Step 2: Create certificate
# ---------------------------------------------------------------------------
step "[2/4] Setting up SSL certificate..."

case "${MODE}" in
    # -------------------------------------------------------------------
    cloudflare)
        echo "Setting up Cloudflare Origin Certificate."

        # Create cert directory in the volume
        docker compose run --rm --entrypoint "" certbot sh -c "
            mkdir -p ${CERT_DIR}
        "

        if [ -n "${CF_CERT_FILE}" ] && [ -n "${CF_KEY_FILE}" ]; then
            # File-based input (recommended)
            if [ ! -f "${CF_CERT_FILE}" ]; then
                error "Certificate file not found: ${CF_CERT_FILE}"
                exit 1
            fi
            if [ ! -f "${CF_KEY_FILE}" ]; then
                error "Key file not found: ${CF_KEY_FILE}"
                exit 1
            fi
            CERT_FILE="${CF_CERT_FILE}"
            KEY_FILE="${CF_KEY_FILE}"
        else
            # Interactive paste mode (fallback)
            echo ""
            echo "To generate a Cloudflare Origin Certificate:"
            echo "  1. Go to Cloudflare Dashboard -> SSL/TLS -> Origin Server"
            echo "  2. Click 'Create Certificate'"
            echo "  3. Select the domain: ${DOMAIN}"
            echo "  4. Save the certificate and key to files, then run:"
            echo "     ./init-ssl.sh --cloudflare ${DOMAIN} cert.pem key.pem"
            echo ""
            echo "  Or paste them interactively below."
            echo ""

            CERT_FILE=$(mktemp)
            KEY_FILE=$(mktemp)
            trap 'rm -f "${CERT_FILE}" "${KEY_FILE}"' EXIT

            echo "Paste the Origin Certificate PEM (then press Ctrl+D on a new line):"
            cat > "${CERT_FILE}"
            echo ""
            echo "Paste the Private Key PEM (then press Ctrl+D on a new line):"
            cat > "${KEY_FILE}"
        fi

        # Validate the cert looks right
        if ! grep -q "BEGIN CERTIFICATE" "${CERT_FILE}"; then
            error "That doesn't look like a valid certificate PEM."
            exit 1
        fi
        if ! grep -q "BEGIN.*PRIVATE KEY" "${KEY_FILE}"; then
            error "That doesn't look like a valid private key PEM."
            exit 1
        fi

        # Copy into the volume via certbot container
        docker compose run --rm --entrypoint "" \
            -v "${CERT_FILE}:/tmp/fullchain.pem:ro" \
            -v "${KEY_FILE}:/tmp/privkey.pem:ro" \
            certbot sh -c "
                cp /tmp/fullchain.pem ${CERT_DIR}/fullchain.pem
                cp /tmp/privkey.pem ${CERT_DIR}/privkey.pem
                chmod 644 ${CERT_DIR}/fullchain.pem
                chmod 600 ${CERT_DIR}/privkey.pem
            "
        info "Cloudflare Origin Certificate installed."
        echo ""
        warn "Make sure Cloudflare SSL mode is set to 'Full (Strict)' in the dashboard."
        ;;

    # -------------------------------------------------------------------
    self-signed)
        echo "Creating self-signed certificate (valid for 365 days)..."
        docker compose run --rm --entrypoint "" certbot sh -c "
            mkdir -p ${CERT_DIR}
            openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
                -keyout ${CERT_DIR}/privkey.pem \
                -out ${CERT_DIR}/fullchain.pem \
                -subj '/CN=${DOMAIN}'
        "
        info "Self-signed certificate created."
        echo ""
        warn "If using Cloudflare, set SSL mode to 'Full' (not 'Full Strict')."
        warn "Browsers will show a warning if accessed directly (without Cloudflare)."
        ;;

    # -------------------------------------------------------------------
    letsencrypt)
        # First check Let's Encrypt connectivity
        info "Checking connectivity to Let's Encrypt..."
        if curl -s --connect-timeout 15 --max-time 20 -o /dev/null -w "%{http_code}" https://acme-v02.api.letsencrypt.org/directory 2>/dev/null | grep -q "200"; then
            info "Let's Encrypt ACME server is reachable."
        else
            error "Cannot reach Let's Encrypt ACME server."
            echo ""
            echo "  This is common on Iranian VPS servers due to network restrictions."
            echo "  Alternatives:"
            echo "    ./init-ssl.sh --cloudflare ${DOMAIN}   # Cloudflare Origin Cert"
            echo "    ./init-ssl.sh --self-signed ${DOMAIN}  # Self-signed + Cloudflare Full"
            echo ""
            read -r -p "Try anyway? (y/N): " CONTINUE
            if [ "${CONTINUE}" != "y" ] && [ "${CONTINUE}" != "Y" ]; then
                echo "Aborted."
                exit 1
            fi
        fi

        # Create temporary self-signed cert so nginx can start
        info "Creating temporary self-signed cert for nginx startup..."
        docker compose run --rm --entrypoint "" certbot sh -c "
            mkdir -p ${CERT_DIR}
            if [ ! -f ${CERT_DIR}/fullchain.pem ]; then
                openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
                    -keyout ${CERT_DIR}/privkey.pem \
                    -out ${CERT_DIR}/fullchain.pem \
                    -subj '/CN=${DOMAIN}'
                echo 'Temporary self-signed cert created.'
            else
                echo 'Certificate already exists, skipping temp generation.'
            fi
        "
        ;;
esac

# ---------------------------------------------------------------------------
# Step 3: Start nginx
# ---------------------------------------------------------------------------
step "[3/4] Starting nginx-proxy..."

# Stop first to ensure clean start with the new cert
docker compose stop nginx-proxy 2>/dev/null || true
docker compose up -d nginx-proxy
sleep 3

# Verify nginx is running
if ! docker compose ps nginx-proxy | grep -q "Up"; then
    error "nginx-proxy failed to start!"
    echo ""
    echo "  Check logs: docker compose logs nginx-proxy"
    echo ""
    # Show last few log lines for immediate diagnosis
    docker compose logs --tail=10 nginx-proxy 2>/dev/null || true
    exit 1
fi
info "nginx-proxy is running."

# ---------------------------------------------------------------------------
# Step 4: Request Let's Encrypt cert (only in LE mode)
# ---------------------------------------------------------------------------
if [ "${MODE}" = "letsencrypt" ]; then
    step "[4/4] Requesting Let's Encrypt certificate for ${DOMAIN}..."
    echo "      (using verbose mode for diagnostics)"
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

        # Reload nginx with real cert
        info "Reloading nginx with Let's Encrypt certificate..."
        docker compose exec nginx-proxy nginx -s reload
    else
        CERTBOT_EXIT=$?
        echo ""
        error "Certbot failed (exit code: ${CERTBOT_EXIT})."
        echo ""
        echo "  Common causes:"
        echo "    1. Domain DNS doesn't point to this server (${DOMAIN} -> ${RESOLVED_IP})"
        echo "    2. Port 80 is blocked by firewall (check: ufw status, iptables -L)"
        echo "    3. Cloudflare is intercepting the ACME challenge"
        echo "    4. Let's Encrypt can't reach this server (sanctions/geo-blocking)"
        echo "    5. Rate limit exceeded (https://letsencrypt.org/docs/rate-limits/)"
        echo ""
        echo "  Alternatives:"
        echo "    ./init-ssl.sh --cloudflare ${DOMAIN}   # Cloudflare Origin Cert"
        echo "    ./init-ssl.sh --self-signed ${DOMAIN}  # Self-signed + Cloudflare Full"
        echo ""
        echo "  The server is running with a temporary self-signed cert for now."
        exit 1
    fi
else
    step "[4/4] Reloading nginx with new certificate..."
    docker compose exec nginx-proxy nginx -s reload
fi

echo ""
echo "=== SSL setup complete! ==="
echo "  - Mode: ${MODE}"
echo "  - Domain: ${DOMAIN}"
if [ "${MODE}" = "letsencrypt" ]; then
    echo "  - Auto-renewal: handled by certbot container"
fi
if [ "${IS_CLOUDFLARE}" = true ]; then
    echo "  - Cloudflare: detected (make sure SSL mode is correct in dashboard)"
fi
echo ""
echo "Start all services:"
echo "  docker compose up -d"
