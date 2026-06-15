# Mail server (docker-mailserver)

A lightweight self-hosted mail server (SMTP + IMAP + antispam + DKIM) for this
VPS, using [docker-mailserver](https://docker-mailserver.github.io/docker-mailserver/).

**Why not mailcow?** mailcow needs 6–8 GB RAM and wants ports 80/443 (which the
nginx-proxy already owns). On a 1 vCPU / 2 GB box, docker-mailserver is the
right fit: no web UI, no 80/443 usage, ClamAV off by default.

It runs as a **separate compose project** so it can't disturb the web stack, but
reuses the web stack's Let's Encrypt certificate volume for TLS.

---

## 0. Prerequisites (do these BEFORE `up` — they gate everything)

Self-hosted mail lives or dies on infrastructure, not Docker.

1. **Outbound port 25 open.** Most VPS providers block it by default; you can
   receive but not send until it's unblocked (usually a support ticket). Test:
   ```bash
   nc -vz -w5 alt1.gmail-smtp-in.l.google.com 25     # open = good
   ```
2. **Reverse DNS (PTR)** of the server's public IP must equal `mail.simorghai.com`.
   Set this in the **VPS provider** panel (not your DNS host).
3. **DNS resolves.** Create the records in section 2 below.
4. **IP not blocklisted** — check at https://multirbl.valli.org/.

If your provider refuses to open port 25, switch DMS to **relay mode** (send via
SES/Mailgun/Postmark) instead of direct delivery — ask and we'll configure it.

---

## 1. TLS certificate for the mail host

DMS reads `/etc/letsencrypt/live/mail.simorghai.com/` (mounted read-only from
the web stack's `certbot_certs` volume). Issue that cert using the existing
certbot service — nginx already serves the ACME challenge on port 80 for any
host. From the **repo root**:

```bash
docker compose run --rm --entrypoint certbot certbot-renew \
  certonly --webroot -w /var/www/certbot -d mail.simorghai.com \
  --email admin@simorghai.com --agree-tos --no-eff-email
```

(Requires the `mail.simorghai.com` A record to already point at this server.)

---

## 2. DNS records

Replace the IP with your server's public IP and `<selector>` per DKIM output.

| Type  | Host                         | Value                                                            |
|-------|------------------------------|------------------------------------------------------------------|
| A     | `mail.simorghai.com`         | `YOUR.SERVER.IP`                                                  |
| MX    | `simorghai.com`              | `10 mail.simorghai.com`                                           |
| TXT   | `simorghai.com` (SPF)        | `v=spf1 mx ~all`                                                  |
| TXT   | `mail._domainkey.simorghai.com` (DKIM) | *(generated in step 4 — paste the published value)*    |
| TXT   | `_dmarc.simorghai.com`       | `v=DMARC1; p=quarantine; rua=mailto:admin@simorghai.com`         |

Also set the **PTR/rDNS** (provider panel): `YOUR.SERVER.IP -> mail.simorghai.com`.

---

## 3. Start the mail server

```bash
cd mail
cp mailserver.env.example mailserver.env     # edit if needed (hostname/domain)
docker compose -f compose.mail.yaml up -d
docker compose -f compose.mail.yaml logs -f mailserver   # watch startup
```

---

## 4. Create accounts + generate DKIM

```bash
# Add a mailbox (prompts for password). Adding the first address for a domain
# is what makes DMS aware of the domain.
docker exec -ti mailserver setup email add admin@simorghai.com

# Optional aliases
docker exec -ti mailserver setup alias add postmaster@simorghai.com admin@simorghai.com
docker exec -ti mailserver setup alias add abuse@simorghai.com admin@simorghai.com

# Generate the DKIM keypair (RSA-2048, selector "mail")
docker exec -ti mailserver setup config dkim

# Print the DNS TXT value to publish for the DKIM record above
cat docker-data/dms/config/opendkim/keys/simorghai.com/mail.txt
```

Publish that DKIM TXT record, then restart so signing is active:

```bash
docker compose -f compose.mail.yaml restart mailserver
```

---

## 5. Client settings

| Setting      | Value                          |
|--------------|--------------------------------|
| IMAP server  | `mail.simorghai.com`, port 993, SSL/TLS |
| SMTP server  | `mail.simorghai.com`, port 465, SSL/TLS (or 587 STARTTLS) |
| Username     | full email, e.g. `admin@simorghai.com` |
| Password     | the one set in step 4          |

---

## 6. Verify deliverability

- Send a test to a Gmail address; in Gmail "Show original" should show
  **SPF: PASS, DKIM: PASS, DMARC: PASS**.
- Run the full check at https://www.mail-tester.com/ (aim for 10/10).
- Confirm you're not on a blocklist: https://multirbl.valli.org/.

---

## Common commands

```bash
docker compose -f compose.mail.yaml ps
docker compose -f compose.mail.yaml logs -f mailserver
docker exec -ti mailserver setup email list
docker exec -ti mailserver setup email update admin@simorghai.com   # change pw
docker compose -f compose.mail.yaml down                            # stop
```
