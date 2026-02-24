#!/bin/bash
set -e

DOMAIN="simorghai.com"
CHAT_DOMAIN="chat.simorghai.com"
EMAIL="${CERTBOT_EMAIL:-admin@simorghai.com}"

echo "=== Simorgh VPS Setup ==="
echo "Landing page domain: $DOMAIN"
echo "Chatmail domain: $CHAT_DOMAIN"
echo ""

# Step 1: Build and start all services
echo "[1/4] Building and starting services..."
docker compose up -d --build

echo ""
echo "[2/4] Waiting for services to start..."
sleep 10

# Step 3: Install pre-downloaded binaries in chatmail container
echo "[3/4] Installing pre-downloaded binaries in chatmail container..."
docker compose exec chatmail /opt/chatmail-predownloaded/install-predownloaded.sh

echo ""
echo "[4/4] Services are running!"
echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Initialize chatmail:"
echo "   docker compose exec chatmail bash"
echo "   cd /opt/chatmail"
echo "   ./scripts/cmdeploy init $CHAT_DOMAIN"
echo "   ./scripts/cmdeploy run --ssh-host localhost"
echo ""
echo "2. Setup DNS records:"
echo "   ./scripts/cmdeploy dns --ssh-host localhost"
echo "   (run repeatedly until you see success)"
echo ""
echo "3. Obtain TLS certificates (optional, for landing page HTTPS):"
echo "   docker compose exec certbot certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --no-eff-email"
echo "   Then uncomment the HTTPS blocks in nginx/conf.d/default.conf"
echo "   docker compose restart nginx-proxy"
echo ""
echo "4. Verify:"
echo "   - Landing page: http://$DOMAIN"
echo "   - Chatmail: http://$CHAT_DOMAIN"
echo ""
echo "5. Required open ports on your firewall:"
echo "   80, 443, 25, 143, 465, 587, 993, 3340, 3478"
