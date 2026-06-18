# MVP Deployment Checklist
**For 1–2 users · Self-hosted · Docker Compose**

---

## What Was Fixed to Make This Deployable

| # | Fix | File |
|---|-----|------|
| 1 | **Memory DoS** — size check now fires *before* full upload is buffered | `backend/app/api/routes/analyze.py` |
| 2 | **Macro targets** — `GET /analytics/targets` endpoint added; macro progress bars now on home screen | `backend/app/api/routes/analytics.py`, `frontend/app/(tabs)/index.tsx`, `frontend/utils/nutrition.ts` |
| 3 | **CORS / host config** — `docker-compose.yml` now reads `CORS_ORIGINS` and `EXPO_PUBLIC_API_URL` from environment instead of hardcoding localhost | `docker-compose.yml` |

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| A VPS with Docker + Docker Compose installed | Host everything (DigitalOcean $12/mo, Hetzner €4/mo, or Railway) |
| Google Gemini API key | Free tier at https://aistudio.google.com/app/apikey |
| Cloudflare R2 bucket | Free 10 GB/month — image storage |
| Gmail app password (or any SMTP) | Email verification + password reset |

> **Minimum VPS spec:** 1 vCPU · 2 GB RAM · 20 GB SSD.
> PostgreSQL + Redis + FastAPI + Expo all fit comfortably at 1–2 users.

---

## Step 1 — Provision Your Server

```bash
# DigitalOcean example — any Ubuntu 22.04 droplet works
# After SSH in:

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose v2
sudo apt-get install -y docker-compose-plugin

# Verify
docker compose version
```

---

## Step 2 — Clone the Repo

```bash
git clone https://github.com/YOUR_ORG/Snacc-Buddy.git
cd Snacc-Buddy
```

---

## Step 3 — Fill in `.env`

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in every value:

```env
# ── AI ──────────────────────────────────────────────
GEMINI_API_KEY=AIza...your_key_here
GEMINI_MODEL=gemini-2.0-flash

# ── Database ────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://snaccuser:StrongPass123@db:5432/snacc_buddy
POSTGRES_USER=snaccuser
POSTGRES_PASSWORD=StrongPass123
POSTGRES_DB=snacc_buddy

# ── Auth secrets — generate with: openssl rand -hex 32 ──
JWT_SECRET=<32-byte-hex>
RESET_PASSWORD_TOKEN_SECRET=<32-byte-hex>
VERIFICATION_TOKEN_SECRET=<32-byte-hex>

# ── Email (Gmail example) ───────────────────────────
MAIL_USERNAME=youraddress@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx   # Gmail App Password (not your login password)
MAIL_FROM=youraddress@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_STARTTLS=true
MAIL_SSL_TLS=false
FRONTEND_RESET_PASSWORD_URL=http://YOUR_SERVER_IP:8081/reset-password

# ── Cloudflare R2 ───────────────────────────────────
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=snacc-buddy-images
CLOUDFLARE_PUBLIC_URL=https://pub-xxx.r2.dev
```

> **Generate secrets:**
> ```bash
> openssl rand -hex 32   # run 3 times, one per secret
> ```

---

## Step 4 — Set Your Public Host

Create a `.env` file at the repo root (next to `docker-compose.yml`):

```bash
# Replace with your server's IP or domain
echo 'SERVER_HOST=123.456.78.90' >> .env
echo 'EXPO_PUBLIC_API_URL=http://123.456.78.90:8000' >> .env
echo 'CORS_ORIGINS=["http://123.456.78.90:8081","http://123.456.78.90:8000"]' >> .env
```

> If you have a domain + SSL (recommended even for 2 users):
> ```bash
> echo 'SERVER_HOST=app.yourdomain.com' >> .env
> echo 'EXPO_PUBLIC_API_URL=https://api.yourdomain.com' >> .env
> echo 'CORS_ORIGINS=["https://app.yourdomain.com"]' >> .env
> ```

---

## Step 5 — Build & Start

```bash
docker compose up -d --build

# Watch logs to confirm all services started clean
docker compose logs -f api
```

Expected output:
```
api | INFO:     Application startup complete.
api | INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 6 — Verify the Backend

```bash
# Health check
curl http://YOUR_SERVER_IP:8000/health

# Should return: {"status": "ok"}
```

---

## Step 7 — Open the App

Navigate to `http://YOUR_SERVER_IP:8081` in a browser.

The app runs as a web app via Expo. For iOS/Android, users can open the same URL in their mobile browser — it works as a Progressive Web App.

---

## Step 8 — Register Your First User

1. Open the app in browser
2. Go through onboarding (all 12 screens)
3. Complete registration with email + password
4. Check email for verification link
5. Log your first meal via photo upload

---

## Firewall — Open These Ports

```bash
# If using ufw (Ubuntu default firewall)
sudo ufw allow 8000    # API
sudo ufw allow 8081    # Frontend
sudo ufw allow 22      # SSH (keep this!)
sudo ufw enable
```

---

## What's Deliberately NOT in This MVP

These are explicitly deferred — the app works fully without them:

| Feature | When |
|---------|------|
| Weight logging | Phase 1 |
| 30-day macro trend charts | Phase 1 |
| Recipe recommendations | Phase 2 |
| AI coaching | Phase 3 |
| Native iOS/Android app | Phase 4 |

---

## When You're Ready to Invite the Second User

Same steps — they register themselves at your URL. There's no invite-only gate currently, so if you want to restrict to known users only, set `AI_RATE_LIMIT_REQUESTS=10` (already the default) and share the URL only with your test users.

---

## Monitoring (Minimal)

```bash
# View live logs
docker compose logs -f

# Check container health
docker compose ps

# Restart if needed
docker compose restart api
```

---

## Backup (Minimal — Before You Have Real User Data)

```bash
# Manual database dump
docker compose exec db pg_dump -U snaccuser snacc_buddy > backup_$(date +%Y%m%d).sql
```

Set this up as a cron job once you have real data.
