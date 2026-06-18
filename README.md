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
| AI | Google Gemini (`gemini-2.5-flash`) |
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

### 2. Create the backend environment file

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in the placeholder values. Every key is documented inside the file.

### 3. Build and start all services

```bash
docker compose up --build
```

This starts PostgreSQL on port `5434`, Redis on port `6379`, the FastAPI backend on port `8000` (migrations run automatically), and the Expo web frontend on port `8081`.

Wait for the log line `Application startup complete.` from the `api` container before opening the browser.

### 4. Open the app

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

```bash
cd backend
DATABASE_URL="postgresql+asyncpg://<db-user>:<db-password>@localhost:5434/<db-name>" \
  .venv/bin/alembic upgrade head
```

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

## License

MIT — see [LICENSE](LICENSE).
