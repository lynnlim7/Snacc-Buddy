# Snacc Buddy

A food calorie tracking app that uses Google Gemini AI to analyse photos of meals and estimate nutritional content. Log what you eat by photographing it, refine the AI's analysis through a chat interface, and track your macros, streaks, and weekly progress.

---

## Features

### AI Food Analysis
- **Photo-to-nutrition**: Upload or capture a photo of any meal and Gemini AI returns a structured breakdown — food name, ingredients, serving size, preparation method, macros (protein, carbs, fat, fibre, sugar, sodium), total calories, and a confidence score.
- **Chat refinement**: After the initial analysis, chat with the AI to correct mistakes ("actually that's 200g not 100g", "it's butter not oil"). Each correction produces an updated analysis.
- **Result caching**: Identical images (SHA-256 matched) return instantly from Redis — no redundant Gemini calls.
- **Deduplication lock**: A 60-second Redis lock prevents double-processing if the same image is uploaded concurrently.

### Food Diary
- **Daily diary view**: Journal-style page showing all meals for the selected date.
- **Meal types**: Breakfast, Lunch, Dinner, Snack, Dessert, Supper.
- **Mood tracking**: Tag each meal with mood stickers.
- **Notes**: Add free-text notes to any meal entry.
- **Edit & delete**: Update meal details or remove entries, with ownership enforcement (users can only modify their own logs).

### Analytics
- **Daily summary**: Calories, protein, carbs, and fat for any date, with a TDEE-based calorie goal.
- **Weekly bar chart**: 7-day calorie history with a goal line overlay, fetched in a single SQL query.
- **Streak counter**: Consecutive days with at least one logged meal.
- **Personalised goal**: Calorie target calculated from your profile (age, height, weight, gender, lifestyle, goal) using the Mifflin-St Jeor BMR formula.

### User Accounts
- **JWT authentication** via fastapi-users.
- **Email verification** and **password reset** flows.
- **Onboarding**: Collects profile data (dietary restrictions, health goals, lifestyle) on first login.
- **Profile management**: Update any profile field at any time.

### AI Governance Layer
- **Model registry**: Register and version Gemini model configurations.
- **Prompt registry**: Version-controlled prompt templates with SHA-256 content hashes.
- **Inference audit log**: Every AI call is logged with request/response payloads, latency, confidence score, and risk level.
- **Risk engine**: Automatically flags low-confidence results, high-calorie meals, or ambiguous analyses.
- **Human review queue**: Flag inference records for manual review.
- **Auto-seed**: On first boot, a default model and prompt are seeded automatically so `/analyze` works out of the box.
- **Per-user rate limiting**: 10 AI requests per hour (configurable).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Expo / React Native (web + iOS + Android) |
| Backend | FastAPI + Python 3.10+ |
| Database | PostgreSQL 16 |
| Cache / rate-limit | Redis 7 |
| AI | Google Gemini (`gemini-2.0-flash`) |
| Auth | fastapi-users (JWT + bcrypt) |
| ORM | SQLAlchemy 2 async + asyncpg |
| Migrations | Alembic |
| Dependency management | uv |
| Container | Docker + Docker Compose |

---

## Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| Docker Desktop | 24+ | https://docs.docker.com/get-docker/ |
| Node.js | 20+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| uv | 0.4+ | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Git | any | https://git-scm.com |

You also need a **Google Gemini API key** (free tier works). Get one at https://aistudio.google.com/app/apikey.

---

## Project Structure

```
Snacc-Buddy/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── ai_governance/    # Model registry, prompt versioning, inference audit
│   │   ├── analytics/        # Weekly/daily summary, streak logic
│   │   ├── api/routes/       # FastAPI route handlers
│   │   ├── core/             # Config, auth, database, Redis, exceptions
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── prompt/           # Gemini service + analysis prompt
│   │   ├── repositories/     # Database query layer
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # Business logic
│   │   └── tests/            # Pytest unit tests
│   ├── alembic/              # Database migrations
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/                 # Expo / React Native app
│   ├── app/
│   │   ├── (tabs)/           # Diary, Camera/Scan, Analytics, Profile tabs
│   │   ├── login.tsx
│   │   └── onboarding/
│   ├── components/           # Shared UI components
│   ├── services/api.ts       # Axios API client
│   ├── stores/               # Zustand state stores
│   ├── utils/                # Shared utilities (calorie goal formula, etc.)
│   └── Dockerfile
└── docker-compose.yml
```

---

## Quick Start — Full Docker (recommended)

This runs the entire stack (Postgres, Redis, FastAPI, Expo web) in containers.

### 1. Clone the repository

```bash
git clone https://github.com/lynnlim7/Snacc-Buddy.git
cd Snacc-Buddy
```

### 2. Generate secure secrets

Run each command and copy the output into the corresponding variable in your `.env` file:

```bash
# JWT_SECRET
python3 -c "import secrets; print(secrets.token_hex(32))"

# RESET_PASSWORD_TOKEN_SECRET
python3 -c "import secrets; print(secrets.token_hex(32))"

# VERIFICATION_TOKEN_SECRET
python3 -c "import secrets; print(secrets.token_hex(32))"

# POSTGRES_PASSWORD (or choose your own strong password)
python3 -c "import secrets; print(secrets.token_urlsafe(24))"
```

### 3. Create the backend environment file

Create `backend/.env` and fill in every value:

```env
# ── Gemini AI ─────────────────────────────────────────────────────────
GEMINI_API_KEY=<your-google-ai-studio-api-key>
GEMINI_MODEL=gemini-2.0-flash
GEMINI_TEMPERATURE=0.2
GEMINI_TIMEOUT_SECONDS=30

# ── Database (Docker service name "db" is the hostname inside compose) ─
DATABASE_URL=postgresql+asyncpg://<db-user>:<db-password>@db:5432/<db-name>
POSTGRES_USER=<db-user>
POSTGRES_PASSWORD=<db-password>
POSTGRES_DB=<db-name>

# ── Security (use the generated values from step 2) ───────────────────
JWT_SECRET=<generated-64-char-hex>
RESET_PASSWORD_TOKEN_SECRET=<generated-64-char-hex>
VERIFICATION_TOKEN_SECRET=<generated-64-char-hex>

# ── Email ─────────────────────────────────────────────────────────────
MAIL_USERNAME=<your-email@example.com>
MAIL_PASSWORD=<your-smtp-password-or-app-password>
MAIL_FROM=<your-email@example.com>
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_FROM_NAME=Snacc Buddy
MAIL_STARTTLS=true
MAIL_SSL_TLS=false

# ── App ───────────────────────────────────────────────────────────────
CORS_ORIGINS=["http://localhost:8081","exp://localhost:8081"]
MAX_IMAGE_SIZE_MB=10
FRONTEND_RESET_PASSWORD_URL=http://localhost:8081/reset-password
```

> **Gmail tip**: Create an [App Password](https://support.google.com/accounts/answer/185833) instead of using your main Gmail password. Go to Google Account → Security → 2-Step Verification → App Passwords.

### 4. Build and start all services

```bash
docker compose up --build
```

This starts PostgreSQL on port `5434`, Redis on port `6379`, the FastAPI backend on port `8000` (migrations run automatically), and the Expo web frontend on port `8081`.

Wait for the log line `Application startup complete.` from the `api` container before opening the browser.

### 5. Open the app

```
http://localhost:8081
```

Register an account, complete onboarding, and start logging meals.

---

## Local Development Setup

Use this path if you want hot-reload on both backend and frontend without rebuilding Docker images.

### 1. Clone and enter the repo

```bash
git clone https://github.com/lynnlim7/Snacc-Buddy.git
cd Snacc-Buddy
```

### 2. Start infrastructure (Postgres + Redis only)

```bash
docker compose up db redis -d
```

Postgres will be available at `localhost:5434` and Redis at `localhost:6379`.

### 3. Create the environment file

Create `backend/.env` using the same template as above (step 3 of the Docker section), but change the `DATABASE_URL` host from `db` to `localhost` and the port to `5434`:

```env
DATABASE_URL=postgresql+asyncpg://<db-user>:<db-password>@localhost:5434/<db-name>
```

All other variables are identical to the Docker setup.

### 4. Set up the Python virtual environment

> **Important**: always run `uv` commands from inside the `backend/` directory. Running from the repo root recreates the venv from scratch on every invocation.

```bash
cd backend

# Create a fresh virtual environment
uv venv

# Install all dependencies
# Use --reinstall on a fresh clone or after deleting .venv
uv sync --reinstall
```

Verify the install:

```bash
.venv/bin/python -m pip list | grep fastapi
# fastapi   0.115.x
```

### 5. Apply database migrations

The migration chain has multiple heads that must be applied separately. Run all commands from inside `backend/`:

```bash
# Step 1: core food_logs table
.venv/bin/alembic upgrade 2f8a45c69b31

# Step 2: user profile fields + AI governance tables
.venv/bin/alembic upgrade bc07eafa8785
```

Then apply the mood column and stamp the remaining heads directly (the `a1b2c3d4e5f6` migration cannot run via Alembic due to an enum-creation bug in SQLAlchemy + asyncpg):

```bash
# Add mood column to food_logs
docker exec snacc-buddy-db-1 psql -U <db-user> -d <db-name> \
  -c "ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS mood JSONB NOT NULL DEFAULT '[]'::jsonb;"

# Stamp all migration heads so Alembic knows they are applied
docker exec snacc-buddy-db-1 psql -U <db-user> -d <db-name> -c "
  INSERT INTO alembic_version (version_num) VALUES ('a1b2c3d4e5f6') ON CONFLICT DO NOTHING;
  INSERT INTO alembic_version (version_num) VALUES ('2f8a45c69b31') ON CONFLICT DO NOTHING;
  INSERT INTO alembic_version (version_num) VALUES ('99447c563d39') ON CONFLICT DO NOTHING;
"
```

> **Why the workaround?** Migration `a1b2c3d4e5f6` creates PostgreSQL enum types inside `op.create_table()`, which triggers a SQLAlchemy/asyncpg double-creation error even when `create_type=False` is set. The governance tables are applied via `alembic upgrade bc07eafa8785`, then the mood column is patched in directly.

### 6. Start the backend

If you put all variables in `backend/.env`, the backend reads them automatically. Otherwise pass them inline:

```bash
cd backend   # ensure you are inside backend/

.venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

To suppress email sending during local development (so registration works without SMTP configured):

```bash
MAIL_SUPPRESS_SEND=1 .venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API is live at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

### 7. Start the frontend

Open a new terminal:

```bash
cd frontend

# Install Node dependencies (only needed once)
npm install

# Start Expo web dev server
EXPO_PUBLIC_API_URL=http://localhost:8000 \
EXPO_PUBLIC_PLATFORM_MODE=web \
npx expo start --web --port 8081
```

Open `http://localhost:8081` in your browser.

---

## Running on a Physical Mobile Device

1. Find your machine's LAN IP:
   ```bash
   # macOS
   ipconfig getifaddr en0

   # Linux
   ip route get 1 | awk '{print $7}'
   ```

2. Start the backend bound to all interfaces:
   ```bash
   cd backend
   .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. Start Expo with your LAN IP:
   ```bash
   cd frontend
   EXPO_PUBLIC_API_URL=http://<your-lan-ip>:8000 \
   REACT_NATIVE_PACKAGER_HOSTNAME=<your-lan-ip> \
   npx expo start --host lan
   ```

4. Scan the QR code in the **Expo Go** app on your phone.

---

## Running Tests

```bash
cd backend

PYTHONPATH=. .venv/bin/pytest app/tests/ -v
```

The unit tests use `AsyncMock` and do not require a running database or Gemini key.

---

## API Reference

Base URL: `http://localhost:8000`

Interactive docs (Swagger UI): `http://localhost:8000/docs`

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/jwt/login` | Log in, returns JWT |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with token |
| `GET` | `/users/me` | Get current user profile |
| `PATCH` | `/users/me` | Update profile |

### Food Logging

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/food/analyze` | Upload image → AI nutritional analysis |
| `POST` | `/api/v1/food/logs` | Save a confirmed food log |
| `GET` | `/api/v1/food/logs` | List logs (`?date=YYYY-MM-DD` filters by day) |
| `GET` | `/api/v1/food/logs/{id}` | Get a single log |
| `PATCH` | `/api/v1/food/logs/{id}` | Update notes or mood |
| `DELETE` | `/api/v1/food/logs/{id}` | Delete a log |
| `POST` | `/api/v1/food/chat` | Refine analysis via chat messages |

### Analytics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/analytics/daily` | Daily calorie + macro totals (`?target_date=YYYY-MM-DD`) |
| `GET` | `/api/v1/analytics/weekly` | Last 7 days in a single query |
| `GET` | `/api/v1/analytics/streak` | Current consecutive-day streak |

### AI Governance

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/governance/models` | List registered AI models |
| `POST` | `/api/v1/governance/models` | Register a new model |
| `GET` | `/api/v1/governance/prompts` | List prompt versions |
| `POST` | `/api/v1/governance/prompts` | Create a new prompt version |
| `GET` | `/api/v1/governance/inference-logs` | Browse inference audit records |
| `GET` | `/api/v1/governance/dashboard` | Aggregated governance metrics |

---

## Environment Variables Reference

All variables are read from `backend/.env`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Google AI Studio API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model identifier |
| `GEMINI_TEMPERATURE` | No | `0.2` | Generation temperature (0–1) |
| `GEMINI_TIMEOUT_SECONDS` | No | `30` | Per-request timeout |
| `DATABASE_URL` | Yes | — | asyncpg connection string |
| `POSTGRES_USER` | Yes | — | PostgreSQL username (used by Docker container) |
| `POSTGRES_PASSWORD` | Yes | — | PostgreSQL password (used by Docker container) |
| `POSTGRES_DB` | Yes | — | PostgreSQL database name |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `GEMINI_CACHE_TTL_SECONDS` | No | `86400` | How long to cache identical image analyses (24 h) |
| `GEMINI_DEDUP_TTL_SECONDS` | No | `60` | Dedup lock TTL for concurrent identical requests |
| `AI_RATE_LIMIT_REQUESTS` | No | `10` | Max AI requests per user per window |
| `AI_RATE_LIMIT_WINDOW_SECONDS` | No | `3600` | Rate limit window duration |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs — must not be the default in production |
| `JWT_LIFETIME_SECONDS` | No | `3600` | Token expiry |
| `RESET_PASSWORD_TOKEN_SECRET` | Yes | — | Secret for password reset tokens |
| `VERIFICATION_TOKEN_SECRET` | Yes | — | Secret for email verification tokens |
| `CORS_ORIGINS` | No | `["http://localhost:8081"]` | Allowed frontend origins (JSON array) |
| `MAX_IMAGE_SIZE_MB` | No | `10` | Upload size limit |
| `MAIL_USERNAME` | Yes | — | SMTP username |
| `MAIL_PASSWORD` | Yes | — | SMTP password or app password |
| `MAIL_FROM` | Yes | — | Sender address |
| `MAIL_PORT` | No | `587` | SMTP port |
| `MAIL_SERVER` | Yes | — | SMTP hostname |
| `MAIL_SUPPRESS_SEND` | No | — | Set to `1` to skip all email sending (development only) |
| `ENV` | No | `development` | Set to `production` to enforce secret validation on startup |

---

## Common Issues

### Backend fails to start: `JWT_SECRET must not be the default value`

You are running with `ENV=production` and a placeholder secret. Either set `ENV=development` in your `.env` or replace all secrets with securely generated values (see the `python3 -c "import secrets..."` commands above).

### `ModuleNotFoundError: No module named 'app'`

You ran `uv` or `pytest` from the repo root instead of inside `backend/`. Always `cd backend` first.

### Registration returns 500 / SMTP error in development

Add `MAIL_SUPPRESS_SEND=1` to your environment or `.env` to skip email sending, or supply real SMTP credentials.

### `UndefinedColumnError: column food_logs.mood`

Migration `99447c563d39` was not applied. Run the `ALTER TABLE` psql command in step 5 of Local Development Setup.

### `uv sync` says "Audited N packages" but imports fail

The `.venv` directory is broken. Delete it and reinstall:

```bash
cd backend
rm -rf .venv
uv venv
uv sync --reinstall
```

### `ImportError: The version of cryptography does not match the loaded shared object`

Same fix as above — delete `.venv` and reinstall.

### Port 5434 already in use

Change the host port in `docker-compose.yml`:

```yaml
ports:
  - "5435:5432"   # use any free port
```

Then update `DATABASE_URL` in your `.env` to use the new port.

---

## License

MIT — see [LICENSE](LICENSE).
