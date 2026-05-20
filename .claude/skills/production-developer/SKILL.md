---
name: production-developer
description: "Production-ready developer for Snacc Buddy. Writes robust, scalable code with clean infrastructure practices. Actions: assess, audit, harden, review, deploy, fix, propose. Domains: Docker, secrets management, health checks, service dependencies, environment config, Dockerfile best practices, docker-compose. Stack: FastAPI (Python/uv), Expo/React Native, PostgreSQL. Rules: always Docker builds, never hardcode secrets, include health checks in every service."
---

# Production Developer — Infrastructure & Code Quality

Developer role focused on shipping robust, production-ready code. Covers infrastructure hardening, secrets hygiene, container best practices, and service reliability for the Snacc Buddy stack (FastAPI + Expo/RN + PostgreSQL).

## When to Apply

Invoke this skill when:
- Reviewing or modifying `Dockerfile`, `docker-compose.yml`, or any CI/CD config
- Adding a new service or dependency
- Touching environment variables or secrets
- Diagnosing deploy failures, missing health checks, or service startup ordering issues
- Proposing infrastructure changes or refactors

---

## Workflow

Every infrastructure task follows this three-step sequence. Never skip to proposals without completing assessment first.

### Step 1 — Assess Current State

Read the current infrastructure before touching anything:

```bash
# Services and their configs
cat docker-compose.yml

# Each service's Dockerfile
cat backend/Dockerfile
cat frontend/Dockerfile

# Env files (check what's expected vs what's committed)
ls -la backend/.env* frontend/.env* 2>/dev/null
```

Capture:
- Which services exist and how they depend on each other
- Which services have health checks, which don't
- Where secrets appear (env vars, `.env` files, hardcoded in compose/Dockerfile)
- Which values are environment-specific but hardcoded (IPs, ports, hostnames)

### Step 2 — Identify Gaps and Risks

Classify every finding by severity before proposing anything:

| Severity | Criteria | Example |
|----------|----------|---------|
| CRITICAL | Secrets exposed or service can silently fail | Hardcoded DB password in compose |
| HIGH | Missing reliability guardrail | No health check on `api` service |
| MEDIUM | Fragile or non-portable config | Hardcoded LAN IP in Dockerfile `ENV` |
| LOW | Best-practice gap with low blast radius | No non-root user in container |

Present findings as a gap table before proposing changes. This surfaces what exists vs what is required.

### Step 3 — Propose Changes with Rationale

For each gap, provide:
1. **What** to change (specific file and line)
2. **Why** it matters (the risk it eliminates)
3. **How** to implement it (code snippet)

Never propose a change without a rationale. Proposals without rationale are rejected.

---

## Rules (Non-Negotiable)

### Rule 1: Always Use Docker Builds

Every service must be built from a `Dockerfile`. Never use `image:` directly for application services — only for infrastructure primitives (postgres, redis, nginx).

```yaml
# WRONG — application service pulled from registry directly
api:
  image: my-api:latest

# RIGHT — built from source
api:
  build:
    context: ./backend
    dockerfile: Dockerfile
```

Multi-stage builds are preferred for production images to minimize surface area:

```dockerfile
# Build stage
FROM python:3.11-slim AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/.venv ./.venv
COPY . .
RUN adduser --disabled-password --no-create-home appuser
USER appuser
EXPOSE 8000
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Rule 2: Never Hardcode Secrets

Secrets are: passwords, API keys, tokens, connection strings with credentials. They must never appear in:
- `Dockerfile` (`ENV`, `ARG`)
- `docker-compose.yml` `environment:` blocks
- Source code (`.py`, `.ts`, `.js`, `.env` committed to git)

**Use `.env` files (gitignored) + `env_file:` in compose, or a secrets manager.**

```yaml
# WRONG
environment:
  POSTGRES_PASSWORD: postgres
  GEMINI_API_KEY: AIza...

# RIGHT — load from gitignored .env
env_file:
  - .env
```

Provide `.env.example` with placeholder values for every `.env` file:

```bash
# .env.example — commit this; .env — gitignore this
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DATABASE_URL=
GEMINI_API_KEY=
```

Development convenience values (e.g. `postgres`/`postgres`) are only acceptable in `.env` files that are gitignored, never in compose or Dockerfiles.

### Rule 3: Health Checks on Every Service

Every service must declare a `healthcheck:`. Dependent services use `condition: service_healthy` — never `condition: service_started`.

**Backend (FastAPI) — HTTP health check:**
```yaml
api:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 15s
  depends_on:
    db:
      condition: service_healthy
```

The `/health` endpoint must exist and return `200`:

```python
# app/main.py
@app.get("/health")
async def health():
    return {"status": "ok"}
```

**Database — pg_isready check (already correct pattern):**
```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
    interval: 5s
    timeout: 5s
    retries: 5
```

**Frontend (Expo/Metro) — process check:**
```yaml
frontend:
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:8081 || exit 1"]
    interval: 15s
    timeout: 10s
    retries: 3
    start_period: 30s
```

---

## Snacc Buddy — Current Gap Register

Gaps identified against the rules above. Address in priority order.

| ID | Service | Severity | Gap | Rule |
|----|---------|----------|-----|------|
| G1 | `db` | CRITICAL | `POSTGRES_PASSWORD: postgres` hardcoded in compose | Rule 2 |
| G2 | `db` | CRITICAL | `POSTGRES_USER: postgres` hardcoded in compose | Rule 2 |
| G3 | `api` | HIGH | No health check defined | Rule 3 |
| G4 | `frontend` | HIGH | No health check defined | Rule 3 |
| G5 | `frontend` | MEDIUM | `ENV REACT_NATIVE_PACKAGER_HOSTNAME` hardcoded IP in Dockerfile | Rule 2 |
| G6 | `api` | MEDIUM | `DATABASE_URL` has embedded credentials in compose `environment:` | Rule 2 |
| G7 | `backend` | LOW | No non-root user in Dockerfile | Rule 1 (hardening) |
| G8 | `backend` | LOW | No multi-stage build | Rule 1 (image size) |

Use this table as the starting checklist for any infrastructure review session.

---

## Environment Variable Standards

All services must support full configuration via environment variables with no fallback hardcodes.

| Variable | Service | Source | Example |
|----------|---------|--------|---------|
| `POSTGRES_USER` | db, api | `.env` | `snacc_user` |
| `POSTGRES_PASSWORD` | db, api | `.env` | (secret) |
| `POSTGRES_DB` | db, api | `.env` | `snacc_buddy` |
| `DATABASE_URL` | api | `.env` | `postgresql+asyncpg://...` |
| `GEMINI_API_KEY` | api | `.env` | (secret) |
| `CORS_ORIGINS` | api | `.env` / compose | `["http://..."]` |
| `EXPO_PUBLIC_API_URL` | frontend | compose / runtime arg | `http://<host>:8000` |
| `REACT_NATIVE_PACKAGER_HOSTNAME` | frontend | compose / runtime arg | `<lan-ip>` |

LAN IPs (`192.168.x.x`) must never be hardcoded. Pass them at runtime:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) docker compose up
```

---

## Code Quality Standards

Infrastructure changes must not break service code. Maintain these alongside any infra work:

- **FastAPI**: All route handlers typed, Pydantic models for request/response bodies, async DB sessions, no `SELECT *`
- **Alembic**: Migrations are the only way to modify schema — never `Base.metadata.create_all()` in production
- **React Native / Expo**: No API URLs or IPs in source files — always from `process.env.EXPO_PUBLIC_*`
- **Secrets in code**: Run `grep -r "password\|secret\|api_key\|AIza" --include="*.py" --include="*.ts" src/` before every commit

---

## Proposing Changes — Output Format

When presenting infrastructure changes, use this structure:

```
## Infrastructure Review — [date]

### Findings
| ID | Severity | Description |
|----|----------|-------------|

### Proposed Changes

#### [G1] Hardcoded DB password (CRITICAL)
**Risk**: Credentials committed to git history; all environments share the same password.
**Change**: Move to `.env` + `env_file:` in compose.
**Diff**:
\```yaml
# docker-compose.yml — db service
- environment:
-   POSTGRES_PASSWORD: postgres
+ env_file:
+   - .env
\```

### Acceptance Criteria
- [ ] No secrets in any committed file
- [ ] All services have passing health checks
- [ ] `docker compose up` reaches healthy state from clean clone + `.env` only
```
