---
name: run-snacc-buddy
description: "Run, start, launch, test, screenshot, smoke test Snacc Buddy. Starts the FastAPI backend and Expo web frontend. Drives the app via curl (API) or chromium-cli (web UI). Stack: FastAPI + PostgreSQL + Redis + Expo/React Native web."
---

Snacc Buddy is a monorepo: `backend/` (FastAPI, port 8000) + `frontend/` (Expo web, port 8081). The backend depends on PostgreSQL (Docker, port 5434) and Redis (Docker, port 6379). Paths below are relative to repo root.

## Prerequisites

```bash
# Docker services — start once, leave running
docker compose up db redis -d

# Backend venv — MUST use --reinstall on a fresh clone or after deleting .venv
# Plain `uv sync` says "Audited" and silently installs nothing (uv cache bug)
cd backend && uv sync --reinstall && cd ..

# Frontend node_modules — already installed if node_modules/ exists
cd frontend && npm install && cd ..
```

## Run (agent path) — smoke test + optional web

The driver is `.claude/skills/run-snacc-buddy/smoke.sh`. It starts the backend, runs curl assertions against all key endpoints, then optionally starts the Expo web frontend.

```bash
# API smoke only (starts backend, runs assertions, stops cleanly)
bash .claude/skills/run-snacc-buddy/smoke.sh

# API + Expo web (leaves both running; note PIDs printed)
bash .claude/skills/run-snacc-buddy/smoke.sh --web
```

Output on success:
```
→ Starting backend...
  ✓ /health OK
  ✓ register: smoke-...@test.dev
  ✓ login: got JWT
  ✓ GET /api/v1/food/logs
  ✓ POST /api/v1/food/logs (confirm)
  ✓ GET /api/v1/analytics/daily
  ✓ GET /api/v1/analytics/weekly
  ✓ GET /api/v1/analytics/streak
  ✓ PATCH /api/v1/food/logs/{id}
  ✓ DELETE /api/v1/food/logs/{id}
Backend smoke: PASS
```

## Manual backend launch (env vars required)

The `.env` file has `DATABASE_URL` pointing to the Docker hostname `db:5432`. For local (non-Docker) runs, override both URLs:

```bash
cd backend
DATABASE_URL="postgresql+asyncpg://snacc_buddy_admin:nomz123@localhost:5434/snacc_buddy" \
REDIS_URL="redis://localhost:6379" \
MAIL_SUPPRESS_SEND=1 \
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

`MAIL_SUPPRESS_SEND=1` silences the SMTP connection — required unless you configure real mail credentials. Without it, `POST /auth/register` returns 500 trying to send a welcome email.

## Manual Expo web launch

```bash
cd frontend
EXPO_PUBLIC_API_URL=http://localhost:8000 \
EXPO_PUBLIC_PLATFORM_MODE=web \
npx expo start --web --port 8081
```

Opens at `http://localhost:8081`. Splash screen → "Log in" → enter credentials → diary tab.

## Interact via chromium-cli

```javascript
// Navigate and screenshot the diary tab after login:
await page.goto('http://localhost:8081/login');
await page.fill('[placeholder="Email"]', 'smoke@test.dev');
await page.fill('[placeholder="Password"]', 'Smoke1234!');
await page.click('button:has-text("Open my diary")');
await page.screenshot({ path: 'diary.png' });
```

## Direct API calls (curl)

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/jwt/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=smoke@test.dev&password=Smoke1234!" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# List food logs
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/food/logs

# Daily summary
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/analytics/daily?target_date=$(date +%Y-%m-%d)"

# OpenAPI docs
open http://localhost:8000/docs
```

## Database migrations

The migration chain has two heads that must be applied separately. On a fresh DB:

```bash
cd backend
DATABASE_URL="postgresql+asyncpg://snacc_buddy_admin:nomz123@localhost:5434/snacc_buddy" \
.venv/bin/alembic upgrade 2f8a45c69b31    # food_logs table
```

The AI governance migration (`a1b2c3d4e5f6`) cannot be applied via alembic due to two bugs — see Gotchas. Apply the mood column directly and stamp all three versions:

```bash
# Add mood column (if missing — applies after governance tables already exist)
docker exec snacc-buddy-db-1 psql -U snacc_buddy_admin -d snacc_buddy \
  -c "ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS mood JSONB NOT NULL DEFAULT '[]'::jsonb;"

# Stamp alembic so it knows all three heads are applied
docker exec snacc-buddy-db-1 psql -U snacc_buddy_admin -d snacc_buddy \
  -c "INSERT INTO alembic_version (version_num) VALUES ('a1b2c3d4e5f6') ON CONFLICT DO NOTHING;
      INSERT INTO alembic_version (version_num) VALUES ('2f8a45c69b31') ON CONFLICT DO NOTHING;
      INSERT INTO alembic_version (version_num) VALUES ('99447c563d39') ON CONFLICT DO NOTHING;"
```

## Run (human path)

1. Start infra: `docker compose up db redis -d`
2. Start backend in one terminal: `cd backend && uv run uvicorn main:app` (will fail unless you set DATABASE_URL and REDIS_URL — use the env vars above)
3. Start frontend in another: `cd frontend && npm run web`
4. Open `http://localhost:8081`

## Gotchas

**`mood` column missing on existing DBs where `99447c563d39` never applied.** The `99447c563d39` migration has two heads (`2f8a45c69b31` + `a1b2c3d4e5f6`). If alembic_version only has `2f8a45c69b31`, running `alembic upgrade 99447c563d39` tries to apply the broken governance migration first and errors. Fix: use the psql commands in the Database migrations section above — add the column directly and stamp all three version rows into alembic_version.

**`alembic stamp <rev>` replaces the current version, not adds to it.** Stamping `a1b2c3d4e5f6` deletes `2f8a45c69b31` from alembic_version. For multi-head migrations, insert rows directly via psql rather than using `alembic stamp`.

**`uv run` re-creates the venv when called from outside `backend/`.** `uv run` invoked from the repo root finds no `pyproject.toml` and recreates `.venv` from scratch on every call. Always `cd backend` first before running any `uv` command.

**`uv sync` silently installs nothing on a fresh venv.** After deleting `.venv` and recreating with `uv venv`, `uv sync` says "Audited 94 packages" and skips installation. The venv ends up with only 3 items in site-packages. Fix: `uv sync --reinstall`.

**`current_active_user` was missing from `auth.py`.** The routes imported it but it wasn't defined. Fixed by adding `current_active_user = fastapi_users.current_user(active=True)` to `backend/app/core/auth.py`.

**`users` table named `user` in the migration.** The `bc07eafa8785` migration creates a table named `user` (singular), but the `User` model has `__tablename__ = "users"`. The migration also used column names `has_dietary_restrictions`/`has_conditions` that the model renamed to `dietary_restrictions`/`medical_conditions`. Fix applied with `ALTER TABLE` directly.

**`MAIL_SUPPRESS_SEND` env var required for registration.** `POST /auth/register` attempts to send a welcome email via SMTP on success. The `.env` placeholders are fake Gmail credentials that fail authentication. Without `MAIL_SUPPRESS_SEND=1`, registration returns 500.

**`CREATE TYPE IF NOT EXISTS` does not exist in PostgreSQL.** Despite being on PostgreSQL 16, this syntax is unsupported. Use `DO $$ BEGIN CREATE TYPE ...; EXCEPTION WHEN duplicate_object THEN null; END $$` instead. The `a1b2c3d4e5f6` migration was patched to use this pattern but still fails — see below.

**AI governance migration (`a1b2c3d4e5f6`) is broken and cannot apply via alembic.** Two compounding bugs: (1) `sa.Enum(create_type=False)` inside `op.create_table` still triggers `_on_table_create` → `CreateEnumType`, even though the enum was already created by the DO block. This is a SQLAlchemy/asyncpg interaction bug. (2) The migration branches from `bc07eafa8785` in parallel with `2f8a45c69b31`, requiring `alembic upgrade heads` which also fails. Workaround: apply the governance tables manually via psql. The missing columns (`inference_log_id`, `updated_at` on `food_logs`) were added directly with `ALTER TABLE`.

**`cryptography` package has two versions in the same venv.** `uv`'s force-reinstall operations can leave a corrupted venv where the compiled `.so` is from one version (47.x) and the Python package is another (48.x). Symptom: `ImportError: The version of cryptography does not match the loaded shared object`. Fix: delete `.venv` and run `uv sync --reinstall`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'structlog'` | `cd backend && uv add structlog` |
| `ImportError: cannot import name 'current_active_user'` | `auth.py` is missing the line — see Gotchas |
| `UndefinedTableError: relation "users"` | Migration created `user` not `users` — run `ALTER TABLE "user" RENAME TO users` |
| `UndefinedColumnError: column food_logs.inference_log_id` | Governance migration didn't apply — run `ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS inference_log_id UUID` |
| `UndefinedColumnError: column food_logs.mood` | `99447c563d39` migration hasn't run — use the psql commands in Database migrations section |
| `DuplicateTableError: relation "food_logs" already exists` on `alembic upgrade` | Multi-head migration ordering issue — stamp all three versions directly via psql (see Database migrations section) |
| `SMTPAuthenticationError` on register | Set `MAIL_SUPPRESS_SEND=1` env var |
| Backend starts but `uv sync` shows empty site-packages | Delete `.venv`, then `uv sync --reinstall` |
| `The version of cryptography does not match` | Delete `.venv`, then `uv sync --reinstall` |
| `uvicorn: No such file or directory` in `.venv/bin/` | `uv sync --reinstall` (creates the binary) |
