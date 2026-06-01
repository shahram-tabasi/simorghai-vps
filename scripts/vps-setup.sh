#!/usr/bin/env bash
# =============================================================================
# Simorgh AI VPS - one-shot server bootstrap
# =============================================================================
# Prepares a fresh Ubuntu/Debian VPS to run this stack:
#   - installs Docker Engine + Compose plugin
#   - creates a swap file (prevents out-of-memory hangs on small VPSes)
#   - tunes swappiness for a server workload
#   - configures the UFW firewall (SSH + HTTP + HTTPS)
#   - enables Docker on boot
#
# Safe to re-run: every step checks whether it is already done.
#
# Usage (as root):
#   sudo bash scripts/vps-setup.sh
#
# Optional environment overrides:
#   SWAP_SIZE=2G     swap file size to create (default: 2G)
#   SSH_PORT=22      SSH port to open in the firewall (default: 22)
#   SKIP_FIREWALL=1  do not touch UFW
#   SKIP_SWAP=1      do not create swap
# =============================================================================
set -euo pipefail

SWAP_SIZE="${SWAP_SIZE:-2G}"
SSH_PORT="${SSH_PORT:-22}"

# --- pretty logging --------------------------------------------------------
c_green="\033[0;32m"; c_yellow="\033[1;33m"; c_red="\033[0;31m"; c_blue="\033[0;36m"; c_off="\033[0m"
log()  { echo -e "${c_blue}==>${c_off} $*"; }
ok()   { echo -e "${c_green}  ✓${c_off} $*"; }
warn() { echo -e "${c_yellow}  !${c_off} $*"; }
err()  { echo -e "${c_red}  ✗${c_off} $*" >&2; }

# --- preflight -------------------------------------------------------------
if [[ "${EUID}" -ne 0 ]]; then
  err "Please run as root:  sudo bash scripts/vps-setup.sh"
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  err "This script supports Debian/Ubuntu (apt) systems only."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

log "Updating package lists..."
apt-get update -y -qq
ok "Package lists updated."

log "Installing base utilities..."
apt-get install -y -qq ca-certificates curl gnupg lsb-release ufw >/dev/null
ok "Base utilities installed."

# --- Docker ----------------------------------------------------------------
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  ok "Docker and Compose already installed ($(docker --version | awk '{print $3}' | tr -d ','))."
else
  log "Installing Docker Engine + Compose plugin..."
  install -m 0755 -d /etc/apt/keyrings
  . /etc/os-release
  distro_id="${ID:-ubuntu}"
  curl -fsSL "https://download.docker.com/linux/${distro_id}/gpg" -o /etc/apt/keyrings/docker.asc 2>/dev/null \
    || curl -fsSL "https://download.docker.com/linux/ubuntu/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  arch="$(dpkg --print-architecture)"
  codename="${VERSION_CODENAME:-$(lsb_release -cs)}"
  echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${distro_id} ${codename} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y -qq
  if ! apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >/dev/null 2>&1; then
    warn "Docker apt repo failed; falling back to the official convenience script."
    curl -fsSL https://get.docker.com | sh
  fi
  ok "Docker installed ($(docker --version | awk '{print $3}' | tr -d ','))."
fi

log "Enabling Docker on boot..."
systemctl enable --now docker >/dev/null 2>&1 || true
ok "Docker service enabled."

# --- Swap ------------------------------------------------------------------
if [[ "${SKIP_SWAP:-0}" == "1" ]]; then
  warn "SKIP_SWAP=1 — skipping swap setup."
elif swapon --show | grep -q .; then
  ok "Swap already active: $(swapon --show=NAME,SIZE --noheadings | tr '\n' ' ')"
else
  log "Creating ${SWAP_SIZE} swap file at /swapfile..."
  if fallocate -l "${SWAP_SIZE}" /swapfile 2>/dev/null; then :; else
    # Fallback for filesystems without fallocate support.
    size_mb=$(( $(numfmt --from=iec "${SWAP_SIZE}") / 1024 / 1024 ))
    dd if=/dev/zero of=/swapfile bs=1M count="${size_mb}" status=none
  fi
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  if ! grep -q '^/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  ok "Swap created and enabled (${SWAP_SIZE})."
fi

log "Tuning kernel for a server workload..."
cat > /etc/sysctl.d/99-simorgh.conf <<'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
net.core.somaxconn=1024
EOF
sysctl -p /etc/sysctl.d/99-simorgh.conf >/dev/null 2>&1 || true
ok "Kernel parameters applied (swappiness=10)."

# --- Firewall --------------------------------------------------------------
if [[ "${SKIP_FIREWALL:-0}" == "1" ]]; then
  warn "SKIP_FIREWALL=1 — skipping firewall setup."
else
  log "Configuring UFW firewall (SSH:${SSH_PORT}, HTTP:80, HTTPS:443)..."
  ufw allow "${SSH_PORT}/tcp" >/dev/null
  ufw allow 80/tcp  >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
  ok "Firewall enabled. Open ports:"
  ufw status numbered | sed 's/^/      /'
  warn "If your SSH runs on a non-standard port, re-run with SSH_PORT=<port> before disconnecting."
fi

# --- Done ------------------------------------------------------------------
echo
echo -e "${c_green}=============================================================${c_off}"
echo -e "${c_green} VPS is ready for Simorgh AI.${c_off}"
echo -e "${c_green}=============================================================${c_off}"
cat <<EOF

Next steps:

  1) Configure environment:
       cp .env.example .env
       nano .env        # set DOMAIN, CERTBOT_EMAIL, OPENAI_API_KEY,
                        # BLOG_ADMIN_PASSWORD, BLOG_SESSION_SECRET

  2) Point your domain's A record at this server's public IP,
     and make sure port 80 is reachable (for the SSL certificate).

  3) Launch the stack:
       docker compose up -d

  4) Verify:
       docker compose ps
       curl http://localhost/health

  Site:    https://<DOMAIN>/
  Blog:    https://<DOMAIN>/en/blog   and   /fa/blog
  Admin:   https://<DOMAIN>/admin

Recommended VPS: 2 GB RAM, 1-2 vCPU, 40 GB NVMe, Ubuntu 24.04.
EOF
