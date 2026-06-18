# Snacc Buddy — AI Nutrition Coaching Platform
## Product Roadmap v1.0
**Document Status:** Draft for Review  
**Audience:** Head of Product · CTO · Engineering Manager · AI Governance Lead  
**Date:** 2026-06-18  
**Author:** Product & Engineering

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [User Personas](#3-user-personas)
4. [User Journeys](#4-user-journeys)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Current State Assessment](#7-current-state-assessment)
8. [Product Architecture](#8-product-architecture)
9. [Data Architecture](#9-data-architecture)
10. [API Architecture](#10-api-architecture)
11. [AI Architecture](#11-ai-architecture)
12. [RAG Architecture](#12-rag-architecture)
13. [Governance Architecture](#13-governance-architecture)
14. [Database Schema Design](#14-database-schema-design)
15. [Module Breakdown](#15-module-breakdown)
16. [Feature Prioritization](#16-feature-prioritization)
17. [MVP Definition (Current State)](#17-mvp-definition-current-state)
18. [Phase 1 — Foundation & Completeness](#18-phase-1--foundation--completeness)
19. [Phase 2 — Intelligence Layer (RAG)](#19-phase-2--intelligence-layer-rag)
20. [Phase 3 — AI Coaching & Planning](#20-phase-3--ai-coaching--planning)
21. [Phase 4 — Platform & Scale](#21-phase-4--platform--scale)
22. [Engineering Milestones](#22-engineering-milestones)
23. [Technical Risks](#23-technical-risks)
24. [Product Risks](#24-product-risks)
25. [Success Metrics](#25-success-metrics)
26. [Analytics Requirements](#26-analytics-requirements)
27. [Future Expansion Opportunities](#27-future-expansion-opportunities)

---

## 1. Executive Summary

Snacc Buddy is evolving from a calorie-tracking utility into a full AI Nutrition Coaching Platform. The current MVP delivers photo-to-nutrition analysis via Google Gemini, a food diary, basic analytics, and a production-grade AI governance layer. The next three phases build the RAG-powered intelligence stack that transforms raw data into personalized coaching, meal planning, recipe recommendations, and actionable nutrition insights — all governed by a transparent, auditable AI system.

**Strategic bets:**
1. RAG over user-specific data gives personalization that generic LLMs cannot match.
2. AI governance differentiates the platform in a health context where trust and auditability are prerequisites for enterprise and clinical adjacency.
3. Multimodal (photo → analysis → coaching) creates a flywheel: more logs → better context → better coaching → higher engagement → more logs.

---

## 2. Product Vision

> **Snacc Buddy helps every person understand, improve, and sustain their nutritional health through an AI coach that knows their goals, learns from their behavior, and explains its reasoning.**

### Mission Statement
Make evidence-based nutrition guidance accessible, personalized, and trustworthy — not through prescriptive diet plans, but through continuous, context-aware coaching grounded in each user's own data.

### Strategic Pillars
| Pillar | Description |
|--------|-------------|
| **Understand** | Deep user profiling: goals, lifestyle, restrictions, preferences, medical context |
| **Track** | Frictionless multimodal food and weight logging |
| **Analyze** | Macro and micro-nutrient trends, goal adherence, behavioral patterns |
| **Coach** | RAG-powered AI explanations, recommendations, and nudges |
| **Plan** | AI-generated meal plans, recipes, and shopping lists |
| **Govern** | Full AI audit trail, human review queue, confidence scoring |

---

## 3. User Personas

### Persona 1 — The Consistent Tracker (Primary)
**Name:** Maya, 28  
**Profile:** Office worker, moderately active, wants to lose 8 kg before a holiday  
**Goals:** Daily calorie awareness, macro balance, habit formation  
**Pain points:** Loses momentum after 2 weeks, doesn't understand why weight stalls  
**Key jobs-to-be-done:**
- Quickly log meals without friction
- Know if she's on track without doing mental math
- Understand *why* progress stalled last week

### Persona 2 — The Health-Conscious Builder (Secondary)
**Name:** James, 34  
**Profile:** Regular gym-goer, wants to increase muscle mass while minimizing fat gain  
**Goals:** Hit protein targets, track training-aligned nutrition, optimize meal timing  
**Pain points:** Protein calculations are tedious, hard to plan high-protein meals on a budget  
**Key jobs-to-be-done:**
- Plan the week's meals around protein targets
- Get recipe recommendations that fit macros and preferences
- Understand whether his intake supports his training load

### Persona 3 — The Medically Cautious User (Tertiary)
**Name:** Sandra, 52  
**Profile:** Pre-diabetic, working with a dietitian, wants to manage carbohydrate intake  
**Goals:** Stay under carb limits, avoid trigger foods, track glycaemic load trends  
**Pain points:** Existing apps don't flag high-sugar foods proactively, can't show logs to dietitian  
**Key jobs-to-be-done:**
- Track carbs and sugar with confidence
- Export logs for professional review
- Receive AI guidance that defers to her healthcare team

### Persona 4 — The Curious Beginner (Acquisition)
**Name:** Daniel, 22  
**Profile:** First time tracking, motivated by general wellness rather than a specific target  
**Goals:** Build awareness of eating patterns, understand nutrition basics  
**Pain points:** Intimidated by macros, finds tracking apps overwhelming  
**Key jobs-to-be-done:**
- Get started in under 5 minutes
- Understand what their numbers mean in plain language
- Receive encouragement, not judgement

---

## 4. User Journeys

### Journey 1 — First-Time Onboarding (Day 0)

```
App open → Intro screen → Mindset/pace selection → Name → Age →
Gender → Height → Current weight → Goal weight → Goal type →
Lifestyle activity level → Dietary restrictions → Medical conditions →
Preferred cuisines (Phase 2) → Food preferences (Phase 2) →
Account creation (email + password) → Plan calculation screen →
Final welcome (targets displayed: calories, protein, carbs, fat) →
Home dashboard
```

**Outcome:** User has a complete profile; platform has calculated TDEE-based daily targets; user feels the platform "gets them."

### Journey 2 — Daily Logging (Recurring)

```
Open app → Home (today's summary visible) → Tap "Log meal" →
Choose: camera / gallery / manual → Capture image →
AI analysis in progress (loading state) → Review AI result →
Confirm or chat-refine → Add mood + notes → Save →
Updated daily totals shown → "You're on track" / coaching nudge
```

### Journey 3 — Progress Review (Weekly)

```
Open analytics tab → View weekly calorie chart → View macro trends →
View weight progression (Phase 1) → See streak count →
AI-generated weekly insight ("Your protein was consistently low on weekdays — here's why that might be stalling your progress") →
Tap through to coaching recommendations
```

### Journey 4 — Meal Planning (Phase 3)

```
Open "Plan" tab → Select week → View suggested meal plan →
Customize: swap a meal → Regenerate plan or accept →
View shopping list → Check off items in store →
Log planned meals from plan (pre-fills diary)
```

### Journey 5 — AI Coaching Conversation (Phase 3)

```
Open "Coach" tab → Chat interface → User types: "Why did I gain weight this week?" →
AI retrieves food logs, weight history, nutrition guidelines →
RAG context assembled → Response explains with specific data points →
Links to relevant resources / suggests 1-2 actionable changes →
User rates response (thumbs up/down) → Feedback stored for governance
```

---

## 5. Functional Requirements

### FR-AUTH — Authentication & Accounts
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Email + password registration with verification | P0 (Done) |
| FR-AUTH-02 | JWT-based session management | P0 (Done) |
| FR-AUTH-03 | Password reset via email | P0 (Done) |
| FR-AUTH-04 | OAuth (Google, Apple) login | P2 |
| FR-AUTH-05 | Account deletion with data purge | P1 |

### FR-ONBOARD — Onboarding
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ONBOARD-01 | Collect: name, age, gender, height, current weight, goal weight | P0 (Done) |
| FR-ONBOARD-02 | Collect: goal type, lifestyle activity level | P0 (Done) |
| FR-ONBOARD-03 | Collect: dietary restrictions (boolean flags + type) | P0 (Done) |
| FR-ONBOARD-04 | Collect: medical conditions (boolean + free text) | P0 (Done) |
| FR-ONBOARD-05 | Collect: preferred cuisines and food preferences | P1 |
| FR-ONBOARD-06 | Calculate and display: calorie target, macro targets, weight-loss timeline | P1 |
| FR-ONBOARD-07 | Onboarding skip and resume (partial completion) | P1 |
| FR-ONBOARD-08 | Re-onboarding trigger when goals change | P2 |

### FR-LOG — Food Logging
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-LOG-01 | Upload meal photo for AI analysis | P0 (Done) |
| FR-LOG-02 | AI returns: name, ingredients, macros, calories, confidence | P0 (Done) |
| FR-LOG-03 | Chat-based refinement of AI analysis | P0 (Done) |
| FR-LOG-04 | View, edit, delete food log entries | P0 (Done) |
| FR-LOG-05 | Mood tagging per meal | P0 (Done) |
| FR-LOG-06 | Free-text notes per meal | P0 (Done) |
| FR-LOG-07 | Meal type classification (breakfast/lunch/dinner/snack/etc.) | P0 (Done) |
| FR-LOG-08 | Manual food entry (text-based, no photo) | P1 |
| FR-LOG-09 | Barcode scanning for packaged foods | P2 |
| FR-LOG-10 | Water intake tracking | P2 |
| FR-LOG-11 | Quick-add from recent meals | P2 |

### FR-WEIGHT — Weight Tracking
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WEIGHT-01 | Log daily weight | P1 |
| FR-WEIGHT-02 | View weight history chart | P1 |
| FR-WEIGHT-03 | Track progress toward goal weight | P1 |
| FR-WEIGHT-04 | Calculate projected goal date based on trend | P1 |
| FR-WEIGHT-05 | Body measurements (waist, hips) — optional | P3 |

### FR-ANALYTICS — Analytics & Insights
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ANALYTICS-01 | Daily calorie summary vs. target | P0 (Done) |
| FR-ANALYTICS-02 | Weekly calorie bar chart | P0 (Done) |
| FR-ANALYTICS-03 | Daily macro breakdown (protein/carbs/fat) | P0 (Done) |
| FR-ANALYTICS-04 | Streak counter | P0 (Done) |
| FR-ANALYTICS-05 | Macro trend charts (7-day, 30-day) | P1 |
| FR-ANALYTICS-06 | Calorie vs. weight correlation chart | P1 |
| FR-ANALYTICS-07 | Goal adherence score (% days on target) | P1 |
| FR-ANALYTICS-08 | Cuisine and meal-type distribution analysis | P2 |
| FR-ANALYTICS-09 | Mood-nutrition correlation analysis | P2 |
| FR-ANALYTICS-10 | Export logs as PDF / CSV | P2 |

### FR-RAG — RAG & Knowledge
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RAG-01 | Recipe knowledge base with vector embeddings | P2 |
| FR-RAG-02 | Nutrition guidelines knowledge base | P2 |
| FR-RAG-03 | User profile retrieval for AI context assembly | P2 |
| FR-RAG-04 | Food log retrieval (semantic + recency-weighted) | P2 |
| FR-RAG-05 | Weight history retrieval | P2 |
| FR-RAG-06 | Recipe search by macro fit, dietary restriction, cuisine | P2 |

### FR-COACH — AI Coaching
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-COACH-01 | Conversational AI coach with RAG context | P3 |
| FR-COACH-02 | Weekly AI-generated progress summary | P3 |
| FR-COACH-03 | Proactive coaching nudges (missed targets, streaks) | P3 |
| FR-COACH-04 | Coach response feedback (thumbs up/down) | P3 |
| FR-COACH-05 | Coach cites sources from knowledge base | P3 |
| FR-COACH-06 | Medical disclaimer on every coaching response | P3 |

### FR-PLAN — Meal Planning
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PLAN-01 | Generate 1-day meal plan based on targets + preferences | P3 |
| FR-PLAN-02 | Generate 7-day meal plan | P3 |
| FR-PLAN-03 | Swap individual meals within a plan | P3 |
| FR-PLAN-04 | Generate shopping list from meal plan | P3 |
| FR-PLAN-05 | Log meals directly from meal plan | P3 |

### FR-GOV — AI Governance
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-GOV-01 | Model registry with version tracking | P0 (Done) |
| FR-GOV-02 | Prompt registry with versioning and SHA-256 hashing | P0 (Done) |
| FR-GOV-03 | Inference audit log (request, response, latency, confidence) | P0 (Done) |
| FR-GOV-04 | Risk classification (approve/review/reject) | P0 (Done) |
| FR-GOV-05 | Human review queue | P0 (Done) |
| FR-GOV-06 | Governance dashboard (aggregate metrics) | P0 (Done) |
| FR-GOV-07 | Prompt approval workflow (draft → approved → deprecated) | P1 |
| FR-GOV-08 | Confidence drift detection alerts | P2 |
| FR-GOV-09 | A/B prompt experiment framework | P3 |
| FR-GOV-10 | User feedback loop integration into governance metrics | P3 |

---

## 6. Non-Functional Requirements

### Performance
| NFR | Target |
|-----|--------|
| AI analysis response time (p95) | < 5 seconds |
| API response time (non-AI, p95) | < 200 ms |
| Weekly chart query | < 100 ms (cached) |
| RAG retrieval latency | < 500 ms |
| App cold start time | < 3 seconds |

### Reliability
| NFR | Target |
|-----|--------|
| API availability | 99.5% monthly |
| AI service availability (Gemini dependency) | graceful degradation with retry |
| Data loss tolerance | Zero (PostgreSQL WAL + daily backup) |
| Recovery Point Objective | 24 hours |
| Recovery Time Objective | 4 hours |

### Security
| NFR | Requirement |
|-----|-------------|
| Authentication | JWT with refresh tokens; bcrypt password hashing |
| Data isolation | Row-level user_id enforcement on all queries |
| Transport | TLS 1.2+ enforced |
| Image storage | Signed URL access via Cloudflare R2; no public object URLs |
| Secrets management | Environment variables; no secrets in source code |
| Input validation | All user input validated at API boundary |
| Rate limiting | 10 AI requests/hour/user (configurable via Redis) |
| OWASP Top 10 | Addressed in security review prior to each phase launch |

### Scalability
| NFR | Requirement |
|-----|-------------|
| Concurrent users (Phase 1) | 500 |
| Concurrent users (Phase 3) | 5,000 |
| Image throughput | 1,000 uploads/hour |
| Vector index | Supports 1M recipe embeddings with sub-100ms ANN search |

### Compliance & Privacy
| NFR | Requirement |
|-----|-------------|
| Data residency | Configurable (default: user's region) |
| GDPR right to erasure | Account deletion purges all personal data within 30 days |
| Health data sensitivity | Medical conditions stored encrypted at rest |
| AI governance | All AI decisions auditable for 24 months |
| Medical disclaimer | Mandatory on all coaching outputs |

### Accessibility
- WCAG 2.1 AA compliance on web
- Screen reader support on React Native components
- Minimum 4.5:1 color contrast ratio

---

## 7. Current State Assessment

### What Exists (MVP)

| Area | Status | Notes |
|------|--------|-------|
| Auth (JWT, email verify, password reset) | ✅ Production | fastapi-users |
| Onboarding flow (12 screens) | ✅ Production | age, gender, height, weight, goal, lifestyle, dietary, medical |
| Photo upload + Gemini AI analysis | ✅ Production | gemini-2.0-flash |
| Chat-based refinement | ✅ Production | `/api/chat` |
| Food diary (CRUD) | ✅ Production | mood, notes, meal types |
| Daily calorie/macro analytics | ✅ Production | Mifflin-St Jeor TDEE |
| Weekly bar chart + streak | ✅ Production | |
| AI governance layer | ✅ Production | model registry, prompt registry, inference log, risk engine, human review |
| Image storage (Cloudflare R2) | ✅ Production | |
| Rate limiting (Redis) | ✅ Production | |
| Docker Compose dev environment | ✅ Production | |

### What is Missing (Gap Analysis)

| Area | Gap |
|------|-----|
| User profile — cuisine/food preferences | Not collected in onboarding |
| Macro targets displayed to user | Calculated but not surfaced prominently |
| Weight tracking | No dedicated weight log model or UI |
| Manual food entry | Photo only; no text-based logging |
| RAG infrastructure | No vector DB, no knowledge bases |
| Recipe knowledge base | Not seeded or indexed |
| Nutrition knowledge base | Not built |
| Meal planning | Not started |
| Shopping list generation | Not started |
| AI coaching (RAG-backed) | Basic chat exists; no RAG context assembly |
| Macro trend charts (30-day) | Only 7-day calorie chart |
| Calorie/weight correlation | Not built |
| Log export (PDF/CSV) | Not built |
| Prompt approval workflow | Draft/approved state exists in model; UI workflow incomplete |

---

## 8. Product Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Expo / React Native (iOS · Android · Web)                   │   │
│  │  Screens: Onboarding · Diary · Analytics · Coach · Plan      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTPS / JWT
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  FastAPI — async Python 3.10+                                │   │
│  │  Routers: auth · food · analyze · chat · analytics ·         │   │
│  │           weight · plan · recipes · coaching · governance     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────┐
│  SERVICE LAYER  │  │  AI LAYER       │  │  GOVERNANCE LAYER     │
│                 │  │                 │  │                       │
│  UserService    │  │  GeminiClient   │  │  ModelRegistry        │
│  FoodService    │  │  RAGEngine      │  │  PromptRegistry       │
│  WeightService  │  │  ContextBuilder │  │  InferenceAuditLog    │
│  PlanService    │  │  CoachService   │  │  RiskEngine           │
│  RecipeService  │  │  EmbeddingStore │  │  HumanReviewQueue     │
│  AnalyticsService│  │                │  │  DriftDetector        │
└─────────────────┘  └─────────────────┘  └───────────────────────┘
          │                    │
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │ PostgreSQL 16│  │   Redis 7    │  │  Cloudflare R2 (Images)   │ │
│  │ (Primary DB) │  │ (Cache/Rate) │  │                           │ │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘ │
│  ┌──────────────────────────────┐                                   │
│  │  pgvector (Vector Store)     │  ← Phase 2 addition              │
│  │  Recipes · Nutrition docs    │                                   │
│  └──────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
          │
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                                │
│  Google Gemini API  ·  Cloudflare R2  ·  SMTP (email)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Data Architecture

### Data Domains

| Domain | Description | Source of Truth |
|--------|-------------|-----------------|
| **Identity** | User accounts, credentials, auth tokens | `users` table |
| **Profile** | Demographics, goals, preferences, restrictions | `users` table (extended) |
| **Food Logs** | Meal entries, AI analysis results, images | `food_logs` table |
| **Weight Logs** | Daily weight measurements | `weight_logs` table (Phase 1) |
| **Recipes** | Recipe dataset with nutrition metadata | `recipes` + `recipe_ingredients` (Phase 2) |
| **Embeddings** | Semantic vectors for RAG retrieval | `recipe_embeddings`, `nutrition_embeddings` (Phase 2) |
| **Nutrition Knowledge** | Guidelines, articles, references | `nutrition_documents` (Phase 2) |
| **Meal Plans** | Generated plans per user | `meal_plans`, `meal_plan_items` (Phase 3) |
| **Shopping Lists** | Generated from meal plans | `shopping_lists`, `shopping_list_items` (Phase 3) |
| **AI Governance** | Models, prompts, inference logs, reviews, risk | Governance tables (Done) |
| **Analytics Cache** | Pre-aggregated analytics | Redis (existing) |

### Data Flow — Food Log

```
Photo Upload
    → R2 Storage (image_url stored)
    → Gemini Vision API
    → Structured JSON response
    → InferenceAuditLog (governance)
    → RiskEngine (confidence scoring)
    → FoodLog record created
    → Analytics cache invalidated
    → (Phase 2) Embedding generated for RAG retrieval
```

### Data Retention
| Data Type | Retention |
|-----------|-----------|
| Food logs | Indefinite (user-owned) |
| Weight logs | Indefinite (user-owned) |
| Images (R2) | 2 years, then archive |
| Inference audit logs | 24 months (governance requirement) |
| Redis cache | Per-key TTL (analytics: 5 min, dedup lock: 60 sec) |
| Email verification tokens | 24 hours |

---

## 10. API Architecture

### API Design Principles
- RESTful resource-oriented design
- JWT bearer token on all authenticated endpoints
- `user_id` enforced at repository layer — never trusts caller-supplied user_id
- Consistent envelope: `{ data, meta, errors }`
- Versioning: `/api/v1/` prefix (future-proofed, not yet required)
- OpenAPI spec auto-generated by FastAPI

### Route Map (Current + Planned)

```
/api
  /auth
    POST  /register                  ✅ Done
    POST  /login                     ✅ Done
    POST  /verify-email              ✅ Done
    POST  /reset-password            ✅ Done
    DELETE /me                       P1

  /users
    GET   /me                        ✅ Done
    PATCH /me                        ✅ Done

  /food
    POST  /analyze                   ✅ Done (photo → AI)
    GET   /logs                      ✅ Done
    POST  /logs                      ✅ Done
    GET   /logs/{id}                 ✅ Done
    PATCH /logs/{id}                 ✅ Done
    DELETE /logs/{id}                ✅ Done
    POST  /chat                      ✅ Done (chat refinement)
    POST  /logs/manual               P1 (text-based entry)

  /weight
    POST  /logs                      P1
    GET   /logs                      P1
    GET   /logs/trend                P1

  /analytics
    GET   /daily                     ✅ Done
    GET   /weekly                    ✅ Done
    GET   /macros/trend              P1
    GET   /weight/correlation        P1
    GET   /goal-adherence            P1
    GET   /export                    P2

  /recipes                           P2
    GET   /                          (search + filter)
    GET   /{id}
    GET   /recommend                 (RAG-powered)

  /plans                             P3
    POST  /generate                  (AI meal plan)
    GET   /
    GET   /{id}
    PATCH /{id}/swap-meal
    GET   /{id}/shopping-list

  /coaching                          P3
    POST  /chat                      (RAG-backed conversation)
    GET   /summary/weekly            (AI weekly summary)

  /governance
    (existing governance routes)     ✅ Done
    POST  /prompts/{id}/approve      P1
    POST  /prompts/{id}/deprecate    P1
    GET   /drift                     P2
```

---

## 11. AI Architecture

### Current AI Stack
| Component | Technology |
|-----------|------------|
| Vision model | Google Gemini `gemini-2.0-flash` |
| Prompt management | Custom PromptRegistry (versioned, SHA-256 hashed) |
| Response caching | Redis (SHA-256 image deduplication) |
| Output schema | Structured JSON extraction via Gemini |
| Governance | InferenceAuditLog + RiskEngine (confidence-based) |

### Target AI Architecture (Phase 2+)

```
┌────────────────────────────────────────────────────────────┐
│                    PROMPT ORCHESTRATION                     │
│                                                            │
│  PromptRegistry → PromptBuilder → ContextAssembler        │
│       ↓                ↓               ↓                  │
│  Versioned template  Variables    RAG Retrieval           │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│                    RAG PIPELINE                            │
│                                                            │
│  Query → Embedding → ANN Search → Rerank → Context        │
│                                                            │
│  Sources: UserProfile · FoodLogs · WeightHistory ·        │
│           RecipeKB · NutritionKB                          │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│                    GEMINI AI CALL                          │
│                                                            │
│  Model: gemini-2.0-flash (vision + text)                  │
│  Input: system_prompt + rag_context + user_query          │
│  Output: structured JSON (confidence scored)              │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│                    GOVERNANCE PIPELINE                     │
│                                                            │
│  InferenceAuditLog → RiskEngine → HumanReviewQueue        │
│  (confidence, latency, tokens, risk_score)                │
└────────────────────────────────────────────────────────────┘
```

### AI Use Cases by Phase

| Phase | Use Case | Model | RAG Sources |
|-------|----------|-------|-------------|
| MVP | Photo → nutrition analysis | Gemini Vision | None |
| MVP | Chat refinement | Gemini | None |
| Phase 2 | Recipe recommendation | Gemini | RecipeKB, UserProfile |
| Phase 3 | Meal plan generation | Gemini | RecipeKB, UserProfile, FoodLogs |
| Phase 3 | AI nutrition coaching | Gemini | All sources |
| Phase 3 | Weekly progress summary | Gemini | FoodLogs, WeightHistory, NutritionKB |

### Confidence Scoring Model
```
risk_score = 0.0 (approve) if confidence >= 0.85
risk_score = 0.5 (review)  if 0.60 <= confidence < 0.85
risk_score = 1.0 (reject)  if confidence < 0.60

Thresholds configurable per use case in PromptRegistry.
```

---

## 12. RAG Architecture

### Design Principles
1. **User-specific context first** — Personal data (food logs, profile) takes priority over general knowledge
2. **Recency weighting** — Recent food logs weighted higher than older ones
3. **Relevance gating** — Only include retrieved chunks above similarity threshold (0.75)
4. **Context budget** — Hard cap on tokens passed to Gemini (preserve output space)
5. **Source transparency** — Every coaching response cites its sources

### Vector Store Strategy
- **Technology:** pgvector (PostgreSQL extension) — avoids operational complexity of a separate vector DB
- **Embedding model:** Gemini `embedding-001` (768 dimensions, consistent with text-embedding-004)
- **Index type:** HNSW (Hierarchical Navigable Small World) for approximate nearest neighbor
- **Similarity metric:** Cosine similarity

### Knowledge Sources & Retrieval Design

#### Source 1: User Profile (Structured Retrieval)
```
Not embedded — retrieved directly from PostgreSQL.
Includes: goals, targets, restrictions, medical conditions, preferences.
Always included in context (low token cost, high relevance).
```

#### Source 2: Food Logs (Hybrid Retrieval)
```
Strategy: Time-windowed SQL query + semantic similarity
- Last 7 days: always included (summary: total calories, macro averages)
- Last 30 days: trend statistics
- Semantic search: "high protein meals user has eaten" → embedding match
Embedding: meal_name + ingredients + cuisine_type (concatenated)
```

#### Source 3: Weight History (Structured Retrieval)
```
Not embedded — time-series SQL query.
Returns: last 30 data points, trend direction, rate of change, projected goal date.
```

#### Source 4: Recipe Knowledge Base
```
Dataset: ~50,000 recipes (public domain, open licensed)
Embedding: recipe_name + description + key_ingredients + cuisine_type
Filters applied pre-retrieval: dietary_restrictions, calorie_range, macro_fit
Top-K: 5 recipes returned per query
```

#### Source 5: Nutrition Knowledge Base
```
Documents: Evidence-based nutrition guidelines (WHO, NHS, peer-reviewed)
Embedding: chunk-level (512 tokens, 50 token overlap)
Query: coaching question → embedding → ANN → top 3 chunks
Medical disclaimer prepended to all coaching outputs.
```

### RAG Pipeline (Detailed)

```python
# Pseudocode — actual implementation in Phase 2

async def assemble_rag_context(user_id, query, use_case):
    profile = await get_user_profile(user_id)          # Always included
    logs_summary = await get_food_log_summary(          # Last 7d + semantic
        user_id, days=7, semantic_query=query
    )
    weight_trend = await get_weight_trend(user_id)      # Last 30 data points
    
    if use_case in ["recipe_recommendation", "meal_planning"]:
        recipes = await search_recipes(
            query=query,
            calorie_budget=profile.daily_calories - logs_summary.today_calories,
            dietary_restrictions=profile.dietary_restrictions,
            top_k=5
        )
    
    if use_case == "coaching":
        nutrition_docs = await search_nutrition_kb(query, top_k=3)
    
    return build_context_prompt(
        profile=profile,
        logs=logs_summary,
        weight=weight_trend,
        recipes=recipes,
        docs=nutrition_docs,
        token_budget=4000
    )
```

### Context Budget Allocation
| Context Section | Token Allocation |
|-----------------|-----------------|
| System instructions + persona | 500 |
| User profile | 300 |
| Food log summary (7-day) | 800 |
| Weight trend | 200 |
| Retrieved recipes (5 × 150) | 750 |
| Retrieved nutrition docs (3 × 300) | 900 |
| User query | 200 |
| Output space | 1,500 |
| **Total** | **5,150** |

---

## 13. Governance Architecture

### Current Implementation (Production)

| Component | Implementation | Status |
|-----------|---------------|--------|
| Model Registry | `ai_models` table · CRUD API | ✅ Done |
| Prompt Registry | `ai_prompt_versions` · SHA-256 · version history | ✅ Done |
| Inference Audit Log | `ai_inference_logs` · request/response/latency/confidence | ✅ Done |
| Risk Assessment | `ai_risk_assessments` · approve/review/reject | ✅ Done |
| Human Review Queue | `ai_human_reviews` · reviewer assignment · notes | ✅ Done |
| Governance Dashboard | Aggregate metrics API | ✅ Done |

### Phase 1 Additions

**Prompt Approval Workflow:**
```
draft → submitted_for_review → approved → deprecated
                  ↓
             rejected (with reason)
```
- Only `approved` prompts can be used in production inference
- Deprecation requires a nominated replacement prompt
- All state transitions logged with reviewer identity and timestamp

### Phase 2 Additions

**Confidence Drift Detection:**
- Rolling 7-day average confidence score per use case
- Alert if average drops > 15% below 30-day baseline
- Alert if rejection rate exceeds 5% of daily inferences
- Alerts surface in governance dashboard and optionally via email

### Phase 3 Additions

**A/B Prompt Experimentation:**
- Register experiment: control prompt vs. challenger prompt
- Traffic split: configurable percentage (default 10% challenger)
- Metrics: confidence score, user feedback rating, task completion
- Auto-promote challenger if statistically significant improvement (p < 0.05)
- Full audit trail of experiment decisions

**User Feedback Loop:**
- Coaching response rating (thumbs up / thumbs down + optional text)
- Rating stored against inference log
- Aggregate feedback score surfaced in governance dashboard
- Low-rated responses auto-queued for human review

### Risk Classification Reference
| Score | Classification | Action |
|-------|---------------|--------|
| 0.0 | Approve | Served directly to user |
| 0.5 | Review | Served with low-confidence indicator; queued for async review |
| 1.0 | Reject | Not served; user shown "analysis unavailable" message; queued for review |

---

## 14. Database Schema Design

### Existing Tables
```sql
users                   -- auth + profile (expanded below)
food_logs               -- meal entries with full nutrition
ai_models               -- model registry
ai_prompt_versions      -- prompt registry
ai_inference_logs       -- audit trail
ai_risk_assessments     -- risk scoring
ai_human_reviews        -- review queue
```

### Phase 1: New Tables

```sql
-- Weight tracking
CREATE TABLE weight_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg   FLOAT NOT NULL,
    notes       TEXT,
    logged_at   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, logged_at)
);
CREATE INDEX idx_weight_logs_user_date ON weight_logs (user_id, logged_at DESC);
```

```sql
-- User profile extensions (add columns to users table)
ALTER TABLE users
    ADD COLUMN preferred_cuisines      TEXT[],
    ADD COLUMN food_preferences        TEXT[],
    ADD COLUMN disliked_foods          TEXT[],
    ADD COLUMN daily_calorie_target    INTEGER,
    ADD COLUMN daily_protein_target_g  FLOAT,
    ADD COLUMN daily_carbs_target_g    FLOAT,
    ADD COLUMN daily_fat_target_g      FLOAT,
    ADD COLUMN onboarding_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN account_deleted_at      TIMESTAMPTZ;
```

### Phase 2: New Tables

```sql
-- Recipe knowledge base
CREATE TABLE recipes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    cuisine_type    TEXT,
    meal_type       TEXT[],          -- breakfast, lunch, dinner, snack
    prep_time_min   INTEGER,
    cook_time_min   INTEGER,
    servings        INTEGER,
    calories_per_serving   INTEGER NOT NULL,
    protein_g       FLOAT,
    carbs_g         FLOAT,
    fat_g           FLOAT,
    fibre_g         FLOAT,
    dietary_tags    TEXT[],          -- vegan, gluten-free, nut-free, etc.
    ingredients     JSONB NOT NULL,  -- [{name, quantity, unit}]
    instructions    TEXT[],
    source_url      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recipes_cuisine ON recipes (cuisine_type);
CREATE INDEX idx_recipes_dietary ON recipes USING GIN (dietary_tags);
CREATE INDEX idx_recipes_meal_type ON recipes USING GIN (meal_type);

-- Recipe embeddings (pgvector)
CREATE TABLE recipe_embeddings (
    recipe_id       UUID PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
    embedding       VECTOR(768) NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recipe_embeddings_hnsw 
    ON recipe_embeddings USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Nutrition knowledge base documents
CREATE TABLE nutrition_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    source          TEXT,           -- "WHO 2023", "NHS Eat Well Guide", etc.
    content         TEXT NOT NULL,
    chunk_index     INTEGER,        -- for multi-chunk documents
    category        TEXT,           -- macronutrients, micronutrients, weight-loss, etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nutrition document embeddings
CREATE TABLE nutrition_embeddings (
    document_id     UUID PRIMARY KEY REFERENCES nutrition_documents(id) ON DELETE CASCADE,
    embedding       VECTOR(768) NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_nutrition_embeddings_hnsw
    ON nutrition_embeddings USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

### Phase 3: New Tables

```sql
-- Meal plans
CREATE TABLE meal_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT,
    plan_date       DATE NOT NULL,             -- start date
    duration_days   INTEGER NOT NULL DEFAULT 1,
    total_calories  INTEGER,
    status          TEXT NOT NULL DEFAULT 'active',  -- active, archived
    inference_log_id UUID REFERENCES ai_inference_logs(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_meal_plans_user ON meal_plans (user_id, plan_date DESC);

-- Meal plan items
CREATE TABLE meal_plan_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id    UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    recipe_id       UUID REFERENCES recipes(id) ON DELETE SET NULL,
    day_number      INTEGER NOT NULL,           -- 1-7
    meal_type       TEXT NOT NULL,              -- breakfast/lunch/dinner/snack
    recipe_name     TEXT NOT NULL,              -- denormalized for resilience
    calories        INTEGER,
    protein_g       FLOAT,
    carbs_g         FLOAT,
    fat_g           FLOAT,
    logged          BOOLEAN NOT NULL DEFAULT FALSE
);

-- Shopping lists
CREATE TABLE shopping_lists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_plan_id    UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shopping_list_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    quantity        TEXT,
    unit            TEXT,
    category        TEXT,           -- produce, dairy, protein, etc.
    checked         BOOLEAN NOT NULL DEFAULT FALSE
);

-- Coaching conversations
CREATE TABLE coaching_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coaching_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,      -- user, assistant
    content         TEXT NOT NULL,
    inference_log_id UUID REFERENCES ai_inference_logs(id) ON DELETE SET NULL,
    rag_sources     JSONB,              -- [{type, id, excerpt}]
    feedback        TEXT,              -- positive, negative, NULL
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 15. Module Breakdown

### Backend Modules

```
backend/app/
├── core/                    # Config, DB, auth, exceptions, Redis — ✅ Done
├── models/                  # SQLAlchemy ORM models — ✅ Done + extensions
├── schemas/                 # Pydantic request/response models
├── repositories/            # Data access layer (one per domain)
├── services/                # Business logic layer
│   ├── food.py              # ✅ Done
│   ├── weight.py            # Phase 1
│   ├── analytics.py         # Phase 1 extension
│   ├── recipe.py            # Phase 2
│   ├── rag_engine.py        # Phase 2
│   ├── context_builder.py   # Phase 2
│   ├── embedding_service.py # Phase 2
│   ├── coaching.py          # Phase 3
│   └── meal_plan.py         # Phase 3
├── ai_governance/           # ✅ Done — governance module
├── api/routes/              # HTTP endpoints
├── analytics/               # ✅ Done + extensions
└── jobs/                    # Background tasks (embedding generation, drift detection)
```

### Frontend Modules

```
frontend/app/
├── (tabs)/
│   ├── index.tsx           # Home / diary — ✅ Done
│   ├── analytics.tsx       # Analytics — ✅ Done, Phase 1 extension
│   ├── profile.tsx         # Profile — ✅ Done
│   ├── weight.tsx          # Phase 1
│   ├── recipes.tsx         # Phase 2
│   ├── coach.tsx           # Phase 3
│   └── plan.tsx            # Phase 3
├── onboarding/             # ✅ Done (12 screens)
│   └── cuisines.tsx        # Phase 1 addition
├── components/
│   ├── NutritionRing.tsx   # Phase 1
│   ├── WeightChart.tsx     # Phase 1
│   ├── MacroTrend.tsx      # Phase 1
│   ├── RecipeCard.tsx      # Phase 2
│   ├── MealPlanCalendar.tsx # Phase 3
│   └── ChatBubble.tsx      # Phase 3 extension
└── hooks/
    ├── useNutritionTargets # Phase 1
    ├── useRAGChat          # Phase 3
    └── useMealPlan         # Phase 3
```

---

## 16. Feature Prioritization

### MoSCoW Analysis

**Must Have (MVP → Phase 1)**
- ✅ Photo-based food logging
- ✅ AI nutrition analysis
- ✅ Food diary CRUD
- ✅ Daily calorie/macro tracking
- ✅ AI governance layer
- Weight logging + trend
- Macro targets prominently displayed
- 30-day analytics
- Cuisine/food preference collection

**Should Have (Phase 2)**
- Recipe knowledge base + semantic search
- RAG infrastructure (pgvector)
- Recipe recommendations
- Nutrition knowledge base
- Confidence drift alerts
- Manual food entry

**Could Have (Phase 3)**
- AI nutrition coaching (RAG-backed)
- Meal plan generation
- Shopping list generation
- Weekly AI progress summary
- Coaching conversation history
- Prompt A/B experimentation

**Won't Have (This Roadmap)**
- Wearable device integration
- Clinical dietitian integration portal
- Community / social features
- Custom food database crowdsourcing

---

## 17. MVP Definition (Current State)

The current MVP is **in production** and delivers:

1. **Authenticated multi-user platform** — registration, login, email verification, password reset
2. **Onboarding** — 12-screen flow collecting full user profile
3. **Multimodal food logging** — photo → Gemini AI → structured nutrition data
4. **Food diary** — view, edit, delete entries; mood + notes
5. **Daily analytics** — calorie summary, macro breakdown, TDEE-based target
6. **Weekly chart** — 7-day calorie history with goal line + streak
7. **Production AI governance** — model registry, prompt registry, inference audit log, risk engine, human review queue
8. **Infrastructure** — Docker Compose, Redis, PostgreSQL, Cloudflare R2, rate limiting

**MVP Gap Items (must close before Phase 1 begins):**
- [ ] Macro targets must be surfaced to the user in the home screen (currently calculated but not displayed)
- [ ] Memory buffer before size validation in `analyze.py:58-63` (DoS risk at scale)
- [ ] Account deletion endpoint

---

## 18. Phase 1 — Foundation & Completeness

**Timeline:** 4–6 weeks  
**Theme:** Close gaps, strengthen the core, surface value already in the system

### Business Objective
Increase daily active retention by making the platform's value proposition legible on the home screen. Users should see their progress toward goals without navigating away from the home dashboard.

### User Value
- "I can see at a glance if I'm on track today"
- "I can track my weight and see if I'm moving toward my goal"
- "I understand what macros I need, not just calories"

### Technical Scope

#### 1.1 — Macro Targets Display
- Backend: Add `daily_calorie_target`, `daily_protein_target_g`, `daily_carbs_target_g`, `daily_fat_target_g` columns to `users`
- Backend: Calculate targets on onboarding completion using Mifflin-St Jeor + Harris-Benedict activity multipliers
- Backend: Expose targets in `GET /users/me` response
- Frontend: Add macro target rings to home screen (calories, protein, carbs, fat vs. actuals)

#### 1.2 — Weight Tracking Module
- Backend: `weight_logs` table + migration
- Backend: `WeightRepository`, `WeightService`
- Backend: `POST /weight/logs`, `GET /weight/logs`, `GET /weight/logs/trend` endpoints
- Backend: Projected goal date calculation (linear regression on last 14 data points)
- Frontend: Weight logging screen (daily prompt on home screen)
- Frontend: Weight chart (line chart, 30-day rolling, goal line overlay)
- Frontend: "Projected to reach goal by [date]" widget

#### 1.3 — Analytics Depth
- Backend: 30-day macro trend queries (protein, carbs, fat by day)
- Backend: Goal adherence score (% of past 30 days within ±10% of calorie target)
- Frontend: Macro trend charts on analytics tab
- Frontend: Goal adherence percentage display

#### 1.4 — Profile Completion
- Backend: Add `preferred_cuisines`, `food_preferences`, `disliked_foods` columns
- Frontend: Add cuisine preference screen to onboarding flow (between dietary and final-welcome)
- Frontend: Allow editing all profile fields from profile tab

#### 1.5 — Security & Reliability
- Fix: `analyze.py:58-63` — chunked read with running byte counter for size validation before memory buffering
- Add: `DELETE /users/me` endpoint with soft-delete and data anonymization
- Add: GDPR-compliant data export endpoint `GET /analytics/export`

### Database Changes
```sql
-- Target columns on users
ALTER TABLE users ADD COLUMN daily_calorie_target INTEGER;
ALTER TABLE users ADD COLUMN daily_protein_target_g FLOAT;
ALTER TABLE users ADD COLUMN daily_carbs_target_g FLOAT;
ALTER TABLE users ADD COLUMN daily_fat_target_g FLOAT;
ALTER TABLE users ADD COLUMN preferred_cuisines TEXT[];
ALTER TABLE users ADD COLUMN food_preferences TEXT[];
ALTER TABLE users ADD COLUMN disliked_foods TEXT[];
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN account_deleted_at TIMESTAMPTZ;

-- Weight logs table
CREATE TABLE weight_logs (...); -- see schema section
```

### API Changes
- `PATCH /users/me` extended to accept new profile fields
- `GET /users/me` returns macro targets in response
- `POST /weight/logs`, `GET /weight/logs`, `GET /weight/logs/trend` — new
- `GET /analytics/macros/trend?days=30` — new
- `GET /analytics/goal-adherence` — new
- `DELETE /users/me` — new
- `GET /analytics/export` — new (CSV/PDF)

### Frontend Changes
- Home screen: macro target rings
- Home screen: weight logging prompt
- Analytics: macro trend charts, goal adherence badge
- New tab: Weight (chart + log entry)
- Onboarding: cuisine preference screen
- Profile: editable targets + cuisine preferences

### AI Changes
- None (governance layer unchanged)

### Dependencies
- None (all within existing stack)

### Acceptance Criteria
- [ ] User sees calorie + macro rings on home screen after onboarding
- [ ] User can log weight daily and view 30-day trend
- [ ] Projected goal date is displayed and updates as weight is logged
- [ ] Analytics tab shows 30-day macro trend charts
- [ ] Goal adherence percentage visible on analytics tab
- [ ] All onboarding profile fields editable from profile tab
- [ ] `analyze.py` size check fires before memory allocation
- [ ] Account deletion removes PII within 30 days

---

## 19. Phase 2 — Intelligence Layer (RAG)

**Timeline:** 6–8 weeks  
**Theme:** Build the knowledge foundation that makes all future AI features possible

### Business Objective
Establish the RAG infrastructure that transforms Snacc Buddy from a logging tool into an intelligent platform. The Recipe KB enables the first tangible "AI knows what I like" moment.

### User Value
- "The app recommends recipes that actually fit my goals and diet"
- "I can search for a meal idea and it shows me something that fits my calorie budget"
- "The app explains its recommendations"

### Technical Scope

#### 2.1 — Vector Infrastructure
- Install `pgvector` PostgreSQL extension
- Create `recipe_embeddings` and `nutrition_embeddings` tables with HNSW indexes
- Build `EmbeddingService` wrapping Gemini `embedding-001` API
- Background job: batch embedding generation for new records
- Alembic migration for all Phase 2 tables

#### 2.2 — Recipe Knowledge Base
- Source and ingest open-licensed recipe dataset (~50,000 recipes)
- Data pipeline: parse, normalize, load into `recipes` table
- Background job: generate and store embeddings for all recipes
- `RecipeRepository` with semantic search + structured filters
  - Filter by: dietary_tags, meal_type, calorie_range, cuisine_type
  - Sort by: macro fit to user targets, similarity score
- `POST /recipes/recommend` — personalized recommendations (top 10)
- `GET /recipes/search?q=...` — semantic search endpoint
- Frontend: Recipe discovery tab with recommendation feed
- Frontend: Recipe detail screen (nutrition, ingredients, instructions)

#### 2.3 — Nutrition Knowledge Base
- Curate 50–100 evidence-based nutrition documents (WHO, NHS, PubMed abstracts)
- Chunk documents (512 tokens, 50-token overlap) and embed
- `NutritionDocumentRepository` with semantic search
- Documents tagged by category for topic-scoped retrieval
- No user-facing UI in Phase 2 — used internally by coaching layer (Phase 3)

#### 2.4 — RAG Engine Core
- `RAGEngine` service class: context assembly pipeline
- `ContextBuilder`: combines profile, food log summary, weight trend, retrieved docs
- Token budget manager: respects per-use-case limits
- Context assembly logged in `ai_inference_logs` with `rag_sources` metadata
- Unit tests: context assembly, token counting, source ranking

#### 2.5 — Food Log Embedding (Background)
- On food log creation: async task generates embedding for meal description
- Stored in `food_log_embeddings` table (add in Phase 2)
- Enables semantic search across user's own history in Phase 3

#### 2.6 — Manual Food Entry
- `POST /food/logs/manual` — text-based entry with manual macro input
- Frontend: "Add manually" option in meal logging flow
- Governance: manual entries marked differently in inference log (no AI call)

### Database Changes
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE recipes (...);
CREATE TABLE recipe_embeddings (...);
CREATE TABLE nutrition_documents (...);
CREATE TABLE nutrition_embeddings (...);
CREATE TABLE food_log_embeddings (
    food_log_id  UUID PRIMARY KEY REFERENCES food_logs(id) ON DELETE CASCADE,
    embedding    VECTOR(768) NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### API Changes
- `GET /recipes/recommend` — RAG-powered recipe recommendations
- `GET /recipes/search` — semantic recipe search
- `GET /recipes/{id}` — recipe detail
- `POST /food/logs/manual` — manual entry

### Frontend Changes
- New tab: Recipes (recommendation feed + search)
- Recipe detail screen
- Logging flow: "Add manually" option

### AI Changes
- New: `EmbeddingService` (Gemini embedding-001)
- New: `RAGEngine` and `ContextBuilder`
- Governance: inference logs for recipe recommendations track rag_sources
- Recipe recommendations inherit full governance pipeline

### Dependencies
- Phase 1 complete (cuisine preferences needed for recipe filtering)
- pgvector PostgreSQL extension installed in deployment environment
- Recipe dataset sourced and licensed

### Acceptance Criteria
- [ ] Recipe recommendation returns 10 recipes respecting dietary restrictions
- [ ] Recipe calorie range filter works correctly
- [ ] Semantic search returns relevant results for natural language queries
- [ ] Embeddings generated within 60 seconds of recipe creation
- [ ] RAG context assembly is logged with sources in inference_log
- [ ] Manual food entry works without AI call
- [ ] Token budget never exceeded in context assembly

---

## 20. Phase 3 — AI Coaching & Planning

**Timeline:** 8–10 weeks  
**Theme:** Deliver the full coaching experience — the core product differentiator

### Business Objective
Enable the platform's primary value proposition: an AI coach that understands each user's complete nutritional history and helps them make better decisions. This is the feature that justifies subscription pricing.

### User Value
- "I have an AI coach that actually knows my history and explains my progress"
- "I can ask why I gained weight and get a real answer based on my data"
- "My week's meals are planned for me and the shopping list is ready to go"

### Technical Scope

#### 3.1 — AI Nutrition Coaching
- `CoachingService` using full RAG pipeline:
  - Sources: UserProfile + FoodLogs (7d + semantic) + WeightHistory + NutritionKB
  - System prompt: positions Snacc Buddy as a certified nutrition coach (not a doctor)
  - Medical disclaimer: appended to every coaching response
  - Coaching session persistence: `coaching_sessions` + `coaching_messages` tables
- `POST /coaching/chat` endpoint (streaming response via SSE)
- `GET /coaching/sessions` — session history
- Feedback mechanism: thumbs up/down stored against `coaching_messages`
- Frontend: Coach tab (chat interface with RAG source chips)
- Frontend: "Ask your coach" button on analytics screen (pre-fills with current week's data context)

#### 3.2 — Weekly AI Progress Summary
- Background job: runs every Sunday at 20:00 (user's local time)
- Retrieves: food logs for past 7 days, weight logs for past 7 days, macro averages
- Generates: 3–5 sentence progress summary with 1–2 specific recommendations
- Stored as a `coaching_messages` record with `role=assistant, type=weekly_summary`
- Surfaced: notification + "This week's summary" card on analytics tab
- Governance: full inference audit for every generated summary

#### 3.3 — Meal Planning
- `MealPlanService`: generates 1-day or 7-day meal plan
  - Sources: UserProfile + FoodLogs (preference signal) + RecipeKB
  - Constraints: daily calorie target, macro targets, dietary restrictions, cuisine preferences
  - Output: structured meal plan with recipe assignments per meal slot
- `POST /plans/generate` — generate meal plan with `duration_days` param
- `GET /plans/{id}` — retrieve plan with full recipe details
- `PATCH /plans/{id}/swap-meal` — swap one meal in plan (re-runs recipe recommendation)
- Frontend: Plan tab with week calendar view
- Frontend: Meal plan card per day (tap to see recipe detail)
- Frontend: "Log this meal" button on each plan item (creates food log from recipe)

#### 3.4 — Shopping List Generation
- `ShoppingListService`: aggregates ingredients from meal plan items, de-duplicates, categorizes
- `GET /plans/{id}/shopping-list` — returns categorized shopping list
- Frontend: Shopping list screen (checkable items, grouped by category: produce/dairy/protein/other)
- Frontend: "Add to list" from individual recipe detail screen

#### 3.5 — Governance Additions
- Prompt A/B experiment framework (see Section 13)
- User feedback integration into governance dashboard
- Low-rated coaching responses auto-queued for human review
- Coaching-specific risk thresholds (coaching responses scored separately from food analysis)

### Database Changes
```sql
CREATE TABLE coaching_sessions (...);
CREATE TABLE coaching_messages (...);
CREATE TABLE meal_plans (...);
CREATE TABLE meal_plan_items (...);
CREATE TABLE shopping_lists (...);
CREATE TABLE shopping_list_items (...);
```

### API Changes
- `POST /coaching/chat` (SSE streaming)
- `GET /coaching/sessions`
- `GET /coaching/sessions/{id}/messages`
- `POST /coaching/messages/{id}/feedback`
- `POST /plans/generate`
- `GET /plans/{id}`
- `PATCH /plans/{id}/swap-meal`
- `GET /plans/{id}/shopping-list`
- `GET /coaching/summary/weekly`

### Frontend Changes
- New tab: Coach (chat UI, session history, weekly summary card)
- New tab: Plan (week calendar, meal slots, recipe cards)
- Shopping list screen (from Plan tab)
- Analytics: "Ask your coach" shortcut
- Home: "This week's summary" notification card

### AI Changes
- `CoachingService` with full 5-source RAG context assembly
- Weekly summary background job
- Meal planning with recipe constraint solver
- Streaming response support (SSE from FastAPI)
- Coaching responses tracked in full governance pipeline
- Feedback loop: coaching message ratings → governance dashboard

### Dependencies
- Phase 2 complete (RAG Engine, RecipeKB, NutritionKB required)
- Push notification infrastructure for weekly summary delivery
- Phase 1 weight tracking required for coaching context

### Acceptance Criteria
- [ ] Coach responds in < 8 seconds (p95) including RAG retrieval
- [ ] Every coaching response includes medical disclaimer
- [ ] Coach cites at least one data source from user's own history
- [ ] Weekly summary generated and delivered by Monday morning for all users
- [ ] Meal plan respects dietary restrictions (zero violations in QA test suite)
- [ ] Shopping list aggregates correctly across 7-day plan
- [ ] Coaching feedback stored and visible in governance dashboard
- [ ] Low-rated responses (thumbs down) auto-queued for human review

---

## 21. Phase 4 — Platform & Scale

**Timeline:** 10–12 weeks  
**Theme:** Enterprise-readiness, mobile apps, ecosystem integrations

### Business Objective
Expand addressable market: native iOS/Android apps, health platform integrations, potential B2B (employer wellness, clinical dietitian portal).

### Technical Scope

#### 4.1 — Native Mobile Apps
- Expo EAS Build: iOS App Store and Google Play Store builds
- Push notifications (Expo Push Notifications API)
- Camera integration optimization for food photo capture
- Offline mode: read-only diary and cached analytics

#### 4.2 — Health Platform Integrations
- Apple HealthKit: sync weight data bi-directionally
- Google Fit: sync weight and activity data
- Activity data (steps, active calories) as input to TDEE recalculation

#### 4.3 — OAuth Login
- Google Sign-In
- Apple Sign-In
- Link multiple auth providers to single account

#### 4.4 — Barcode Scanning
- Camera-based barcode scan → Open Food Facts API lookup → pre-fill manual entry
- Fallback: manual entry if product not found

#### 4.5 — Enhanced AI Governance
- Role-based access control for governance dashboard (admin, reviewer, read-only)
- Governance API for external audit export (SOC 2 readiness)
- Model version rollback capability
- Automated regression testing for new prompt versions

#### 4.6 — Performance & Scale
- Read replicas for analytics queries
- CDN for recipe images
- Rate limiting tuning based on Phase 3 usage data
- Database query optimization (EXPLAIN ANALYZE audit)
- Horizontal scaling configuration for FastAPI workers

### Dependencies
- Phase 3 complete
- Apple Developer Program membership
- Google Play Console account

### Acceptance Criteria
- [ ] App available on iOS App Store and Google Play
- [ ] Weight data syncs bidirectionally with Apple HealthKit
- [ ] Barcode scan resolves 80%+ of common packaged foods
- [ ] Governance dashboard access controlled by role
- [ ] API sustains 5,000 concurrent users at P95 < 200ms

---

## 22. Engineering Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| **M0** | MVP production (Done) | ✅ Complete |
| **M1** | Phase 1 complete — macro targets + weight tracking live | Week 6 |
| **M2** | pgvector + RecipeKB seeded + search endpoint live | Week 12 |
| **M3** | Full RAG Engine + recipe recommendations in production | Week 14 |
| **M4** | NutritionKB seeded + coaching endpoint (alpha) | Week 18 |
| **M5** | Phase 3 complete — coaching + meal planning + shopping list | Week 24 |
| **M6** | iOS/Android App Store submissions | Week 32 |
| **M7** | HealthKit integration live | Week 36 |

---

## 23. Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Gemini API latency spikes** | Medium | High | Retry with exponential backoff; fallback to cached response for repeat queries; latency SLA monitoring |
| **pgvector query performance at scale** | Medium | High | HNSW indexing; query profiling before Phase 2 launch; read replica for vector queries if needed |
| **Recipe dataset quality / licensing** | Medium | Medium | Use multiple open-licensed sources (RecipeNLG, Open Food Facts); implement data quality validation pipeline |
| **Embedding cost at scale** | Low | Medium | Batch embedding generation; cache embeddings aggressively; monitor Gemini embedding API costs |
| **RAG context hallucination** | Medium | High | Source-grounding prompts; confidence scoring on coaching responses; medical disclaimer mandatory; human review queue for low-confidence outputs |
| **Token budget overflow** | Low | Medium | Hard cap in `ContextBuilder`; unit tested; budget allocation reviewed before Phase 3 |
| **PostgreSQL migration failures** | Low | High | Test all Alembic migrations on staging clone before production; maintain rollback scripts; zero-downtime migration patterns for large tables |
| **Memory DoS via large upload** | Medium | Medium | Phase 1 fix: chunked read in `analyze.py`; Content-Length header validation at nginx/CDN layer |

---

## 24. Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low onboarding completion rate** | Medium | High | Add progress indicator; make all fields optional except weight+goal; allow re-entry at any point |
| **AI analysis inaccuracy erodes trust** | Medium | High | Confidence score displayed to user; easy correction flow via chat; low-confidence results shown with caveat |
| **Coaching perceived as medical advice** | Low | Critical | Mandatory medical disclaimer on every coaching output; "consult a healthcare professional" framing; no diagnostic language in system prompts |
| **Recipe recommendations not relevant** | Medium | Medium | User feedback on each recommendation; cold-start strategy using cuisine preferences from onboarding |
| **Meal planning too rigid / not adopted** | Medium | Medium | Easy swap/regenerate flow; flexible 1-day vs. 7-day option; framing as "inspiration" not obligation |
| **Subscription conversion too low** | Medium | High | Coaching + meal planning as Phase 3 paywall trigger; free tier retains logging + basic analytics |
| **User data privacy concerns** | Low | Critical | GDPR-compliant data export and deletion; no PII in logs; privacy policy in onboarding |

---

## 25. Success Metrics

### Acquisition
| Metric | Phase 1 Target | Phase 3 Target |
|--------|---------------|----------------|
| Registered users | — | — |
| Onboarding completion rate | > 70% | > 80% |
| Day-1 activation (first food log) | > 60% | > 70% |

### Engagement
| Metric | Phase 1 Target | Phase 3 Target |
|--------|---------------|----------------|
| D7 retention | > 30% | > 45% |
| D30 retention | > 15% | > 30% |
| Avg. food logs per active user per day | > 2 | > 2.5 |
| Weekly streak rate (users with ≥5 day streak) | > 25% | > 40% |
| Coaching sessions per active user per week | — | > 1 |
| Meal plan adoption rate | — | > 20% |

### AI Quality
| Metric | Target |
|--------|--------|
| AI analysis confidence score (median) | > 0.85 |
| Analysis rejection rate (risk_score = 1.0) | < 3% |
| Coaching response positive feedback rate | > 75% |
| RAG retrieval relevance (manual spot-check) | > 80% |
| Human review queue clearance rate | > 90% within 48h |

### Governance
| Metric | Target |
|--------|--------|
| Inference audit log coverage | 100% of AI calls |
| Prompt version traceability | 100% (every inference links to prompt version) |
| Risk classification coverage | 100% |
| Drift detection alert response time | < 4 hours |

### Performance
| Metric | Target |
|--------|--------|
| AI analysis P95 latency | < 5 seconds |
| API P95 latency (non-AI) | < 200 ms |
| RAG coaching P95 latency | < 8 seconds |
| App crash rate | < 0.1% |

---

## 26. Analytics Requirements

### Event Tracking (Frontend)

All events stored in backend analytics table or forwarded to analytics service.

| Event | Properties |
|-------|------------|
| `onboarding_step_completed` | step_name, duration_sec |
| `onboarding_completed` | total_duration_sec |
| `food_log_created` | method (photo/manual), meal_type, confidence |
| `chat_refinement_sent` | food_log_id |
| `weight_log_created` | |
| `recipe_viewed` | recipe_id, source (recommendation/search) |
| `recipe_search_performed` | query, result_count |
| `coaching_session_started` | |
| `coaching_message_sent` | |
| `coaching_feedback_given` | sentiment (positive/negative) |
| `meal_plan_generated` | duration_days |
| `meal_plan_meal_swapped` | |
| `shopping_list_item_checked` | |
| `analytics_tab_viewed` | sub_tab |

### System Analytics (Backend)

| Metric | Collection Method |
|--------|------------------|
| Gemini API latency | Inference log `latency_ms` |
| Confidence distribution | Inference log `confidence` histogram |
| Risk classification distribution | Risk assessment table aggregation |
| Human review queue depth | Human reviews table COUNT |
| RAG retrieval hit rate | Context assembly logging |
| Cache hit rate | Redis `INFO stats` |
| Token usage per use case | Inference log `tokens_used` |

### Dashboards Required

1. **Product Dashboard** — DAU, retention, onboarding funnel, food log volume
2. **AI Quality Dashboard** — confidence distribution, rejection rate, feedback scores
3. **Governance Dashboard** — inference volume, risk distribution, queue depth, drift alerts (existing)
4. **Performance Dashboard** — API latency P50/P95/P99, error rates, cache hit rate

---

## 27. Future Expansion Opportunities

### Clinical & Enterprise

**Dietitian Portal:** A web-based interface for registered dietitians to view client food logs, weight trends, and AI coaching transcripts. The governance layer's audit trail is already built; the portal is a read-only view over existing data.

**Employer Wellness Programs:** Aggregate (anonymized) nutrition insights for workplace wellness dashboards. Existing user data model supports this with appropriate consent flows.

**EHR Integration:** Export standardized nutrition data (HL7 FHIR) for integration with electronic health records. The structured food log schema maps cleanly to FHIR `NutritionOrder` resources.

### AI Capability Expansion

**Multimodal meal reconstruction:** Use AI to reconstruct portion sizes from depth-estimated photos, improving calorie accuracy.

**Predictive coaching:** Use historical patterns to predict future adherence ("Based on your patterns, Thursdays are your highest-risk day — here's a plan") before the user deviates.

**Meal timing analysis:** Incorporate meal timestamps into coaching context to surface circadian nutrition patterns.

**Micronutrient tracking:** Extend food log model to track vitamins and minerals; build micronutrient gap analysis into coaching.

### Platform

**Apple Watch / Wear OS app:** Quick-log from wrist; weight logging prompt from watch.

**Web app:** Full-featured web interface for users preferring desktop (especially meal planning and shopping list management).

**API platform:** Expose nutrition analysis as an API for third-party developers. The governance layer already supports multi-tenant prompt and model management.

**Recipe content partnerships:** Partner with food publishers or meal kit companies (HelloFresh, Gousto) to integrate their recipe databases, creating a monetization and content acquisition channel.

---

*Document prepared for review by: Head of Product · CTO · Engineering Manager · AI Governance Lead*  
*Next review: Phase 1 kickoff meeting*  
*Owner: Product & Engineering*
