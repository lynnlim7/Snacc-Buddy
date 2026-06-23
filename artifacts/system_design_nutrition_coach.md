# System Design — AI Nutrition Coach (RAG + Multi-Agent)

**Scope:** How the RAG recommendation / multi-agent coaching workflow integrates into the **existing** Snacc Buddy backend. This is an integration map, not a product roadmap (see `roadmap_ai_nutrition_coaching_platform.md` for product context).

**Status:** Design — no code changed yet.

## Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Embeddings provider | **Gemini embeddings** via the already-configured `google-genai` client | No second provider; reuse `gemini_service` + governance model registry |
| Nutrition insights | **Rule-based deterministic engine** (the `NutritionInsightEngine`), **not an LLM call** — e.g. `protein_deficit = avg_protein < protein_target` | Reproducible, cheap, testable by formula; mirrors the existing `RiskAssessmentEngine` Strategy pattern; no audit/model needed |
| Insight persistence | **Dedicated `nutrition_insights` table** (typed columns), no inference-log FK | Deterministic output — the chat-time recommendation that *consumes* insights is what gets audited; frontend "AI Insights" cards query a typed table cleanly |
| Orchestration | **Async SQLAlchemy**, fully synchronous, **split across two triggers**: Stage-1 fan-out (`asyncio.gather`) on meal-log write; Stage-2 coaching call on chat request | Coaching call only when the user chats — meal log adds no new Gemini cost; no job queue for MVP |

## Guiding principle

The existing **AI governance framework** (`backend/app/ai_governance/`) already implements the spec's Modules 7 (Governance), 8 (Audit Trail), and 9 (Human Review). **We do not rebuild them.** Every new agent AI call flows through the existing `InferenceAuditService.begin_inference → complete_inference` envelope, which already records model version, prompt version, confidence, latency, risk score, `valid_flag`, and the review queue.

## Module → infrastructure map

| Spec Module | Action | Concrete integration point |
|---|---|---|
| 1. Recipe Knowledge Base | Build new | Enable pgvector (migration + `pgvector` dep + `config.py` settings); `recipes` table + ingestion script |
| 2. User Nutrition Memory | Extend | Reuse `User` model + `FoodRepository.get_weekly_summary/get_daily_summary/get_streak`; add 7/30/90d rollups + `user_nutrition_summary` table |
| 3. Nutrition Insight Engine *(was "Analysis Agent")* | Build new | **Rule-based, deterministic — no AI.** Mirrors the existing `RiskAssessmentEngine` Strategy/Open-Closed pattern; emits structured `NutritionInsight` |
| 4. Retrieval Agent | Build new | Hybrid funnel: query builder → Gemini embed → pgvector top-50 → metadata filter top-30 → nutrition scoring top-10 |
| 5. Recommendation Agent | Build new | Wraps `gemini_service`; consumes snapshot + insights + top-10; output includes mandatory per-recipe reasoning |
| 6. Orchestrator | Build new | `NutritionCoachOrchestrator`; Stage-1 `asyncio.gather` fan-out → Stage-2 synthesis; constructor DI (matches `FoodService(FoodRepository(db))`) |
| 7. Governance Agent | **Exists — extend** | `RiskAssessmentEngine`; add coaching `BaseRiskRule` subclasses |
| 8. AI Audit Trail | **Exists — reuse** | `InferenceAuditService`, `ai_inference_logs`, `risk_assessments` |
| 9. Human Review | **Exists — reuse** | `HumanReviewService.get_unreviewed_high_risk`, `valid_flag` 0.0/0.5/1.0 |
| 10. Coach APIs | Build new | New router registered in `app/factory.py` (like `chat`/`analyze`) |
| 11. Frontend Coach page + chat | Extend | New `(tabs)` screen, `api.ts` methods, new Zustand store |

## Orchestration flow

The work is split across **two trigger points**. This is deliberate: the
expensive coaching call never sits on the meal-log write path, and the
recommendation is only computed when the user actually asks for it.

| Trigger | What runs | Gemini cost |
|---|---|---|
| **User logs a meal** — `FoodService.confirm_log` | **Stage 1** — Memory ‖ Analysis ‖ Retrieval (concurrent), outputs persisted | rides on the meal-log analysis call that already happens — **no new user-facing latency** |
| **User asks in Chat** — `POST /nutrition-coach/chat` | **Stage 2** — Recommendation Agent reads the persisted Stage-1 outputs + the question | **one** coaching call, on demand only |

Async SQLAlchemy session injected via `Depends(get_db)`; each trigger is its own
synchronous request.

### Stage 1 — on meal log (concurrent fan-out, no coaching call)

```
User logs food ─► FoodService.confirm_log ─► NutritionCoachOrchestrator.prepare(user_id, food_log_id)
│
└─ asyncio.gather — each agent reads the DB independently:
   │
   ├─ A. NutritionMemoryService.build_snapshot(user_id)        [no AI]
   │       User (goals/weight/dietary/conditions) + FoodRepository 7/30/90d rollups
   │       → persists user_nutrition_summary row
   │
   ├─ B. NutritionInsightEngine.evaluate(snapshot)             [no AI — deterministic rules]
   │       e.g. protein_deficit = avg_protein < protein_target   (from goals/stats)
   │       → NutritionInsight {protein_deficit, fibre_deficit, excess_sodium, weight_loss_stalled, …}
   │       → persists nutrition_insights row
   │
   └─ C. RetrievalAgent.retrieve(user_id)                      [Gemini embed, audited]
           hybrid retrieval pipeline (semantic + structured) → top-10 recipes
           → persists candidate set   ► see "Retrieval pipeline" below
```

Stage 1 produces and stores the inputs the coach needs; it does **not** call the
recommendation model.

### Stage 2 — on chat request (the coaching call)

```
User asks in Chat ─► POST /nutrition-coach/chat
│
├─ load latest persisted Stage-1 outputs: snapshot + insights + top-10 recipes
│
├─ RecommendationAgent.recommend(snapshot, insights, top10, user_question)  [coaching call, audited]
│       combines them → reply WITH per-recipe reasoning
│       (never similarity-only; the "why" is grounded in the user's insights + macros)
│
├─ Governance gate (inside audit.complete_inference)
│       risk HIGH / valid_flag 0.5 → HumanReviewService queue
│
└─ Response ─► rendered in the frontend Chat tab
```

**Concurrency vs. dependency — the resolution.** Because Stage-1 units run
*independently and in parallel*, the **Retrieval Agent cannot consume the Insight
Engine's output** (they execute at the same time). So the Retrieval **query builder
is driven by the user's statistics** (goal, dietary restrictions, conditions,
calorie/macro targets, the just-logged meal) — **not** by NutritionInsight. The
insights instead enter at **Stage 2**, where the Recommendation Agent uses them to
choose among the top-10 candidates and write the personalised explanation. This
keeps the fan-out genuinely parallel while preserving insight-grounded
recommendations.

Each agent is an independently testable class receiving dependencies in `__init__`.
The orchestrator owns the stage boundaries (the Stage-1 `gather` and the Stage-2
handoff); the agents know nothing about each other.

## Retrieval pipeline (Stage 1C — hybrid retrieval)

A funnel: broad semantic recall, then progressively tighter structured filters.

```
RetrievalAgent.retrieve(user_id)
│
├─ 1. Retrieval Query Builder
│       builds a natural-language query string from USER STATISTICS only
│       (goal, dietary restrictions, conditions, calorie/macro targets, just-logged meal)
│       — independent of the Insight Engine (runs concurrently with it)
│
├─ 2. Gemini embedding
│       embed the query via the configured Gemini embedding model
│       (registered in the governance model registry → embedding call is audited)
│
├─ 3. pgvector semantic search           ──►  TOP 50   (ivfflat/hnsw cosine, recall-oriented)
│
├─ 4. Metadata filtering                 ──►  TOP 30
│       hard constraints from user stats, applied as SQL WHERE on recipes:
│         • dietary restrictions  (diet_tags must satisfy / exclude)
│         • medical conditions    (e.g. low-sodium for hypertension)
│         • calorie limits        (per-meal calorie ceiling from remaining budget)
│
├─ 5. Nutrition scoring                  ──►  TOP 10
│       rank survivors by fit to the user's needs, e.g.:
│         + protein density toward target   + fibre        − excess sodium/sugar
│         + closeness to remaining calorie/macro budget
│
└─ return top-10 ranked candidates ─► Recommendation Agent (Stage 2)
                                       └─ personalised explanation, surfaced in Chat
```

Stage 3→4→5 widths (50 → 30 → 10) are the defaults; expose them as constants so
they can be tuned. Steps 3–5 are pure SQL/scoring (cheap, deterministic, testable);
only step 2 is an AI call.

## Nutrition Insight Engine (Stage 1B — deterministic, no AI)

A rule-based engine, architecturally a twin of the existing
`app/ai_governance/services/risk_engine/` (`BaseRule` strategies + an engine that
runs them all). Each rule is a pure function of the memory snapshot → one boolean/
scalar insight. No model, no prompt, no audit row — fully reproducible.

```
NutritionInsightEngine.evaluate(snapshot) -> NutritionInsight
│   inputs: targets (from goal/weight/lifestyle) + averages (7/30/90d rollups)
│
├─ protein_deficit       = avg_protein_g   < protein_target_g
├─ fibre_deficit         = avg_fibre_g      < fibre_target_g
├─ excess_sodium         = avg_sodium_mg    > sodium_ceiling_mg
├─ calorie_surplus       = avg_calories     > calorie_target * 1.10
├─ weight_loss_stalled   = goal == "lose"  and weight_trend_kg ≈ 0 over window
└─ low_meal_consistency  = logging_frequency < threshold
        → NutritionInsight (typed) + adherence %s, persisted to nutrition_insights
```

Targets come from the same calculation the frontend already uses
(`computeNutritionTargets`); porting that logic to the backend keeps app and coach
in agreement. Each rule is independently unit-testable with fixed inputs — no
mocking an LLM.

## New database work (Alembic — async, matches existing env)

1. **pgvector enable** — `CREATE EXTENSION IF NOT EXISTS vector`; add `pgvector` to `pyproject.toml`; add `EMBEDDING_MODEL` / `EMBEDDING_DIM` to `config.py`.
2. **`recipes`** — Module 1 fields + `embedding_vector vector(EMBEDDING_DIM)`; HNSW/ivfflat index on the vector; B-tree indexes on `diet_tags`, `calories`, `protein_g`, `fibre_g` for metadata filtering.
3. **`user_nutrition_summary`** — Module 2 snapshot, one row per orchestration run (versioned/timestamped, retrievable).
4. **`nutrition_insights`** — deterministic engine output; typed columns (`protein_deficit`, `fibre_deficit`, `excess_sodium`, `weight_loss_stalled`, …) + adherence %s, keyed by `user_id` + the `user_nutrition_summary` snapshot it derives from. **No inference-log FK** — it isn't an AI inference. (The chat-time recommendation that consumes it is what gets an audit row.)

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
3. `NutritionInsightEngine` (rule-based, mirrors `RiskAssessmentEngine`) + `nutrition_insights` table — deterministic, **no audit envelope**; port `computeNutritionTargets` to the backend
4. `RetrievalAgent` funnel — query builder → embed → pgvector top-50 → metadata filter top-30 → nutrition scoring top-10 (steps 3–5 unit-testable without AI)
5. `RecommendationAgent` (reasoning-mandatory; consumes snapshot + insights + top-10)
6. `NutritionCoachOrchestrator` — `prepare()` = Stage-1 `asyncio.gather` fan-out (Memory ‖ Analysis ‖ Retrieval); Stage-2 recommendation path consumed by the chat route; per-stage tests
7. Stage-1 trigger wiring in `FoodService.confirm_log` → `orchestrator.prepare(...)`
8. Stage-2 wiring in the chat route → `RecommendationAgent` over the persisted prepared set
9. Coaching `BaseRiskRule` subclasses (medical / out-of-scope)
10. Coach routes + factory registration
11. Frontend coach explanation + recipe cards surfaced in the Chat tab

## Open decisions remaining

- Embedding dimension / exact Gemini embedding model id to register in the governance model registry.
- Recipe ingestion cadence (one-off seed vs. re-runnable upsert) — spec requires "future recipe ingestion," so make the script idempotent.
- Whether `/analyze` re-runs on every request or caches the latest session per user (Redis cache layer already exists in `app/services/cache.py`).
- Retrieval funnel widths (50 → 30 → 10) and the nutrition-scoring weights — start with the defaults above, tune against real recipe data.
- **Stage-1 freshness**: Stage 1 runs per meal log, so the persisted snapshot/insights/recipes reflect the *latest* log when the user later opens Chat. Decide whether Stage 2 also refreshes if the data is stale (e.g. user chats days after their last log) — cheapest is to re-run Stage 1 lazily if no recent prepared set exists.
