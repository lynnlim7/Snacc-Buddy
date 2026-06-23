# System Design — AI Nutrition Coach (RAG + Multi-Agent)

**Scope:** How the RAG recommendation / multi-agent coaching workflow integrates into the **existing** Snacc Buddy backend. This is an integration map, not a product roadmap (see `roadmap_ai_nutrition_coaching_platform.md` for product context).

**Status:** Design — no code changed yet.

## Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Embeddings provider | **Gemini embeddings** via the already-configured `google-genai` client | No second provider; reuse `gemini_service` + governance model registry |
| Insight persistence | **Dedicated `nutrition_insights` table** that references the inference log (FK), not only `response_payload` JSONB | Frontend "AI Insights" cards query a typed table cleanly |
| Orchestration | **Async SQLAlchemy**, `POST /nutrition-coach/analyze` stays **fully synchronous** | Matches existing `/analyze` shape and rate limiter; no job queue for MVP |

## Guiding principle

The existing **AI governance framework** (`backend/app/ai_governance/`) already implements the spec's Modules 7 (Governance), 8 (Audit Trail), and 9 (Human Review). **We do not rebuild them.** Every new agent AI call flows through the existing `InferenceAuditService.begin_inference → complete_inference` envelope, which already records model version, prompt version, confidence, latency, risk score, `valid_flag`, and the review queue.

## Module → infrastructure map

| Spec Module | Action | Concrete integration point |
|---|---|---|
| 1. Recipe Knowledge Base | Build new | Enable pgvector (migration + `pgvector` dep + `config.py` settings); `recipes` table + ingestion script |
| 2. User Nutrition Memory | Extend | Reuse `User` model + `FoodRepository.get_weekly_summary/get_daily_summary/get_streak`; add 7/30/90d rollups + `user_nutrition_summary` table |
| 3. Nutrition Analysis Agent | Build new | New service following `FoodService` pattern; emits `NutritionInsight` |
| 4. Retrieval Agent | Build new | pgvector similarity + metadata/macro SQL filters |
| 5. Recommendation Agent | Build new | Wraps `gemini_service`; output includes mandatory reasoning |
| 6. Orchestrator | Build new | `NutritionCoachOrchestrator`, constructor DI (matches `FoodService(FoodRepository(db))`) |
| 7. Governance Agent | **Exists — extend** | `RiskAssessmentEngine`; add coaching `BaseRiskRule` subclasses |
| 8. AI Audit Trail | **Exists — reuse** | `InferenceAuditService`, `ai_inference_logs`, `risk_assessments` |
| 9. Human Review | **Exists — reuse** | `HumanReviewService.get_unreviewed_high_risk`, `valid_flag` 0.0/0.5/1.0 |
| 10. Coach APIs | Build new | New router registered in `app/factory.py` (like `chat`/`analyze`) |
| 11. Frontend Coach page + chat | Extend | New `(tabs)` screen, `api.ts` methods, new Zustand store |

## Orchestration flow — `POST /nutrition-coach/analyze`

Fully synchronous; async SQLAlchemy session injected via `Depends(get_db)`.

```
NutritionCoachOrchestrator.run(user_id)
│
├─ Step 1  NutritionMemoryService.build_snapshot(user_id)        [no AI]
│          reads User (goals/weight/dietary/conditions)
│          + FoodRepository 7/30/90d rollups
│          → persists user_nutrition_summary row
│
├─ Step 2  NutritionAnalysisAgent.analyze(snapshot)              [AI call #1]
│          audit.begin_inference(model_id, prompt_version_id) ──┐ governance
│          gemini → NutritionInsight                            │ envelope
│          audit.complete_inference(confidence, risk_context) ──┘ (risk + audit row)
│          → persist nutrition_insights row (FK → inference_log)
│
├─ Step 3  RetrievalAgent.retrieve(insights, snapshot)          [no AI]
│          Gemini-embed the query → pgvector top-K
│          + metadata filters (diet_tags, calories, protein, fibre)
│          → ranked recipe candidates
│          (embedding call itself goes through audit envelope as a registered model)
│
├─ Step 4  RecommendationAgent.recommend(insights, recipes, snapshot)  [AI call #2]
│          audit.begin_inference / complete_inference  ← governance envelope
│          → coaching response WITH reasoning (never similarity-only)
│
├─ Step 5  Governance gate (inside complete_inference)
│          risk HIGH / valid_flag 0.5 → HumanReviewService queue
│
└─ Response: { summary, recommendations, recipes, explanation, session_id }
```

Each agent is an independently testable class receiving dependencies in `__init__`. The orchestrator is the only component that knows the step order.

## New database work (Alembic — async, matches existing env)

1. **pgvector enable** — `CREATE EXTENSION IF NOT EXISTS vector`; add `pgvector` to `pyproject.toml`; add `EMBEDDING_MODEL` / `EMBEDDING_DIM` to `config.py`.
2. **`recipes`** — Module 1 fields + `embedding_vector vector(EMBEDDING_DIM)`; HNSW/ivfflat index on the vector; B-tree indexes on `diet_tags`, `calories`, `protein_g`, `fibre_g` for metadata filtering.
3. **`user_nutrition_summary`** — Module 2 snapshot, one row per orchestration run (versioned/timestamped, retrievable).
4. **`nutrition_insights`** — Module 3 typed output; columns for `protein_deficit`, `fibre_deficit`, `excess_sodium`, `weight_loss_stalled`, `confidence`, plus `inference_id` FK → `ai_inference_logs.id`.

No changes required to existing tables: coach inference rows reuse `ai_inference_logs` as-is — `food_log_id` is nullable, so coach calls leave it null.

## Governance & chat guardrails (the real extension)

The existing risk engine is **Open-Closed** (`DEFAULT_RULES` in `risk_engine/engine.py`); add rules without touching existing ones. Tier mapping already aligns with the spec's Approve/Review/Reject (`valid_flag` 0.0/0.5/1.0).

- `MedicalAdviceRule` → pushes score into the Review band when output touches disease treatment → escalates to human review.
- `OutOfScopeRule` → for the chat endpoint.

**Chat scope guardrail is two-layered** (prompt alone is insufficient):
1. **Prompt-level** — a coach system prompt in `app/prompt/prompt.py` constraining answers to nutrition / this user's data; refuse everything else.
2. **Governance-level** — same audit envelope + out-of-scope risk rule, so refusals and escalations are logged and auditable like any other inference.

## New API surface (registered in `app/factory.py`)

```
POST /api/v1/nutrition-coach/analyze            full orchestration → coaching session
GET  /api/v1/nutrition-coach/history            prior coaching sessions
GET  /api/v1/nutrition-coach/recommendations    current recommendations
GET  /api/v1/nutrition-coach/insights           nutrition insights (from nutrition_insights table)
GET  /api/v1/nutrition-coach/audit              audit trail (reuses governance inference queries)
POST /api/v1/nutrition-coach/chat               scoped, guardrailed coach chat
```

Rate-limit `/analyze` and `/chat` with the existing `RateLimiter` dependency (Redis-backed).

## Frontend integration

- New `app/(tabs)/coach.tsx` — Weekly Summary, AI Insights cards (query `/insights`), Recommended Meals (recipe cards + "why recommended"), AI Coach Chat.
- New methods in `frontend/services/api.ts`; new `coachStore.ts` (Zustand, matches existing store pattern).
- The existing `recipes.tsx` tab shell can host recipe browse/detail backed by the new `recipes` table.

## Suggested build order

1. pgvector + `recipes` table + Gemini-embedding ingestion script (HuggingFace `recipes-with-nutrition`)
2. `NutritionMemoryService` + `user_nutrition_summary`
3. `NutritionAnalysisAgent` + `nutrition_insights` table (through audit envelope)
4. `RetrievalAgent` (vector + metadata filtering)
5. `RecommendationAgent` (reasoning-mandatory)
6. `NutritionCoachOrchestrator` (DI wiring, per-step tests)
7. Coaching `BaseRiskRule` subclasses (medical / out-of-scope)
8. Coach routes + factory registration
9. Frontend coach page + scoped chat

## Open decisions remaining

- Embedding dimension / exact Gemini embedding model id to register in the governance model registry.
- Recipe ingestion cadence (one-off seed vs. re-runnable upsert) — spec requires "future recipe ingestion," so make the script idempotent.
- Whether `/analyze` re-runs on every request or caches the latest session per user (Redis cache layer already exists in `app/services/cache.py`).
