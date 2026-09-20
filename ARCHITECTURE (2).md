# CloudOps Platform — Architecture, Team Split & Integration Contract

> **Version:** 2.0.0 — **FINAL** · **Status:** FROZEN (change only via §20)
> **Stack:** React (Vite + TypeScript) · FastAPI (Python) · PostgreSQL · Docker Compose
> **Team of 3:** **Person 1** Frontend · **Person 2** Platform backend + Integration lead · **Person 3** Data & Intelligence
> **Rule #1:** If this file and your code disagree, **this file wins**. Change the file first, then the code.

---

## ▶ START HERE — say "I am Person 1 / 2 / 3"

**Humans:** upload this file to your AI chat/agent and type one line:
`I am Person 1, start my work.` (or Person 2 / Person 3).

**AI reading this file — mandatory instructions**
1. The first user message says which person they are. If it doesn't, ask once: *"Which person are you — 1 (Frontend), 2 (Platform backend & integration lead) or 3 (Data & Intelligence)?"* and wait.
2. Reply first with a **5-line confirmation**: your role · what you own · what you must NOT touch · your first milestone (M0) · what you depend on and how it is stubbed/mocked.
3. Read only what you need (table below). Ignore the other persons' playbooks except their "Provides" lists.
4. Build **only inside the folders you own** (§16.1). Never edit another person's files. Missing something from a teammate → use the stub/mock, log a **CONTRACT GAP** (§20) and keep going.
5. Work **milestone by milestone** (M0, M1, …) exactly as in your playbook (§17). Output complete, runnable files — one fenced code block per file, preceded by its path. No placeholders or TODOs in shipped code. Code style: concise; comments only where logic isn't obvious.
6. After each milestone print a **MILESTONE REPORT**: ✅ done · ⚠️ deviations · ❓ contract gaps · 📣 what teammates can now rely on.
7. **Never invent** endpoints, fields, enums, error codes, env vars or table columns. This file is the contract.
8. Don't ask questions unless truly blocked; make the most conservative choice consistent with this file and note it in the report.

| | **Person 1** | **Person 2** | **Person 3** |
|---|---|---|---|
| Role | **Frontend** (React UI, mocks, WS client) | **Platform backend & Integration lead** (app shell, DB, auth/RBAC, policies, orchestrator, alerts/notifications, WebSocket, Docker/CI, smoke tests) | **Data & Intelligence** (cloud adapters, mock cloud, ingestion, analytics, recommendations, cost engine, read APIs, AI layer) |
| Owns | `frontend/**` | `backend/` shell + control plane, `docker-compose.yml`, `.github/`, `scripts/`, `contracts/` | `backend/app/adapters`, data-plane services/routers, data seeds |
| Talks to others via | HTTP `/api/v1` + WS `/ws` (§7, §9) | HTTP (to P1) · `ports.py` (to P3) | `ports.py` (to P2) |
| Runs alone using | **MSW mocks** (§13.2) | **Stub ports** (§16.3) | **Stub ports + pure functions** (§16.3) |
| Playbook | §17.1 | §17.2 | §17.3 |
| Must read | §1, 4, 6, 7, 8, 9, 12, 13, 15.3, 16.1, 17.1, 18 | **everything** | §1, 4–12, 14, 16, 17.3, 18 |

**Golden rules (all three)**
1. The **contract is law** (§4–§9). Same paths, JSON shapes, enums, error codes, everywhere.
2. **Own your folders only.** Disjoint folders ⇒ merges never conflict (§16.7).
3. Cross-person talk happens **only** through: HTTP contract (P1 ↔ backend) and `app/ports.py` (P2 ↔ P3). No other imports across ownership lines (§16.3, §16.6).
4. **Everything runs alone**: P1 on mocks, P2/P3 on stubs. Integration = flipping env/stubs off, not rewriting.
5. **Only Person 2** touches DB migrations/models, `main.py`, `ports.py`, compose, CI. Others request changes via a CONTRACT GAP.
6. Server output: **camelCase · UTC ISO-8601 · money as float USD · envelope on every response · no trailing slashes** (§4).
7. Sync at the **gates** (§18.1). A gate passes only when its checklist is green on a clean `docker compose up`.

---

## 1. Product summary & demo storyline

CloudOps is a unified platform to **monitor, manage, scale and cost-analyze** cloud infrastructure (AWS, Azure, GCP) through one simple UI, with **intelligent recommendations** that always respect **policies, budgets, permissions and safety limits**. **No change is applied without validation + authorization.**

**Core workflow (must work end-to-end):**
```
Traffic spike detected → Recommendation created (scale out)
→ Cost impact estimated → User reviews (cost + policy checks + AI explanation)
→ User authorizes → Orchestrator validates (permission, policy, budget, approval)
→ (Manager approval if a policy demands it) → Cloud adapter executes
→ Status tracked live → Audit log + notification
```

**Demo storyline (everyone polishes THIS path — ~5 minutes)**
1. Login as **DevOps** → dashboard: 14 resources across 3 clouds, live KPIs, cost vs budget.
2. A **traffic spike** hits `checkout-api` (scripted, or press "Simulate spike") → alert + toast + new recommendation.
3. Open **Review**: cost impact **+$60.74/month**, within budget, all policy checks green, AI explanation.
4. **Apply** → status streams live → CPU chart drops → audit entry + notification.
5. Scale to **10** → *needs Manager approval* → switch to **Manager**, approve.
6. Scale to **12** → **blocked** by the safety limit (reasons shown).
7. **Costs** page: forecast, budget bar, cost anomaly, billing. Ask the **AI**: *"What happens to cost if I scale checkout-api to 8?"* → preview card.
8. Log in as **Viewer** → everything read-only.

**Differentiators to keep visible:** policy-safe recommendations · cost impact *before* action · human-in-the-loop approvals · multi-cloud abstraction · full audit trail · real-time updates · explainable AI (LLM never executes).

---

## 2. Architecture (maps 1:1 to the solution diagram)

```mermaid
flowchart TD
  U[User: Developer/DevOps · Admin · Manager] --> FE[Frontend / UI - React]
  FE -->|REST /api/v1 + WebSocket /ws| GW[Platform Gateway / API Backend - FastAPI]
  FE <--> NS[Notification Service: Email · WhatsApp · In-App]
  GW <--> DB[(PostgreSQL)]
  GW --> ING[Data Ingestion]
  GW --> POL[Policy & RBAC]
  GW --> COST[Cost Engine]
  ING --> AN[Analytics Engine]
  POL --> AN
  COST --> AN
  AN --> REC[Recommendation Engine]
  REC --> LLM[AI / LLM Layer]
  LLM --> ORCH[Approval / Action Orchestrator]
  ORCH --> ADP[Cloud Provider Adapter]
  ADP --> AWS[AWS Adapter]
  ADP --> AZ[Azure Adapter]
  ADP --> GCP[GCP Adapter]
  ORCH --> NS
```

| Layer | Responsibility | Backend module (`backend/app/`) | Built by |
|---|---|---|---|
| Frontend / UI | Dashboard, resources, monitoring, costs, recommendations, alerts, approvals | — (`frontend/`) | **P1** |
| Platform Gateway | Auth, routing, validation, envelope, WebSocket hub | `main.py`, `api/v1/*`, `realtime/` | **P2** |
| Data Ingestion | Pull metrics/traffic/health/storage from adapters on a schedule, normalize, store | `services/ingestion.py`, `jobs/` | **P3** |
| Policy & RBAC | Permissions, budgets, safety limits, approval rules | `services/policy.py`, `core/security.py` | **P2** |
| Cost Engine | Current cost, projected cost, cost impact of an action, forecasts | `services/cost.py` | **P3** |
| Analytics Engine | Anomaly detection, trend analysis, health analysis | `services/analytics.py` | **P3** |
| Recommendation Engine | Scale up/down, right-sizing, cost optimization, resource allocation | `services/recommendation.py` | **P3** |
| AI / LLM Layer | Explain, summarize, natural-language Q&A (**never executes**) | `services/ai/`, `api/v1/ai.py` | **P3** |
| Approval / Action Orchestrator | Validate (permission → policy → budget → approval) then execute | `services/orchestrator.py` | **P2** |
| Cloud Provider Adapter | Uniform interface over AWS/Azure/GCP (+ mock) | `adapters/` | **P3** |
| Notification Service | Email, WhatsApp, in-app; optional MCP/other channels | `services/notifier.py`, `services/notification/` | **P2** |

> Diagram typos to ignore: "Paffic" = **Traffic**; the orchestrator's duplicated "Validate Budget" = **Validate Permission → Validate Policy → Validate Budget → Check Approval → Execute**.

---

## 3. Tech stack & repo layout

### 3.1 Choices (decided — swap only if ALL persons agree)

| Part | Choice |
|---|---|
| **Frontend** | **React 18 + TypeScript + Vite** · React Router v6 · TanStack Query v5 · Zustand (auth/session only) · Tailwind CSS + shadcn/ui · Recharts · react-hook-form + zod · lucide-react · sonner (toasts) · date-fns · **MSW** (mock API) · native `WebSocket` |
| **Backend** | **Python 3.12 + FastAPI** · Uvicorn (1 worker) · SQLAlchemy 2.0 (async) + asyncpg · Alembic · Pydantic v2 + pydantic-settings · PyJWT · argon2-cffi · cryptography (Fernet) · APScheduler 3.x · httpx · numpy · pytest |
| **Database** | **PostgreSQL 16** (no MongoDB — the data is relational and the diagram specifies PostgreSQL) |
| **Cloud SDKs** | `boto3` (AWS), `azure-identity` + `azure-mgmt-*` (Azure), `google-cloud-*` (GCP). **Optional extras**, imported lazily inside live adapters so mock mode needs none |
| **LLM** | Any provider behind an `LlmClient` interface (default: Anthropic Claude via the `anthropic` SDK). Model + key from env |
| **Realtime** | FastAPI native WebSocket at `/ws` |
| **Deploy** | Docker Compose: `db` + `backend` + `frontend` (nginx serves the React build **and** reverse-proxies `/api` and `/ws` → single origin, no CORS pain) |

**Why FastAPI (not MERN):** best cloud-SDK coverage (boto3) + numpy for analytics; MERN implies MongoDB while our model is relational/PostgreSQL; auto OpenAPI docs from the same Pydantic models (`/api/docs`) enable contract checks; native WebSockets and async I/O; tiny Docker image.

### 3.2 Repo layout (monorepo) — `[P#]` = owner

```
cloudops/
├─ ARCHITECTURE.md                          [P2 keeps it — contract keeper]
├─ docker-compose.yml · .env.example        [P2]
├─ .github/workflows/ci.yml                 [P2]
├─ scripts/  smoke_api.py, wait_for_health.sh          [P2]
├─ contracts/openapi.json                   [P2]  exported from FastAPI (drift check)
├─ docs/gaps/  p1.md · p2.md · p3.md        [each person their own]  CONTRACT GAP logs
├─ backend/
│   ├─ Dockerfile · requirements.txt · alembic.ini · alembic/versions/   [P2]
│   ├─ requirements-live.txt                                              [P3]
│   ├─ tests/  conftest.py [P2] · p2/ [P2] · p3/ [P3]
│   └─ app/
│       ├─ main.py · bootstrap.py · ports.py · ports_stubs.py · export_openapi.py · seed.py   [P2]
│       ├─ core/     config.py, security.py, errors.py, deps.py            [P2]
│       ├─ db/       session.py, base.py, models/*.py (ALL tables)         [P2]
│       ├─ schemas/  base, common, enums, auth, users, accounts, recommendations, actions,
│       │            policies, budgets, alerts, notifications, audit, system   [P2]
│       │            resources, metrics, costs, billing, anomalies, analytics, dashboard, ai   [P3]
│       ├─ api/v1/   auth, users, cloud_accounts, recommendations, actions, policies,
│       │            budgets, alerts, notifications, audit, system              [P2]
│       │            dashboard, resources, metrics, costs, billing, anomalies,
│       │            analytics, ai, mock_control                                [P3]
│       ├─ services/ policy, orchestrator, alerts, notifier, audit, notification/{base,in_app,email,whatsapp}   [P2]
│       │            ingestion, analytics, recommendation, cost, metrics_query, ai/{llm_client,prompts,tools}     [P3]
│       ├─ realtime/ hub.py, ws.py                                         [P2]
│       ├─ adapters/ registry, mock, mock_generator, price_catalog, aws, azure, gcp   [P3]
│       ├─ jobs/     scheduler.py, recovery_jobs.py [P2] · ingestion_jobs.py, maintenance_jobs.py [P3]
│       └─ seeds/    core.py (ORDER=10) [P2] · data.py (ORDER=20) [P3]
└─ frontend/                                [P1]
    ├─ Dockerfile · nginx.conf · vite.config.ts · package.json (+ package-lock.json committed)
    └─ src/  main.tsx · App.tsx · routes.tsx
             api/ {client.ts, ws.ts, types.ts ← copy of §6, endpoints/*.ts, contract-check.ts}
             mocks/ {browser.ts, handlers.ts, data/*.ts, fakeSocket.ts}
             features/ {auth, dashboard, monitoring, resources, costs, recommendations, approvals,
                        policies, accounts, alerts, notifications, audit, users, ai}
             components/ {ui, charts, layout} · store/ · hooks/ · lib/
```

---

## 4. Global API conventions (NON-NEGOTIABLE)

| Topic | Rule |
|---|---|
| Base path | `/api/v1` (relative; in dev Vite proxies it to `http://localhost:8000`). Swagger UI at `/api/docs` |
| Trailing slash | **Never.** `/resources`, not `/resources/`. FastAPI is created with `redirect_slashes=False` (a redirect behind the proxy would leak the internal host) |
| Format | JSON only, UTF-8 |
| Field naming | **camelCase** in JSON · snake_case in Python/DB |
| IDs | UUID v4 strings |
| Timestamps | ISO-8601 **UTC** (`2026-09-19T10:30:00Z`); fractional seconds may appear — parse with `new Date()`. Backend: timezone-aware UTC only. The **server** generates all timestamps; the client only sends time *ranges* |
| Date params | `from`/`to` accept a full ISO datetime **or** `YYYY-MM-DD` (date = start/end of that UTC day) |
| Money | JSON **number** (never string), **USD**, 2 decimals, names end in `Usd`. DB `NUMERIC(14,2)`; Pydantic schemas use `float` (**not** `Decimal` — Pydantic v2 serializes Decimal as a string) |
| Percent | number 0–100 (not 0–1) |
| Enums | UPPER_SNAKE_CASE strings exactly as in §6. Frontend must not crash on an unknown value (render the raw string) |
| Arrays in query | comma-separated: `metric=cpu_utilization,request_rate` |
| Auth | `Authorization: Bearer <accessToken>` on everything except `/auth/login`, `/auth/refresh`, `/system/health`. **Authorization uses the role stored in the DB on every request** (JWT `role` claim is informational) so role changes/deactivation apply immediately |
| Idempotency | `POST /actions` requires header `Idempotency-Key: <uuid>` (missing → 400). Same key by the same user returns the original Action |
| Pagination | `?page=1&pageSize=20` (page starts at 1, max pageSize 100). Empty list = `200` with `data: []` (never 404) |
| Sorting | `?sort=field,asc` or `?sort=field,desc`; unknown field → 400 |
| Search | `search` = case-insensitive substring on `name` |
| Time range | `?from&to&interval=1m\|5m\|15m\|1h\|1d` |
| Success codes | **201** for: `POST /actions`, `POST /recommendations/{id}/accept`, `POST /users`, `/policies`, `/budgets`, `/cloud-accounts`. **200** for everything else (DELETE → `{deleted:true}`, no 204) |
| Structural vs rule errors | Malformed input, unknown/unsupported action for the resource, or a no-op (target equals current) → **400 `VALIDATION_ERROR`**. A *rule* violation (safety limit, budget, bounds) → the Action is created with status **`BLOCKED`** (§10.6) |

### 4.1 Response envelope

**Success (single object / array without paging):**
```json
{ "success": true, "data": { } }
```
**Paginated list** (`data` is an array; `meta` present **only** on paginated lists):
```json
{ "success": true, "data": [ ], "meta": { "page": 1, "pageSize": 20, "total": 134, "totalPages": 7 } }
```
**Error:**
```json
{
  "success": false,
  "error": {
    "code": "POLICY_VIOLATION",
    "message": "Scaling to 12 instances exceeds the safety limit of 10.",
    "details": [ { "field": "params.targetInstances", "reason": "max 10" } ]
  }
}
```
Nullable fields are always **present with `null`** (never omitted) inside `data`.

### 4.2 Error codes

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad/missing input (**override FastAPI's default 422** so this code/shape is used) |
| 401 | `UNAUTHENTICATED` | Missing/expired token or bad credentials (frontend → refresh once, then login) |
| 403 | `FORBIDDEN` | Role lacks permission |
| 404 | `NOT_FOUND` | Entity or route missing (also `/system/mock/spike` when demo controls are off) |
| 409 | `CONFLICT` | State conflict: approving a non-pending action; accepting a non-`NEW` recommendation; creating an action while another is in progress for the same resource |
| 422 | `POLICY_VIOLATION` / `BUDGET_EXCEEDED` | Re-validation failed at approve time (§10.6) |
| 429 | `RATE_LIMITED` | AI endpoints: 20 req/min/user |
| 502 | `PROVIDER_ERROR` | Cloud provider call failed |
| 500 | `INTERNAL_ERROR` | Anything else (never leak stack traces) |

### 4.3 FastAPI implementation contract (copy this pattern — Person 2 creates it in M0)

```python
# app/schemas/base.py
from typing import Generic, TypeVar
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")

class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

class PageMeta(CamelModel):
    page: int; page_size: int; total: int; total_pages: int

class ApiResponse(CamelModel, Generic[T]):        # single object / plain array — NO meta key
    success: bool = True
    data: T

class PagedResponse(CamelModel, Generic[T]):      # paginated list — meta required
    success: bool = True
    data: list[T]
    meta: PageMeta
```
```python
# app/core/errors.py  (+ register handlers in main.py)
class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, details: list[dict] | None = None): ...
# main.py handlers — ALL emit the §4.1 error envelope:
#   ApiError · RequestValidationError → 400 VALIDATION_ERROR · StarletteHTTPException (404 etc.)
#   · unhandled Exception → 500 INTERNAL_ERROR
# FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json", redirect_slashes=False)
# Do NOT use response_model_exclude_none (nullable fields must stay in the payload).
# Permission guard: Depends(require("actions.request")) → ApiError(403, "FORBIDDEN", ...)
```

---

## 5. Database schema (PostgreSQL 16, Alembic — **Person 2 is the only migration author**)

All tables: `id UUID PK` (Python `uuid4`, or `uuid5` for seeds §11), `created_at`, `updated_at` (`timestamptz`) unless noted.

| Table | Key columns |
|---|---|
| `users` | email (unique), password_hash (argon2), name, role (`ADMIN\|MANAGER\|DEVOPS\|VIEWER`), active |
| `refresh_tokens` | user_id FK, jti (unique), expires_at, revoked_at — used only for logout revocation (no rotation) |
| `cloud_accounts` | provider (`AWS\|AZURE\|GCP`), name, external_account_id, regions text[], credentials_encrypted (Fernet; **never returned or logged**), mode (`MOCK\|LIVE`), status (`CONNECTED\|ERROR\|SYNCING`), last_synced_at |
| `resources` | cloud_account_id FK (cascade), provider, external_id, name, type, region, status, health, size, quantity, min_quantity, max_quantity, supported_actions text[], storage_gb, monthly_cost_usd, tags JSONB, metadata JSONB, last_seen_at · unique (cloud_account_id, external_id). **For MOCK accounts this table doubles as the virtual cloud's state** (§10.1) |
| `metrics` | resource_id FK (cascade), metric, ts, value · **PK (resource_id, metric, ts)** + index (resource_id, metric, ts DESC). No id/updated_at. Raw retention 14 days |
| `costs` | cloud_account_id, resource_id (nullable), provider, service, usage_date (date), amount_usd, tags JSONB · unique (cloud_account_id, resource_id, service, usage_date) · index (usage_date, provider) |
| `price_catalog` | provider, region, resource_type, size, vcpu, memory_gb, hourly_price_usd (storage rows: size=`per_gb_month`) |
| `anomalies` | kind, resource_id (nullable), severity, metric, expected_value, observed_value, detected_at, status (`OPEN\|ACKNOWLEDGED\|RESOLVED`) · partial unique (coalesce(resource_id, zero-uuid), metric) WHERE status='OPEN' |
| `recommendations` | resource_id FK (cascade), type, status, title, summary, confidence, severity, reason JSONB, proposed_action JSONB, cost_impact JSONB (snapshot at creation), expires_at, dismissed_at, dismissed_by · partial unique (resource_id, type) WHERE status='NEW'. **No `policy_check` column** — computed per requesting user at read time |
| `policies` | name, type (`SAFETY_LIMIT\|APPROVAL_RULE`), enabled, priority, scope JSONB, rules JSONB |
| `budgets` | name, scope (`GLOBAL\|PROVIDER\|ACCOUNT\|TAG`), scope_value, amount_usd, period (`MONTHLY`), alert_thresholds int[], hard_limit bool |
| `actions` | resource_id (**nullable**, FK ON DELETE SET NULL), resource_name (denormalized), recommendation_id (nullable), type, params JSONB, status, requested_by, approved_by, validation JSONB, cost_impact JSONB, provider_operation_id, result JSONB, error, idempotency_key, executed_at · **unique (requested_by, idempotency_key)** · **partial unique (resource_id) WHERE status IN ('PENDING_APPROVAL','APPROVED','EXECUTING')** (one in-flight action per resource) |
| `alerts` | severity, source, title, message, resource_id (nullable, SET NULL), anomaly_id, status |
| `notifications` | user_id, channel, title, body, entity_type, entity_id, read_at, sent_at, delivery_status — one row per (user, channel); the in-app inbox = rows with `channel=IN_APP` |
| `notification_settings` | user_id, channel, enabled, events text[], destination |
| `audit_logs` | actor_id (nullable = SYSTEM), action, entity_type, entity_id, before JSONB, after JSONB, ip, ts — **append-only** |
| `ai_conversations` | user_id, messages JSONB |

Need an extra column/table? → CONTRACT GAP (§20). `resources.metadata` / `tags` JSONB exist for extensibility.

---

## 6. Shared types & enums (source of truth → copy to `frontend/src/api/types.ts`; backend Pydantic models mirror them 1:1)

### 6.1 Enums & envelope

```ts
export type Role = 'ADMIN' | 'MANAGER' | 'DEVOPS' | 'VIEWER';   // privilege order: VIEWER < DEVOPS < MANAGER < ADMIN
export type Provider = 'AWS' | 'AZURE' | 'GCP';
export type ResourceType = 'COMPUTE' | 'DATABASE' | 'STORAGE' | 'LOAD_BALANCER' | 'CONTAINER';
export type ResourceStatus = 'RUNNING' | 'STOPPED' | 'PROVISIONING' | 'ERROR';
export type Health = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

export type RecommendationType =
  'SCALE_UP' | 'SCALE_DOWN' | 'RIGHT_SIZE' | 'COST_OPTIMIZATION' | 'RESOURCE_ALLOCATION';
export type RecommendationStatus = 'NEW' | 'ACCEPTED' | 'DISMISSED' | 'EXPIRED';

export type ActionType = 'SCALE_OUT' | 'SCALE_IN' | 'RESIZE' | 'EXPAND_STORAGE' | 'START' | 'STOP';
export type ActionStatus =
  'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED' | 'REJECTED' | 'BLOCKED' | 'CANCELLED';

export type PolicyType = 'SAFETY_LIMIT' | 'APPROVAL_RULE';
export type AnomalyKind = 'TRAFFIC' | 'COST' | 'LATENCY' | 'ERROR_RATE' | 'HEALTH';
export type Channel = 'EMAIL' | 'WHATSAPP' | 'IN_APP';
export type NotificationEvent =
  'ALERT_CREATED' | 'RECOMMENDATION_CREATED' | 'APPROVAL_REQUESTED' | 'ACTION_COMPLETED' |
  'ACTION_FAILED' | 'BUDGET_THRESHOLD' | 'COST_ANOMALY';
export type Interval = '1m' | '5m' | '15m' | '1h' | '1d';
export type ErrorCode =
  'VALIDATION_ERROR' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' |
  'POLICY_VIOLATION' | 'BUDGET_EXCEEDED' | 'RATE_LIMITED' | 'PROVIDER_ERROR' | 'INTERNAL_ERROR';

export interface PageMeta { page: number; pageSize: number; total: number; totalPages: number }
export interface ApiSuccess<T> { success: true; data: T }
export interface ApiList<T>    { success: true; data: T[]; meta: PageMeta }
export interface ApiFailure    { success: false; error: { code: ErrorCode; message: string; details?: { field?: string; reason: string }[] } }
```

### 6.2 Canonical metric names (only these; unit is fixed)

| `metric` | unit | Meaning | Applies to | Downsample |
|---|---|---|---|---|
| `cpu_utilization` | percent | CPU | COMPUTE, DATABASE, CONTAINER | avg |
| `memory_utilization` | percent | Memory | COMPUTE, DATABASE, CONTAINER | avg |
| `request_rate` | req_per_sec | **Traffic** | COMPUTE, CONTAINER, LOAD_BALANCER, STORAGE | avg |
| `latency_p50_ms` `latency_p95_ms` `latency_p99_ms` | ms | **Latency** | COMPUTE, CONTAINER, LOAD_BALANCER, DATABASE (p95 only) | avg |
| `error_rate` | percent | 5xx / failures | COMPUTE, CONTAINER, LOAD_BALANCER, STORAGE, DATABASE | avg |
| `storage_used_gb` | gb | **Storage** used | DATABASE, STORAGE | last |
| `storage_utilization` | percent | Storage % used | DATABASE, STORAGE | last |
| `network_in_mbps` `network_out_mbps` | mbps | Network | COMPUTE, CONTAINER, LOAD_BALANCER | avg |
| `uptime_percent` | percent | **Uptime** (per bucket) | all | avg |
| `instance_count` | count | Running instances | COMPUTE, CONTAINER | max |

A metric that doesn't apply to the resource type → empty `points: []` series (not an error).
`from/to/interval` producing more than **500 points** → `400 VALIDATION_ERROR`. `interval` omitted: range ≤1h→`1m`, ≤6h→`5m`, ≤48h→`15m`, ≤7d→`1h`, else `1d`. Default range when `from/to` omitted: metrics = last 1 h; costs = month-to-date.

### 6.3 Core models

```ts
export type Permission =
  | 'resources.read' | 'metrics.read' | 'costs.read' | 'recommendations.read' | 'actions.read'
  | 'policies.read' | 'ai.use'
  | 'actions.request'
  | 'actions.approve' | 'budgets.write' | 'audit.read' | 'resources.manage'
  | 'policies.write' | 'accounts.manage' | 'users.manage';

export interface User {
  id: string; email: string; name: string; role: Role; active: boolean;
  permissions: Permission[];           // §12 — frontend uses this to show/hide UI
}

export type CloudCredentials =         // WRITE-ONLY (request bodies); never returned by any endpoint
  | { provider: 'AWS'; authType: 'ACCESS_KEY'; accessKeyId: string; secretAccessKey: string }
  | { provider: 'AWS'; authType: 'ASSUME_ROLE'; roleArn: string; externalId: string }
  | { provider: 'AZURE'; tenantId: string; clientId: string; clientSecret: string; subscriptionId: string }
  | { provider: 'GCP'; projectId: string; serviceAccountJson: string };

export interface CloudAccount {
  id: string; provider: Provider; name: string; externalAccountId: string;
  regions: string[]; mode: 'MOCK' | 'LIVE';
  status: 'CONNECTED' | 'ERROR' | 'SYNCING'; lastSyncedAt: string | null;
  resourceCount: number;
}

export interface Resource {
  id: string; accountId: string; provider: Provider; externalId: string;
  name: string; type: ResourceType; region: string;
  status: ResourceStatus; health: Health;
  size: string;                 // "t3.medium" | "Standard_D2s_v3" | "e2-medium" ...
  quantity: number;             // current instance count (ASG desired / VMSS / MIG size)
  minQuantity: number; maxQuantity: number;   // hard safety bounds, always enforced
  supportedActions: ActionType[];             // UI offers only these; empty = read-only resource
  storageGb: number | null;
  monthlyCostUsd: number;
  tags: Record<string, string>;
  latest: {                     // snapshot for list views (no extra call needed)
    cpuUtilization: number | null; memoryUtilization: number | null;
    requestRate: number | null; latencyP95Ms: number | null;
    errorRate: number | null; storageUtilization: number | null;
  };
  lastSeenAt: string;
}
export interface ResourcePatch { tags?: Record<string, string>; minQuantity?: number; maxQuantity?: number }

export interface MetricPoint { t: string; v: number }
export interface MetricSeries { metric: string; unit: string; points: MetricPoint[] }

export interface MoneyImpact {
  currentMonthlyCostUsd: number;
  projectedMonthlyCostUsd: number;
  deltaMonthlyUsd: number;           // projected - current (negative = saving)
  deltaPercent: number;
  budget: {                          // the TIGHTEST matching budget (highest afterChange/limit); null if none match
    name: string; limitUsd: number; usedUsd: number; afterChangeUsd: number; withinBudget: boolean
  } | null;
}

export interface ProposedAction {
  type: ActionType;
  params: {
    targetInstances?: number;        // SCALE_OUT / SCALE_IN
    targetSize?: string;             // RESIZE
    targetStorageGb?: number;        // EXPAND_STORAGE
  };                                 // START / STOP → {}
}

export interface ValidationResult {
  allowed: boolean;                  // false → cannot proceed (BLOCKED)
  requiresApproval: boolean;         // true → needs approverRole
  approverRole: Role | null;         // minimum role that may approve
  checks: {
    name: 'PERMISSION' | 'POLICY' | 'BUDGET' | 'APPROVAL';
    passed: boolean;
    message: string;                 // human-readable — show as-is in the UI ("Warning: …" = soft budget)
  }[];
}

export interface Recommendation {
  id: string; resourceId: string; resourceName: string; provider: Provider;
  type: RecommendationType; status: RecommendationStatus;
  title: string; summary: string;
  confidence: number;                // 0-100
  severity: Severity;
  reason: { metric: string; observed: number; threshold: number; window: string }[];
  proposedAction: ProposedAction;
  costImpact: MoneyImpact;
  policyCheck: ValidationResult;     // computed at read time for the *requesting user's role*
  createdAt: string; expiresAt: string;
}

export interface Action {
  id: string; resourceId: string | null; resourceName: string; recommendationId: string | null;
  type: ActionType; params: ProposedAction['params'];
  status: ActionStatus;
  requestedBy: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;   // set when approval was required (explicit, or requester's role ≥ approverRole); null if no approval rule matched
  validation: ValidationResult;
  costImpact: MoneyImpact;
  result: { message: string; providerOperationId?: string } | null;
  error: string | null;
  createdAt: string; executedAt: string | null;
}

export interface Alert {
  id: string; severity: Severity; title: string; message: string;
  source: 'ANOMALY' | 'HEALTH' | 'BUDGET' | 'ACTION' | 'SYSTEM';
  resourceId: string | null; status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'; createdAt: string;
}

export interface Anomaly {
  id: string; kind: AnomalyKind; severity: Severity; resourceId: string | null; resourceName: string | null;
  metric: string; expectedValue: number; observedValue: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'; detectedAt: string;
}

export interface Policy {
  id: string; name: string; type: PolicyType; enabled: boolean; priority: number;   // all matching policies apply; priority only orders display/messages
  scope: { provider?: Provider; accountId?: string; resourceType?: ResourceType; tags?: Record<string, string> };
  rules: SafetyLimitRules | ApprovalRules;
}
export interface SafetyLimitRules {
  maxInstances?: number; minInstances?: number;
  maxScaleStepPercent?: number;             // max |target-current|/current per single action
  maxCostIncreasePerActionUsd?: number;     // max positive monthly delta per single action
  blockedActions?: ActionType[];
  allowedWindows?: { days: number[]; startHour: number; endHour: number; timezone: string }[];  // days 0=Sun..6=Sat
}
export interface ApprovalRules {
  requireApprovalWhen: { costDeltaMonthlyUsdGt?: number; actionTypeIn?: ActionType[] };  // OR-combined
  approverRole: 'MANAGER' | 'ADMIN';
}

export interface Budget {
  id: string; name: string; scope: 'GLOBAL' | 'PROVIDER' | 'ACCOUNT' | 'TAG';
  scopeValue: string | null;                // PROVIDER: "AWS" · ACCOUNT: accountId · TAG: "key:value" · GLOBAL: null
  amountUsd: number; period: 'MONTHLY'; alertThresholds: number[]; hardLimit: boolean;
  usedUsd: number; usedPercent: number; forecastUsd: number;   // computed by backend (month-to-date / forecast)
}

export interface Notification {
  id: string; channel: Channel; title: string; body: string;
  entityType: string | null; entityId: string | null; readAt: string | null; createdAt: string;
}
export interface NotificationSetting { channel: Channel; enabled: boolean; events: NotificationEvent[]; destination: string | null }
export interface AuditLog {
  id: string; actor: { id: string; name: string } | null; action: string; entityType: string; entityId: string | null;
  before: Record<string, unknown> | null; after: Record<string, unknown> | null; ts: string;
}
```

### 6.4 Endpoint payload types

```ts
export interface LoginResponse { accessToken: string; refreshToken: string; expiresIn: number; user: User }

export interface DashboardOverview {
  resources: { total: number; byHealth: Record<Health, number>; byProvider: Record<Provider, number> };
  traffic: { requestRate: number; changePercent: number };
  latency: { p95Ms: number; changePercent: number };
  uptime: { percent: number };
  storage: { usedGb: number; totalGb: number; utilizationPercent: number };
  cost: { monthToDateUsd: number; forecastEndOfMonthUsd: number; budgetUsd: number; budgetUsedPercent: number };
  counts: { openAlerts: number; newRecommendations: number; pendingApprovals: number };
}
export interface MetricsSummary {
  traffic: { avg: number; peak: number; changePercent: number };
  latency: { p50Ms: number; p95Ms: number; p99Ms: number };
  uptimePercent: number; errorRate: number;
  storage: { usedGb: number; totalGb: number; utilizationPercent: number };
  healthCounts: Record<Health, number>;
}
export interface ResourceMetrics { resourceId: string; interval: Interval; series: MetricSeries[] }
export interface GroupedSeries { key: string; points: MetricPoint[] }
export interface MetricsTimeseries { metric: string; unit: string; interval: Interval; series: GroupedSeries[] }
export interface ResourceHealthDetail {
  health: Health; uptimePercent: number; lastIncidentAt: string | null;
  checks: { name: string; status: 'PASS' | 'WARN' | 'FAIL'; message: string }[];
}
export interface ResourceCost { monthToDateUsd: number; forecastUsd: number; dailyCosts: { date: string; amountUsd: number }[] }

export interface CostSummary {
  monthToDateUsd: number; forecastEndOfMonthUsd: number; lastMonthUsd: number; changePercent: number;
  budgetUsd: number; budgetUsedPercent: number; currency: 'USD';
}
export interface CostTimeseries { interval: Interval; series: GroupedSeries[] }          // v = USD
export interface CostBreakdownItem { key: string; label: string; amountUsd: number; percent: number }
export interface CostForecast { points: { date: string; amountUsd: number; lower: number; upper: number }[]; endOfMonthUsd: number }
export interface BillingStatement {
  id: string; accountId: string; provider: Provider; period: string;   // "2026-08"
  totalUsd: number; status: 'OPEN' | 'FINAL' | 'PAID'; lines: { service: string; amountUsd: number }[];
}
export interface Trend { metric: string; slope: number; direction: 'UP' | 'DOWN' | 'FLAT'; changePercent: number; forecastNext24h: number }

export type SuggestedAction =
  | { label: string; type: 'OPEN_RESOURCE';       payload: { resourceId: string } }
  | { label: string; type: 'OPEN_RECOMMENDATION'; payload: { recommendationId: string } }
  | { label: string; type: 'PREVIEW_ACTION';      payload: { resourceId: string; type: ActionType; params: ProposedAction['params'] } };
export interface AiExplanation { explanation: string; keyPoints: string[]; generatedAt: string }
export interface AiSummary { summary: string; highlights: string[]; generatedAt: string }
export interface AiChatReply { conversationId: string; reply: string; suggestedActions: SuggestedAction[] }

export interface SystemHealth { status: 'UP' | 'DEGRADED'; db: 'UP' | 'DOWN'; version: string; providerMode: 'MOCK' | 'LIVE'; demoControls: boolean }
```

### 6.5 WebSocket message types

```ts
export interface RecommendationEvent { recommendationId: string; resourceId: string; resourceName: string; type: RecommendationType; title: string; severity: Severity }
export type WsServerMessage =
  | { event: 'metric.updated';           channel: string; ts: string; data: { resourceId: string; metric: string; unit: string; point: MetricPoint } }
  | { event: 'dashboard.updated';        channel: 'dashboard'; ts: string; data: Record<string, never> }
  | { event: 'resource.health_changed';  channel: 'dashboard'; ts: string; data: { resourceId: string; from: Health; to: Health } }
  | { event: 'anomaly.detected';         channel: 'alerts'; ts: string; data: Anomaly }
  | { event: 'alert.created' | 'alert.resolved'; channel: 'alerts'; ts: string; data: Alert }
  | { event: 'recommendation.created';   channel: 'recommendations'; ts: string; data: RecommendationEvent }
  | { event: 'action.status_changed';    channel: 'actions'; ts: string; data: { actionId: string; status: ActionStatus; message: string } }
  | { event: 'notification.created';     channel: 'user'; ts: string; data: Notification }
  | { event: 'pong';                     channel: 'system'; ts: string; data: Record<string, never> };
export type WsClientMessage =
  | { action: 'subscribe' | 'unsubscribe'; channels: string[] }
  | { action: 'ping' };
```

---

## 7. REST API

> 🔒 = needs auth · `perm` = required permission (§12; missing → `403 FORBIDDEN`). Envelope per §4.1; only `data` is shown. Paths are relative to `/api/v1`. **Owner** = the person who implements the endpoint (§16.1).

### 7.1 Auth — *Owner: P2*

| Method | Path | Body | `data` |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `LoginResponse` (bad credentials → 401; inactive user → 403) |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken, expiresIn }` — returns a **new access token and the same refresh token** (no rotation, so multiple tabs can't invalidate each other) |
| POST 🔒 | `/auth/logout` | `{ refreshToken }` | `{ loggedOut: true }` (revokes it) |
| GET 🔒 | `/auth/me` | – | `User` |

JWT claims: `sub`, `role` (informational), `exp`, `jti`. Access token 15 min, refresh token 7 days.

### 7.2 Dashboard — *Owner: P3*

`GET /dashboard/overview` 🔒 `metrics.read` — query `?provider=` → `DashboardOverview`. Example:
```json
{
  "resources": { "total": 14, "byHealth": { "HEALTHY": 11, "DEGRADED": 2, "UNHEALTHY": 1, "UNKNOWN": 0 },
                 "byProvider": { "AWS": 6, "AZURE": 4, "GCP": 4 } },
  "traffic":   { "requestRate": 1840.5, "changePercent": 62.3 },
  "latency":   { "p95Ms": 312, "changePercent": 18.4 },
  "uptime":    { "percent": 99.95 },
  "storage":   { "usedGb": 6860, "totalGb": 9800, "utilizationPercent": 70.0 },
  "cost":      { "monthToDateUsd": 1879.42, "forecastEndOfMonthUsd": 2968.10,
                 "budgetUsd": 3500, "budgetUsedPercent": 53.7 },
  "counts":    { "openAlerts": 3, "newRecommendations": 5, "pendingApprovals": 2 }
}
```
`changePercent` (traffic/latency) = last 15 min average vs the preceding 60 min average. `budgetUsd` = the GLOBAL budget (0 if none). Numbers are illustrative.

### 7.3 Cloud accounts — *Owner: P2*

| Method | Path | perm | Body / Query | `data` |
|---|---|---|---|---|
| GET | `/cloud-accounts` | `resources.read` | – | `CloudAccount[]` |
| POST (201) | `/cloud-accounts` | `accounts.manage` | `{ provider, name, externalAccountId, regions: string[], mode, credentials?: CloudCredentials }` — `credentials` required when `mode=LIVE` (validated via the adapter; invalid → 400). Triggers an initial sync | `CloudAccount` |
| POST | `/cloud-accounts/{id}/sync` | `accounts.manage` | – | `{ status: "SYNCING" }` |
| DELETE | `/cloud-accounts/{id}` | `accounts.manage` | – | `{ deleted: true }` (cascades its resources/metrics; action history is kept) |

### 7.4 Resources — *Owner: P3*

| Method | Path | perm | Query / Body | `data` |
|---|---|---|---|---|
| GET | `/resources` | `resources.read` | `provider, accountId, type, status, health, region, search, tag=key:value, page, pageSize, sort` (default `name,asc`) | `Resource[]` + `meta` |
| GET | `/resources/{id}` | `resources.read` | – | `Resource` |
| PATCH | `/resources/{id}` | `resources.manage` | `ResourcePatch` — new bounds must satisfy `minQuantity ≤ quantity ≤ maxQuantity`, else 400. Audited | `Resource` |
| GET | `/resources/{id}/metrics` | `metrics.read` | `metric=cpu_utilization,request_rate&from&to&interval` | `ResourceMetrics` |
| GET | `/resources/{id}/health` | `metrics.read` | – | `ResourceHealthDetail` |
| GET | `/resources/{id}/cost` | `costs.read` | `from&to` | `ResourceCost` |

### 7.5 Monitoring (fleet-level) — *Owner: P3*

| Method | Path | perm | Query | `data` |
|---|---|---|---|---|
| GET | `/metrics/summary` | `metrics.read` | `from,to,provider,accountId` | `MetricsSummary` |
| GET | `/metrics/timeseries` | `metrics.read` | `metric, from, to, interval, groupBy=none\|provider\|resourceType, provider` | `MetricsTimeseries` (`key` = `"all"` when `groupBy=none`) |

### 7.6 Costs & billing — *Owner: P3*

| Method | Path | perm | Query | `data` |
|---|---|---|---|---|
| GET | `/costs/summary` | `costs.read` | `from,to,provider,accountId` | `CostSummary` — `lastMonthUsd` = full previous month; `changePercent` = month-to-date vs the same elapsed days last month |
| GET | `/costs/timeseries` | `costs.read` | `from,to,interval=1d,groupBy=none\|provider\|service\|account` | `CostTimeseries` |
| GET | `/costs/breakdown` | `costs.read` | `from,to,groupBy=service\|provider\|resource\|account, limit` | `CostBreakdownItem[]` |
| GET | `/costs/forecast` | `costs.read` | `horizonDays=30` | `CostForecast` |
| GET | `/billing/statements` | `costs.read` | `accountId, year` | `BillingStatement[]` (derived from `costs` in MVP) |

### 7.7 Analytics (anomalies & trends) — *Owner: P3*

| Method | Path | perm | Query / Body | `data` |
|---|---|---|---|---|
| GET | `/anomalies` | `metrics.read` | `kind, severity, status, resourceId, from, to, page` | `Anomaly[]` + `meta` (cost anomalies = `kind=COST`) |
| POST | `/anomalies/{id}/acknowledge` | `actions.request` | – | `Anomaly` |
| GET | `/analytics/trends` | `metrics.read` | `metric, resourceId?, window=7d` | `Trend` |

### 7.8 Recommendations — *Owner: P2 (router) · rows are generated by P3's engine*

| Method | Path | perm | Query / Body | `data` |
|---|---|---|---|---|
| GET | `/recommendations` | `recommendations.read` | `status, type, resourceId, provider, page, pageSize` (newest first) | `Recommendation[]` + `meta` |
| GET | `/recommendations/{id}` | `recommendations.read` | – | `Recommendation` |
| POST (201) | `/recommendations/{id}/accept` | `actions.request` | – | `Action`. Recommendation becomes `ACCEPTED` **unless** the resulting action is `BLOCKED` (then it stays `NEW`). Not `NEW` or past `expiresAt` → 409 |
| POST | `/recommendations/{id}/dismiss` | `actions.request` | `{ reason?: string }` | `Recommendation` (1 h cool-down before the same type is recreated for that resource) |

> Each recommendation already carries `costImpact` and `policyCheck`, so the review screen needs **no extra calls** (except the optional AI explanation).

### 7.9 Actions (validate → approve → execute) — *Owner: P2*

| Method | Path | perm | Body | `data` |
|---|---|---|---|---|
| POST | `/actions/preview` | `actions.request` | `{ resourceId, type, params }` | `{ costImpact: MoneyImpact, validation: ValidationResult }` — **dry run: changes nothing, writes no audit row, ignores the in-flight-action rule** |
| POST (201) | `/actions` | `actions.request` | `{ resourceId, type, params, recommendationId? }` + header `Idempotency-Key` | `Action` |
| GET | `/actions` | `actions.read` | `status, resourceId, requestedBy, page, pageSize` (newest first) | `Action[]` + `meta` |
| GET | `/actions/{id}` | `actions.read` | – | `Action` |
| POST | `/actions/{id}/approve` | `actions.approve` (and role ≥ `validation.approverRole`) | `{ comment?: string }` | `Action` |
| POST | `/actions/{id}/reject` | `actions.approve` | `{ reason: string }` | `Action` |
| POST | `/actions/{id}/cancel` | `actions.request` (requester only) | – | `Action` (only from `PENDING_APPROVAL`) |

`POST /actions` returns an `Action` (after input validation and the permission guard). The UI reads `action.status`:
- `BLOCKED` → show every `validation.checks[].message`; nothing executed.
- `PENDING_APPROVAL` → show "Waiting for {approverRole}".
- `EXECUTING` (or `APPROVED` momentarily) → track via WebSocket `action.status_changed` (fallback: poll `GET /actions/{id}` every 3 s).
- A second action on a resource that already has one in flight → `409 CONFLICT`.

**Action state machine**
```
create ─┬─ BLOCKED                                   (terminal — validation failed)
        ├─ PENDING_APPROVAL ─ approve → APPROVED → EXECUTING → SUCCEEDED | FAILED
        │        ├─ reject → REJECTED                (terminal)
        │        └─ cancel → CANCELLED               (terminal)
        └─ APPROVED (no approval needed) → EXECUTING → SUCCEEDED | FAILED
```

### 7.10 Policies & budgets — *Owner: P2*

| Method | Path | perm | Body | `data` |
|---|---|---|---|---|
| GET | `/policies` | `policies.read` | – | `Policy[]` |
| POST (201) | `/policies` | `policies.write` | `Omit<Policy,'id'>` | `Policy` |
| PATCH | `/policies/{id}` | `policies.write` | partial `Policy` | `Policy` |
| DELETE | `/policies/{id}` | `policies.write` | – | `{ deleted: true }` |
| GET | `/budgets` | `policies.read` | – | `Budget[]` |
| POST (201) | `/budgets` | `budgets.write` | `Omit<Budget,'id'\|'usedUsd'\|'usedPercent'\|'forecastUsd'>` | `Budget` |
| PATCH | `/budgets/{id}` | `budgets.write` | partial | `Budget` |
| DELETE | `/budgets/{id}` | `budgets.write` | – | `{ deleted: true }` |
| GET | `/rbac/roles` | `policies.read` | – | `{ role: Role, permissions: Permission[] }[]` |

### 7.11 Alerts, notifications, settings — *Owner: P2*

| Method | Path | perm | Notes | `data` |
|---|---|---|---|---|
| GET | `/alerts` | `metrics.read` | `status, severity, page` | `Alert[]` + `meta` |
| POST | `/alerts/{id}/acknowledge` · `/alerts/{id}/resolve` | `actions.request` | – | `Alert` |
| GET | `/notifications` | own | `unread=true, page` (IN_APP inbox) | `Notification[]` + `meta` |
| POST | `/notifications/{id}/read` | own | – | `Notification` |
| POST | `/notifications/read-all` | own | – | `{ updated: number }` |
| GET | `/notification-settings` | own | – | `NotificationSetting[]` |
| PUT | `/notification-settings` | own | `NotificationSetting[]` | `NotificationSetting[]` |
| POST | `/notification-settings/test` | own | `{ channel }` | `{ sent: true }` |

### 7.12 AI layer — *Owner: P3*

> **Rule:** the LLM only **explains / summarizes / answers**. It may *suggest* an action, but the user must still go through `/actions` (§7.9). Numbers shown come from the engines, never invented by the LLM.

| Method | Path | perm | Body | `data` |
|---|---|---|---|---|
| POST | `/ai/explain` | `ai.use` | `{ entityType: "RECOMMENDATION"\|"ACTION"\|"ANOMALY", entityId }` | `AiExplanation` |
| POST | `/ai/summarize` | `ai.use` | `{ scope: "DASHBOARD"\|"COSTS"\|"RESOURCE", resourceId?, from?, to? }` | `AiSummary` |
| POST | `/ai/chat` | `ai.use` | `{ message: string, conversationId?: string }` | `AiChatReply` |

### 7.13 Users, audit, system — *Owner: P2 (except the spike route: P3)*

| Method | Path | perm | `data` |
|---|---|---|---|
| GET | `/users` | `users.manage` | `User[]` |
| POST (201) | `/users` | `users.manage` | body `{ email, name, role, password }` → `User` |
| PATCH | `/users/{id}` | `users.manage` | body partial `{ name, role, active, password }` → `User` |
| DELETE | `/users/{id}` | `users.manage` | `{ deleted: true }` |
| GET | `/audit-logs` | `audit.read` | `AuditLog[]` + `meta`; query `actorId, entityType, from, to, page` |
| GET | `/system/health` | none | `SystemHealth` (`demoControls` = `ENABLE_DEMO_CONTROLS`; used by the Docker healthcheck) |
| POST | `/system/mock/spike` *(P3)* | `actions.request`, **only when `ENABLE_DEMO_CONTROLS=true`** (else 404) | query `resourceId, multiplier=1.6, minutes=30` → `{ started: true }` |

---

## 8. Worked example — the main workflow with real payloads

Price basis: `t3.medium` = $0.0416/h → **$30.37/instance/month** (×730 h). These numbers are used in seeds, mocks and the smoke test. Usage figures (budget `usedUsd`) are illustrative; the `costImpact` math is exact.

**① Backend detects a traffic spike → creates a recommendation** (and pushes WS `anomaly.detected` + `recommendation.created`).

`GET /recommendations/7c1f0a52-3a9b-4c4e-9f10-6d5f0d7f1a11` (as `devops`) →
```json
{
  "success": true,
  "data": {
    "id": "7c1f0a52-3a9b-4c4e-9f10-6d5f0d7f1a11",
    "resourceId": "b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30",
    "resourceName": "checkout-api",
    "provider": "AWS",
    "type": "SCALE_UP",
    "status": "NEW",
    "title": "Scale checkout-api from 4 to 6 instances",
    "summary": "Traffic is up 62% in the last few minutes and CPU is above 80%.",
    "confidence": 91,
    "severity": "WARNING",
    "reason": [
      { "metric": "request_rate", "observed": 1840.5, "threshold": 1701.9, "window": "3m" },
      { "metric": "cpu_utilization", "observed": 84.2, "threshold": 75, "window": "3m" }
    ],
    "proposedAction": { "type": "SCALE_OUT", "params": { "targetInstances": 6 } },
    "costImpact": {
      "currentMonthlyCostUsd": 121.47,
      "projectedMonthlyCostUsd": 182.21,
      "deltaMonthlyUsd": 60.74,
      "deltaPercent": 50.0,
      "budget": { "name": "Production AWS", "limitUsd": 1000, "usedUsd": 477.52, "afterChangeUsd": 538.26, "withinBudget": true }
    },
    "policyCheck": {
      "allowed": true, "requiresApproval": false, "approverRole": null,
      "checks": [
        { "name": "PERMISSION", "passed": true, "message": "You can request scaling actions." },
        { "name": "POLICY", "passed": true, "message": "6 instances is within the safety limit (max 10)." },
        { "name": "BUDGET", "passed": true, "message": "Stays within the Production AWS budget." },
        { "name": "APPROVAL", "passed": true, "message": "No manager approval needed (increase is under $100/month)." }
      ]
    },
    "createdAt": "2026-09-19T10:31:00Z",
    "expiresAt": "2026-09-19T11:31:00Z"
  }
}
```

**② User clicks "Apply"** → `POST /recommendations/{id}/accept` (or `POST /actions`) → `201`:
```json
{ "success": true, "data": {
  "id": "e91d3c7a-58b1-4f0e-a2c4-1b9d6f4a7c22", "resourceId": "b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30",
  "resourceName": "checkout-api", "recommendationId": "7c1f0a52-3a9b-4c4e-9f10-6d5f0d7f1a11",
  "type": "SCALE_OUT", "params": { "targetInstances": 6 },
  "status": "EXECUTING",
  "requestedBy": { "id": "3d2f6b1e-7a44-4c0d-9e8b-5a1c2f9d0e33", "name": "Dev Ops" }, "approvedBy": null,
  "validation": { "allowed": true, "requiresApproval": false, "approverRole": null, "checks": [
    { "name": "PERMISSION", "passed": true, "message": "You can request scaling actions." },
    { "name": "POLICY", "passed": true, "message": "6 instances is within the safety limit (max 10)." },
    { "name": "BUDGET", "passed": true, "message": "Stays within the Production AWS budget." },
    { "name": "APPROVAL", "passed": true, "message": "No manager approval needed (increase is under $100/month)." } ] },
  "costImpact": { "currentMonthlyCostUsd": 121.47, "projectedMonthlyCostUsd": 182.21, "deltaMonthlyUsd": 60.74, "deltaPercent": 50.0,
                  "budget": { "name": "Production AWS", "limitUsd": 1000, "usedUsd": 477.52, "afterChangeUsd": 538.26, "withinBudget": true } },
  "result": null, "error": null, "createdAt": "2026-09-19T10:32:10Z", "executedAt": null
} }
```

**③ Blocked** (target 12 > max 10) → `201`, `status: "BLOCKED"`:
```json
"validation": { "allowed": false, "requiresApproval": false, "approverRole": null,
  "checks": [ { "name": "POLICY", "passed": false, "message": "Scaling to 12 instances exceeds the safety limit of 10." } ] }
```

**④ Needs approval** (target 10 → +$182.21/month > the $100 rule, requester is `DEVOPS`) → `status: "PENDING_APPROVAL"`, `validation.requiresApproval: true`, `approverRole: "MANAGER"`, APPROVAL check message `"Cost increase of $182.21/month needs Manager approval."`. A Manager/Admin then calls `POST /actions/{id}/approve`.

**⑤ Execution finishes** → WS `action.status_changed` → `{ "actionId": "e91d3c7a-…", "status": "SUCCEEDED", "message": "checkout-api scaled to 6 instances" }`.

---

## 9. WebSocket contract

**URL:** `/ws?token=<accessToken>` (browser builds `ws(s)://<host>/ws` unless `VITE_WS_URL` is set). Message shapes: §6.5.
**Auth failure / expired token:** server closes with code **4401** → client refreshes the token (§7.1) and reconnects. The client also reconnects whenever it refreshes the access token.

**Client → server**
```json
{ "action": "subscribe",   "channels": ["dashboard", "alerts", "actions", "recommendations", "resource:b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30"] }
{ "action": "unsubscribe", "channels": ["resource:b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30"] }
{ "action": "ping" }
```
The per-user channel `user` is subscribed automatically on connect.

**Server → client (always this envelope)**
```json
{ "event": "dashboard.updated", "channel": "dashboard", "ts": "2026-09-19T10:31:05Z", "data": {} }
```

| `event` | Channel | `data` | Published by |
|---|---|---|---|
| `metric.updated` | `resource:{id}` | `{ resourceId, metric, unit, point: { t, v } }` | P3 (ingestion; only if the channel has subscribers) |
| `dashboard.updated` | `dashboard` | `{}` — "refetch dashboard/resources/costs" hint after each ingestion cycle | P3 |
| `resource.health_changed` | `dashboard` | `{ resourceId, from, to }` | P3 |
| `anomaly.detected` | `alerts` | `Anomaly` | P3 |
| `alert.created` / `alert.resolved` | `alerts` | `Alert` | P2 (`AlertsPort`) |
| `recommendation.created` | `recommendations` | `RecommendationEvent` (light; client refetches the list to get per-role `policyCheck`) | P3 |
| `action.status_changed` | `actions` | `{ actionId, status, message }` | P2 (orchestrator) |
| `notification.created` | `user` | `Notification` | P2 |
| `pong` | `system` | `{}` | P2 |

**Rules:** client pings every 25 s · auto-reconnects with backoff (1 s → 30 s) · **on every (re)connect the client re-subscribes and invalidates all active queries** (no missed-event gaps) · if WS is down the frontend **falls back to polling every 15 s** · WS is read-only for the UI (all writes go through REST).

---

## 10. Backend internals (contracts between modules)

### 10.1 Cloud Provider Adapter (P3 implements 4×: `Mock`, `Aws`, `Azure`, `Gcp`)

The ABC, dataclasses and ports live in `app/ports.py` (§16.3). `acc` = the `CloudAccount` ORM row; adapters decrypt credentials themselves via `core.security`.

- Adapters return **normalized** objects (canonical metric names §6.2, enums §6.1). Provider-specific names never leave the adapter.
- **Blocking SDK calls (boto3 etc.) run in `asyncio.to_thread(...)`.** Live SDKs are imported lazily inside methods. Timeouts on every call.
- `AdapterPort.get(account)` returns `MockAdapter` when `account.mode == MOCK` **or** `PROVIDER_MODE=mock`.
- **MockAdapter state = the `resources` table** (mock accounts only): `list_resources` returns the account's rows; `execute` waits ~3 s (simulated) then mutates the row (`quantity`/`size`/`storage_gb`/`status`, recomputes `monthly_cost_usd`) and reports `SUCCEEDED`. A **new MOCK account with no rows gets 3 default resources** (one COMPUTE, one DATABASE, one STORAGE, named `<provider>-…`) on its first sync.
- Cost *estimation* is not an adapter concern — the Cost Engine does it from `price_catalog` (§10.5).
- Live mapping (stretch): **AWS** — EC2 Auto Scaling (`set_desired_capacity`), CloudWatch, Cost Explorer; prefer `ASSUME_ROLE` with ExternalId · **Azure** — VM Scale Sets, Azure Monitor, Cost Management · **GCP** — Managed Instance Groups, Cloud Monitoring, Cloud Billing export (BigQuery).

### 10.2 Ingestion job (P3 — APScheduler, in-process)
Every `INGESTION_INTERVAL_SECONDS` (default **60**), per `CONNECTED` account, concurrently (`asyncio.gather`, 10 s timeout each):
1. `list_resources` → upsert `resources` (P3 is the **only writer** of `resources`) · 2. `get_metrics(last interval)` → bulk-insert `metrics` · 3. recompute health (`resource.health_changed`, alerts) · 4. Analytics (§10.3) · 5. Recommendation Engine (§10.4) · 6. publish `metric.updated` (only for channels with subscribers) and one `dashboard.updated`.
- A failing account → `status=ERROR` + one `SYSTEM` alert (deduped); it recovers automatically on the next success. `cloud_accounts.status/last_synced_at` are written by P3.
- Hourly: `get_costs` → upsert `costs` → budget threshold checks + cost anomalies. Nightly: purge raw `metrics` > 14 days; mark expired recommendations `EXPIRED`.
- `IngestionPort.sync_account(account_id)` runs the same steps for one account in the background (returns immediately); `refresh_resource(resource_id)` re-reads one resource (called by the orchestrator after an action succeeds).

### 10.3 Analytics Engine (P3; defaults configurable via settings)
- Handle **mixed granularity** (5-min backfill + 1-min live): resample to 5-min buckets before computing.
- **Anomaly** (traffic / latency / error rate / cost): z-score against a trailing baseline (metrics: previous 60 min; cost: previous 14 days); flag when `|z| > 3` for 3 consecutive points, or traffic > +50 % vs baseline. One open anomaly per (resource, metric). Resolve automatically when back to normal (+ `AlertsPort.resolve_alerts`).
- **Trend:** linear regression (numpy) over `window`.
- **Health:** `UNHEALTHY` if `error_rate > 5` or `uptime_percent < 99`; `DEGRADED` if `latency_p95 > 2× baseline` or `cpu > 90`; `UNKNOWN` if no data for 5 min; else `HEALTHY`.
- **Alerts** (via `AlertsPort.raise_alert`) for: anomalies (`WARNING/CRITICAL`), health → `UNHEALTHY`, budget threshold crossings (`alertThresholds`; title includes the month + threshold so each fires once), failed ingestion.

### 10.4 Recommendation Engine (P3; defaults)

| Type | Trigger | Proposed action |
|---|---|---|
| `SCALE_UP` | avg cpu > 75 % over the last 3 min **or** avg `request_rate` of the last 3 min > 1.5× the previous-60-min average | `SCALE_OUT` to `ceil(qty × clamp(cpu_3m / 60, 1.25, 2.0))` (aims at ~60 % CPU), capped at `maxQuantity` |
| `SCALE_DOWN` | avg cpu < 25 % and traffic below baseline for 6 h | `SCALE_IN` to `max(minQuantity, min(qty − 1, ceil(qty × cpu_6h / 50)))` |
| `RIGHT_SIZE` | p95 cpu < 40 % and memory < 40 % for 7 d | `RESIZE` to the next smaller size on the ladder (§11) |
| `COST_OPTIMIZATION` | idle (cpu < 5 % for 3 d) and `STOP` supported | `STOP` |
| `RESOURCE_ALLOCATION` | `storage_utilization` > 80 % | `EXPAND_STORAGE` +25 % |

- Propose only actions in the resource's `supportedActions`; skip if target equals current.
- **Respect policies:** before inserting, call `policy_engine.check_limits(...)`; if it fails on a limit, clamp the target to the allowed value and re-check once; if still failing, skip (and log).
- Each recommendation is created **with** `costImpact` (Cost Engine snapshot); `reason` lists every trigger that fired; then `notifier.notify_event("RECOMMENDATION_CREATED")` + WS `recommendation.created`. `policyCheck` is computed at read time by P2.
- Dedupe: one `NEW` per (resource, type). Cool-down: 1 h after dismiss, 15 min after accept. Expiry: 1 h (scale types) / 7 d (others).
- `confidence` (0–100): deterministic — base 60 + up to 39 from how far the metric is past its threshold and how long it persisted; formula documented in code.

### 10.5 Cost Engine (P3 — `provide("cost_engine")`)
- `hourly = unitPriceUsd × quantity` (from `price_catalog`); `monthly = hourly × 730`. Round to 2 decimals only at the end.
- Impact by action: **SCALE_OUT/IN** → price(currentSize)×target − current · **RESIZE** → price(targetSize)×quantity − current · **EXPAND_STORAGE** → (target − current GB) × `per_gb_month` · **STOP** → −current compute cost · **START** → +cost.
- `deltaMonthlyUsd = projected − current` (negative = saving); `deltaPercent = delta / current × 100`.
- Forecast: month-to-date daily average × remaining days, adjusted by the 7-day trend; ± band from stdev.
- **Budget usage:** month-to-date cost of resources matching the budget scope. For every matching budget: `afterChange = used + max(delta, 0)`; `MoneyImpact.budget` reports the tightest.
- All figures are **estimates**; UI labels them "Estimated".

### 10.6 Policy Engine & Action Orchestrator (P2)

**Structural checks first (→ 400, no Action created):** resource exists (404) · action type is in `resource.supportedActions` · params present and typed · target ≠ current (no-op).
**Then rule checks — collect ALL results (no fail-fast) so the UI shows every reason:**
```
1. PERMISSION → user's role has actions.request
2. POLICY     → built-in bounds (resource min/max quantity, target ≥ 1)
                + every enabled SAFETY_LIMIT policy whose scope matches (ALL apply; most restrictive wins):
                  maxInstances / minInstances · maxScaleStepPercent · maxCostIncreasePerActionUsd ·
                  blockedActions · allowedWindows (current time in the window's timezone)
3. BUDGET     → every matching budget: hardLimit && afterChange > amount → FAIL
                (soft budget exceeded → passed=true, message starts with "Warning:")
4. APPROVAL   → every enabled APPROVAL_RULE that matches (costDelta > X OR type in list):
                requiresApproval = true, approverRole = highest role among matched rules
                (if requester's role ≥ approverRole → no extra approval needed; check passes with
                 "You are authorized to approve this yourself.")
```
`check_limits` (the `PolicyPort` method used by P3) = steps 2–3 only, role-agnostic.

**Outcome**
```
another action already PENDING_APPROVAL/APPROVED/EXECUTING for this resource → 409 CONFLICT (create only)
any check failed                         → Action.status = BLOCKED
requiresApproval and requester < role    → PENDING_APPROVAL  (+ notify eligible approvers)
otherwise                                → APPROVED → EXECUTING
EXECUTE → adapter.execute(...) in a background asyncio task; poll get_operation_status every 3 s (timeout 5 min)
FINISH  → SUCCEEDED | FAILED → ingestion.refresh_resource → audit_log → notifications → WS event
```
- **Re-validate at approve time** (state may have changed). If it now fails → `422 POLICY_VIOLATION` / `BUDGET_EXCEEDED` and the action becomes `BLOCKED`.
- Every state change writes an `audit_logs` row (`before`/`after`). `Idempotency-Key` repeats return the original `Action` (201).
- On startup, **recover** actions stuck in `EXECUTING` (resume polling).
- Role hierarchy for "role ≥": `VIEWER < DEVOPS < MANAGER < ADMIN`.

### 10.7 LLM layer (P3)
- Interface `LlmClient.complete(system, messages, tools=None) -> str`.
- `/ai/explain` and `/ai/summarize`: build a **structured JSON context** and let the LLM write text. No credentials or raw PII in prompts.
- **Data access = loopback HTTP**: the AI layer fetches context and runs chat tools by calling the platform's own REST API (`INTERNAL_API_BASE`, default `http://127.0.0.1:8000/api/v1`) **with the caller's bearer token**. This guarantees the caller's permissions and needs no Python imports across ownership lines.
- `/ai/chat` tool-calling with **read-only tools only** (`get_dashboard`, `list_resources`, `get_resource_metrics`, `get_costs`, `list_recommendations`, `preview_action`). **No write tools exist.** It may return `suggestedActions`; the user still goes through §7.9.
- Timeout 15 s. On any failure return a deterministic template explanation — the feature degrades, never errors the page. Rate limit 20 req/min/user (in-memory) → `429`.

### 10.8 Notification Service (P2)
```python
class NotificationChannel(ABC):
    channel: Channel
    async def send(self, user, payload) -> None: ...
```
`InAppChannel` (DB row + WS `notification.created`), `EmailChannel` (aiosmtplib), `WhatsAppChannel` (Meta Cloud API or Twilio via httpx). Channels without credentials **log instead of failing**. Fan-out respects each user's `notification_settings` (defaults for new users: IN_APP on for all events; EMAIL/WHATSAPP off until a destination is set). Optional integrations (MCP, Slack, …) implement the same interface later.

| Event | Audience |
|---|---|
| `ALERT_CREATED` | all users with `metrics.read` |
| `RECOMMENDATION_CREATED` | users with `actions.request` |
| `APPROVAL_REQUESTED` | users with `actions.approve` and role ≥ `approverRole` |
| `ACTION_COMPLETED` / `ACTION_FAILED` | requester (+ approver) |
| `BUDGET_THRESHOLD` / `COST_ANOMALY` | users with `budgets.write` |

---

## 11. Mock mode & seed data (nothing blocks on real cloud accounts)

- `PROVIDER_MODE=mock` (default). `MockAdapter` metrics come from a **pure, deterministic function** `value = f(resourceProfile, metric, timestamp, quantity)`:
  `base × dailyCurve(hour) × weeklyFactor(dow) × (1 + noise(seed, minuteBucket)) × spikeMultiplier(t)`, and CPU scales with `baselineQuantity / quantity` (so scaling out really lowers CPU). History, live data and backfill are always consistent.
- **Scripted spike:** 2 minutes after startup, `checkout-api` traffic ramps ×1.6 over 60 s and stays for 30 min (CPU ≈ 84 %) → the anomaly + `SCALE_UP` recommendation appear **within ~5 min of startup**. `POST /system/mock/spike` (demo controls) triggers it on demand and forces an ingestion cycle.
- **Seed** = `python -m app.seed`, runs when `SEED_ON_START=true`. Steps are discovered from `app/seeds/` sorted by `ORDER`; **every step is idempotent** (create-if-missing by deterministic id; never overwrite existing rows; skip metric backfill for a resource that already has metrics), so re-running is always safe. Backfill: **7 days of metrics at 5-min granularity**, 30 days of costs.
- **Deterministic ids:** users, accounts, resources, policies, budgets use `uuid5(NAMESPACE_DNS, "cloudops:<kind>:<name>")`, except these fixed ids used in examples/mocks: `checkout-api` = `b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30`, user `devops@cloudops.dev` = `3d2f6b1e-7a44-4c0d-9e8b-5a1c2f9d0e33`.

**Users** (`ORDER=10`, P2; password `Passw0rd!` — dev/demo only; set `SEED_ON_START=false` after first boot in real deployments): `admin@cloudops.dev`, `manager@cloudops.dev`, `devops@cloudops.dev` (name "Dev Ops"), `viewer@cloudops.dev`. Default notification settings created per user.
**Cloud accounts** (P2): `AWS Production`, `Azure Production`, `GCP Production` — all `MOCK`.
**Policies** (P2): (1) *Global safety limits* — `SAFETY_LIMIT`, scope `{}`, `{ maxInstances: 10, minInstances: 1, maxScaleStepPercent: 100, maxCostIncreasePerActionUsd: 500 }` · (2) *Large spend needs approval* — `APPROVAL_RULE`, `{ requireApprovalWhen: { costDeltaMonthlyUsdGt: 100 }, approverRole: "MANAGER" }` · (3) *Never stop databases* — `SAFETY_LIMIT`, scope `{ resourceType: "DATABASE" }`, `{ blockedActions: ["STOP"] }`.
**Budgets** (P2): *Production AWS* (`PROVIDER`/`AWS`, $1,000, thresholds 50/80/100, soft) · *Overall cloud spend* (`GLOBAL`, $3,500, hard limit).

**Resources** (`ORDER=20`, P3)

| Name | Provider | Type | Size | Qty (min–max) | Storage | supportedActions |
|---|---|---|---|---|---|---|
| checkout-api *(fixed id)* | AWS | COMPUTE | t3.medium | 4 (2–10) | – | SCALE_OUT, SCALE_IN, RESIZE, STOP, START |
| worker-pool | AWS | COMPUTE | t3.large | 3 (1–8) | – | SCALE_OUT, SCALE_IN, RESIZE |
| staging-api | AWS | COMPUTE | t3.small | 1 (1–2) | – | SCALE_OUT, SCALE_IN, RESIZE, STOP, START |
| orders-db | AWS | DATABASE | db.r5.large | 1 (1–1) | 500 GB | EXPAND_STORAGE |
| assets-bucket | AWS | STORAGE | s3-standard | 1 (1–1) | 2000 GB | *(none)* |
| web-alb | AWS | LOAD_BALANCER | alb | 1 (1–1) | – | *(none)* |
| billing-api | AZURE | COMPUTE | Standard_D2s_v3 | 3 (2–8) | – | SCALE_OUT, SCALE_IN, RESIZE |
| aks-workers | AZURE | CONTAINER | Standard_D4s_v3 | 5 (3–12) | – | SCALE_OUT, SCALE_IN |
| reports-db | AZURE | DATABASE | GP_Gen5_4 | 1 (1–1) | 300 GB | RESIZE, EXPAND_STORAGE |
| media-storage | AZURE | STORAGE | blob-hot | 1 (1–1) | 3000 GB | *(none)* |
| search-svc | GCP | COMPUTE | e2-standard-2 | 2 (1–6) | – | SCALE_OUT, SCALE_IN, RESIZE |
| gke-batch | GCP | CONTAINER | n2-standard-4 | 3 (1–10) | – | SCALE_OUT, SCALE_IN |
| cache-redis | GCP | DATABASE | m1-standard | 1 (1–1) | – | *(none)* |
| gcs-backups | GCP | STORAGE | gcs-nearline | 1 (1–1) | 4000 GB | *(none)* |

**Scenarios (state at first boot → what the demo shows)**

| Resource | Mock profile | Result |
|---|---|---|
| checkout-api | cpu ≈ 52 %, ≈ 1,100 req/s, p95 ≈ 180 ms; scripted spike later | `SCALE_UP` 4→6 (+$60.74/mo) |
| worker-pool | p95 cpu ≈ 30 %, mem ≈ 35 % for 7 d | `RIGHT_SIZE` t3.large→t3.medium (−$91.10/mo) |
| orders-db | storage 84 % used | `RESOURCE_ALLOCATION` 500→625 GB |
| staging-api | cpu < 3 % for 7 d | `COST_OPTIMIZATION` `STOP` (−$15.18/mo) |
| search-svc | cpu ≈ 18 %, traffic below baseline | `SCALE_DOWN` 2→1 |
| billing-api | p95 latency ≈ 2.2× baseline | health `DEGRADED` + alert |
| reports-db | error_rate ≈ 6 % for the last 2 h | health `UNHEALTHY` + CRITICAL alert |
| aks-workers | one day 3 days ago costs ×2.5 | `COST` anomaly |
| others | healthy defaults | – |

**Price catalog ($/hour; storage rows are $/GB-month)** and **right-size ladders** (small → large)

| Provider | Ladder / sizes ($/h) |
|---|---|
| AWS compute | t3.small 0.0208 → **t3.medium 0.0416** → t3.large 0.0832 → t3.xlarge 0.1664 |
| AWS database | db.r5.large 0.25 → db.r5.xlarge 0.50 · storage 0.115 · S3 0.023 |
| Azure compute | Standard_D2s_v3 0.096 → D4s_v3 0.192 → D8s_v3 0.384 · blob-hot 0.0184 |
| Azure database | GP_Gen5_2 0.25 → GP_Gen5_4 0.50 → GP_Gen5_8 1.00 · storage 0.115 |
| GCP compute | e2-standard-2 0.067 → e2-standard-4 0.134 → e2-standard-8 0.268 |
| GCP container | n2-standard-4 0.194 → n2-standard-8 0.388 · gcs-nearline 0.01 |
| Fixed monthly | web-alb $22.63 · cache-redis $146.00 |

Seeded totals target roughly **AWS ≈ $750 · Azure ≈ $1,420 · GCP ≈ $790 per month** (resources + a small "other services" cost line per account), so the budgets/percentages above stay consistent.

**Frontend mocks (MSW)** return the same shapes and implement the same three outcomes: target > max → `BLOCKED`; cost delta > $100 and role < MANAGER → `PENDING_APPROVAL`; otherwise `EXECUTING` → `SUCCEEDED` after ~3 s (via `fakeSocket.ts`). Mock login supports all four seeded users.

---

## 12. RBAC matrix

| Permission | VIEWER | DEVOPS | MANAGER | ADMIN |
|---|:-:|:-:|:-:|:-:|
| `resources.read` `metrics.read` `costs.read` `recommendations.read` `actions.read` `policies.read` `ai.use` | ✅ | ✅ | ✅ | ✅ |
| `actions.request` (create/preview actions, accept/dismiss recommendations, acknowledge alerts/anomalies, demo spike) | ❌ | ✅ | ✅ | ✅ |
| `actions.approve` · `budgets.write` · `audit.read` · `resources.manage` | ❌ | ❌ | ✅ | ✅ |
| `policies.write` · `accounts.manage` · `users.manage` | ❌ | ❌ | ❌ | ✅ |

Backend enforces (403). Frontend hides/disables UI using `user.permissions` — **never rely on hiding alone**. Notification settings and inbox are always the caller's own.

---

## 13. Frontend contract (Person 1)

### 13.1 Pages → APIs they call

| Route | Purpose | REST calls | WS channels |
|---|---|---|---|
| `/login` | Sign in | `POST /auth/login` | – |
| `/dashboard` | KPIs, alerts, top recommendations | `GET /dashboard/overview`, `GET /alerts?status=OPEN&pageSize=5`, `GET /recommendations?status=NEW&pageSize=5`, `GET /metrics/timeseries?metric=request_rate` | `dashboard`, `alerts`, `recommendations` |
| `/monitoring` | Traffic, latency, storage, uptime, health | `GET /metrics/summary`, `GET /metrics/timeseries` (one per chart) | `dashboard` |
| `/resources` | Filterable table | `GET /resources` | `dashboard` |
| `/resources/:id` | Metrics, health, cost, recs, actions, **Scale** modal, edit tags/bounds, demo spike button | `GET /resources/{id}`, `PATCH /resources/{id}`, `/metrics`, `/health`, `/cost`, `GET /recommendations?resourceId=`, `GET /actions?resourceId=`, `POST /actions/preview`, `POST /actions`, `POST /system/mock/spike` | `resource:{id}`, `actions` |
| `/costs` | Cost analysis & billing | `GET /costs/summary`, `/timeseries`, `/breakdown`, `/forecast`, `GET /anomalies?kind=COST`, `GET /billing/statements`, `GET /budgets` | `dashboard` |
| `/recommendations` | List + review drawer | `GET /recommendations`, `POST /recommendations/{id}/accept`, `/dismiss`, `POST /ai/explain` | `recommendations` |
| `/approvals` | Pending + history | `GET /actions?status=PENDING_APPROVAL`, `POST /actions/{id}/approve`, `/reject`, `/cancel`, `GET /actions` | `actions` |
| `/policies` | Policies + budgets CRUD | `GET/POST/PATCH/DELETE /policies`, `/budgets`, `GET /rbac/roles` | – |
| `/accounts` | Connect clouds | `GET/POST/DELETE /cloud-accounts`, `POST /cloud-accounts/{id}/sync` | – |
| `/alerts` | Alert center | `GET /alerts`, `POST /alerts/{id}/acknowledge`, `/resolve`, `GET /anomalies` | `alerts` |
| `/settings/notifications` | Channels & events | `GET/PUT /notification-settings`, `POST /notification-settings/test` | – |
| `/audit` | Audit trail | `GET /audit-logs` | – |
| `/admin/users` | User management (ADMIN) | `GET/POST/PATCH/DELETE /users` | – |
| *(global)* header bell | Notifications | `GET /notifications?unread=true`, `POST /notifications/{id}/read`, `/read-all` | `user` (automatic) |
| *(global)* AI panel | Ask / summarize | `POST /ai/chat`, `POST /ai/summarize` | – |

### 13.2 Frontend rules
1. **One API client** (`api/client.ts`): base URL from `VITE_API_BASE_URL` (default `/api/v1`), adds the bearer token, unwraps the envelope, throws typed `ApiError { code, message, details }`. On `401` it calls `/auth/refresh` **once** (a single in-flight refresh shared by all requests), retries, else redirects to `/login`. Never add trailing slashes.
2. All API data typed with `api/types.ts` (copy of §6). No ad-hoc interfaces for API data.
3. Data fetching via TanStack Query. Query keys: `['dashboard']`, `['resources', filters]`, `['resource', id]`, `['metrics', id, params]`, `['costs', …]`, `['recommendations', filters]`, `['actions', filters]`, `['alerts']`, `['notifications']`.
4. **WebSocket → cache mapping**

   | Event | Cache action |
   |---|---|
   | `metric.updated` | append the point to matching `['metrics', …]` series (drop points outside the window) |
   | `dashboard.updated` | invalidate `['dashboard']`, `['resources']`, `['costs']` |
   | `resource.health_changed` | invalidate `['resources']`, `['resource', id]`, `['dashboard']` |
   | `alert.*`, `anomaly.detected` | invalidate `['alerts']`, `['dashboard']` (+ toast for CRITICAL) |
   | `recommendation.created` | invalidate `['recommendations']`, `['dashboard']` + toast |
   | `action.status_changed` | invalidate `['actions']`, `['action', id]`, `['resource', resourceId]` + toast |
   | `notification.created` | invalidate `['notifications']` |
   | *(re)connect* | re-subscribe + `queryClient.invalidateQueries()` |

5. Every screen has **loading, empty and error** states. Unknown enum values render as raw text, never crash.
6. **Scale / Apply flow (must follow exactly):** show only `resource.supportedActions` → modal (target instances / size / storage; clamp to `minQuantity`–`maxQuantity`; disable if the resource already has a non-terminal action) → `POST /actions/preview` (debounced) → show cost delta, budget bar and each `validation.checks[].message` → if `allowed=false` disable "Apply" and show the reasons → confirm dialog → `POST /actions` with a fresh `Idempotency-Key` (uuid) → render by `Action.status` (§7.9) with live updates. A `409` shows the message and refreshes the resource's actions.
7. Colors: severity `INFO` blue, `WARNING` amber, `CRITICAL` red · health `HEALTHY` green, `DEGRADED` amber, `UNHEALTHY` red · cost saving (negative delta) green, increase red. Money via `Intl.NumberFormat('en-US', {style:'currency', currency:'USD'})`; label projections "Estimated".
8. Never call cloud providers or the LLM from the browser. Tokens: access token in memory (Zustand); refresh token in `localStorage` (documented MVP trade-off).
9. Env: `VITE_API_BASE_URL` (default `/api/v1`), `VITE_WS_URL` (optional; default derived from `window.location`), `VITE_USE_MOCKS=true|false`. In mock mode the WS client is replaced by `fakeSocket.ts` emitting scripted events (spike → recommendation → action status changes). Mock login supports all 4 seeded users.
10. Dev proxy (`vite.config.ts`): `server.proxy = { '/api': 'http://localhost:8000', '/ws': { target: 'ws://localhost:8000', ws: true } }`.
11. Route guards: unauthenticated → `/login`; pages/buttons gated by `user.permissions`. Show the **demo spike button** only when `GET /system/health` says `demoControls: true` and the user has `actions.request`.
12. **Contract drift check:** `npm run gen:api` (`openapi-typescript ../contracts/openapi.json -o src/api/generated.ts`) + `src/api/contract-check.ts` assigning each hand-written type in §6 to its generated counterpart (Resource, Recommendation, Action, MoneyImpact, ValidationResult, Policy, Budget, Alert, Anomaly, User, CloudAccount, Notification, DashboardOverview, …). Drift = TypeScript compile error. Run in CI once `contracts/openapi.json` exists.

---

## 14. Backend rules (Persons 2 & 3)
1. Layering: `api/v1/*` routers are thin (parse → call service → return schema); logic lives in `services/`; DB via async SQLAlchemy sessions injected with `Depends` (jobs use `async_session()`). Engines (`cost`, `policy`, `analytics`, `recommendation`) are **pure/async services callable without HTTP** so they're unit-testable.
2. Response models: `ApiResponse[T]` / `PagedResponse[T]` (§4.3); schemas inherit `CamelModel`; money = `float` rounded to 2 decimals; datetimes tz-aware UTC.
3. All errors go through `ApiError` + the global handlers → §4.1 envelope. Never return raw FastAPI validation output.
4. Passwords: **argon2** (`argon2-cffi`) — not passlib/bcrypt (version-compat issues). JWT via **PyJWT**. Authorization reads the user's **current DB role** each request (§4).
5. Credentials: Fernet (`ENCRYPTION_KEY`); **never** return or log them; decrypt only inside adapter calls.
6. Every write to actions / policies / budgets / accounts / users / resources creates an `audit_logs` row (via `AuditPort`).
7. Migrations only through **Alembic** (Person 2). `DATABASE_URL` is normalized: `postgres://` and `postgresql://` → `postgresql+asyncpg://` (managed hosts hand out the plain form).
8. **Run exactly ONE Uvicorn worker** in the MVP: the scheduler and the WebSocket hub are in-process. (Scaling out later = move jobs to a worker process and the hub to Redis pub/sub — out of scope.)
9. Blocking calls (cloud SDKs, SMTP libs) → `asyncio.to_thread`. Timeouts on every outbound call. Behind the proxy, Uvicorn runs with `--proxy-headers --forwarded-allow-ips="*"`.
10. Cross-person rules (ports, auto-discovery, table ownership): **§16**.
11. **Minimum tests (pytest):** P2 — policy engine (each rule), orchestrator (BLOCKED / PENDING_APPROVAL / EXECUTING→SUCCEEDED / re-validation / in-flight conflict / idempotency), envelope/error shape, RBAC 403s, auth. P3 — mock generator (determinism, curves, spike, quantity effect), cost engine (impact + budget), analytics (z-score, health), recommendation rules (incl. clamping).

---

## 15. Configuration & deployment

### 15.1 Environment variables (`.env.example` — Person 2 creates it exactly like this; comments on their own lines)
```
# --- general ---
ENV=dev
DB_PASSWORD=change_me
# DATABASE_URL is set by docker-compose from DB_PASSWORD. For running the backend outside Docker use:
# DATABASE_URL=postgresql+asyncpg://cloudops:change_me@localhost:5432/cloudops
# Generate with: openssl rand -hex 32
JWT_SECRET=
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=
# Only needed when frontend and API are on different origins
CORS_ORIGINS=http://localhost:5173
# false in real deployments after first boot
SEED_ON_START=true
# --- cloud ---
# mock | live
PROVIDER_MODE=mock
INGESTION_INTERVAL_SECONDS=60
# Shows the "simulate traffic spike" control + enables POST /system/mock/spike
ENABLE_DEMO_CONTROLS=true
# --- AI ---
LLM_PROVIDER=anthropic
LLM_API_KEY=
LLM_MODEL=
INTERNAL_API_BASE=http://127.0.0.1:8000/api/v1
# --- notifications (optional; unset = log only) ---
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```
Frontend build-time (Vite): `VITE_API_BASE_URL=/api/v1`, `VITE_WS_URL=` (blank = same origin), `VITE_USE_MOCKS=false`.

### 15.2 Docker

**`docker-compose.yml`**
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cloudops
      POSTGRES_USER: cloudops
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U cloudops"], interval: 5s, retries: 10 }
  backend:
    build: ./backend
    env_file: .env
    environment:
      DATABASE_URL: postgresql+asyncpg://cloudops:${DB_PASSWORD}@db:5432/cloudops
    depends_on: { db: { condition: service_healthy } }
    healthcheck: { test: ["CMD", "python", "-c", "import urllib.request as u; u.urlopen('http://localhost:8000/api/v1/system/health')"], interval: 10s, retries: 12 }
  frontend:
    build:
      context: ./frontend
      args: { VITE_API_BASE_URL: /api/v1, VITE_WS_URL: "", VITE_USE_MOCKS: "false" }
    ports: ["80:80"]
    depends_on: { backend: { condition: service_healthy } }
volumes: { pgdata: {} }
```

**`backend/Dockerfile`**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
ARG INSTALL_LIVE=false
COPY requirements.txt requirements-live.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
 && if [ "$INSTALL_LIVE" = "true" ]; then pip install --no-cache-dir -r requirements-live.txt; fi
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
```
`requirements.txt`: `fastapi, uvicorn[standard], sqlalchemy[asyncio]>=2, asyncpg, alembic, pydantic>=2, pydantic-settings, PyJWT, argon2-cffi, cryptography, apscheduler>=3.10,<4, httpx, numpy, anthropic, aiosmtplib, pytest, pytest-asyncio, ruff` (pin exact versions when generating).
`requirements-live.txt` (P3): `boto3, azure-identity, azure-mgmt-monitor, azure-mgmt-compute, azure-mgmt-costmanagement, google-cloud-monitoring, google-cloud-compute`.

**`frontend/Dockerfile`** (multi-stage; Vite reads `VITE_*` at build time) + **`frontend/nginx.conf`** (serves the SPA and proxies API/WS → single origin)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_WS_URL=
ARG VITE_USE_MOCKS=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_WS_URL=$VITE_WS_URL VITE_USE_MOCKS=$VITE_USE_MOCKS
RUN npm run build
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
```
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location /api/ { proxy_pass http://backend:8000; proxy_set_header Host $host;
                   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                   proxy_set_header X-Forwarded-Proto $scheme; }
  location /ws   { proxy_pass http://backend:8000; proxy_http_version 1.1; access_log off;
                   proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";
                   proxy_read_timeout 3600s; }
  location /     { try_files $uri /index.html; }
}
```
(`access_log off` on `/ws` because the token travels in the query string.)

### 15.3 Run & deploy (details and checklists: §18.6)

| Goal | How |
|---|---|
| Everything locally | `cp .env.example .env` → fill `DB_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY` → `docker compose up --build` → open `http://localhost` (API docs: `/api/docs`) |
| Backend only (dev) | `docker compose up db` → `cd backend && pip install -r requirements.txt && alembic upgrade head && python -m app.seed && uvicorn app.main:app --reload --port 8000` |
| Frontend only (dev) | `cd frontend && npm i && npm run dev` (proxy → `:8000`). No backend: `VITE_USE_MOCKS=true npm run dev` |
| **Deploy A (simplest)** | Any VPS / EC2 / Droplet with Docker → clone → `.env` (`ENV=prod`, strong secrets) → `docker compose up -d --build`; HTTPS via Caddy (`caddy reverse-proxy --from yourdomain.com --to localhost:80`) or Cloudflare |
| Deploy B (managed) | Render/Railway: Postgres add-on + backend Docker service + frontend static site (rewrite `/*` → `/index.html`); origins differ → `VITE_API_BASE_URL=https://<api-host>/api/v1`, `VITE_WS_URL=wss://<api-host>/ws`, backend `CORS_ORIGINS=https://<frontend-host>` |
| Demo warning | Free tiers that **sleep** stop the ingestion scheduler and drop WebSockets — use an always-on instance for demos |

---

## 16. Team split, ownership & seams

### 16.1 Ownership map

| | **Person 1 — Frontend** | **Person 2 — Platform & Integration lead** | **Person 3 — Data & Intelligence** |
|---|---|---|---|
| **Folders / files** | `frontend/**` · `docs/gaps/p1.md` | `backend/` shell (`main.py`, `bootstrap.py`, `ports*.py`, `seed.py`, `export_openapi.py`, `core/`, `db/`, `realtime/`, `alembic/`) · `docker-compose.yml` · `.env.example` · `backend/Dockerfile` · `requirements.txt` · `.github/` · `scripts/` · `contracts/` · `ARCHITECTURE.md` · `docs/gaps/p2.md` · `tests/{conftest.py,p2/}` | `backend/app/adapters/` · `requirements-live.txt` · `docs/gaps/p3.md` · `tests/p3/` |
| **Routers** (`api/v1/`) | – | `auth` `users` `cloud_accounts` `recommendations` `actions` `policies`(+rbac) `budgets` `alerts` `notifications`(+settings) `audit` `system` | `dashboard` `resources` `metrics` `costs` `billing` `anomalies` `analytics` `ai` `mock_control` |
| **Services** | – | `policy` `orchestrator` `alerts` `notifier` `audit` `notification/*` · `jobs/{scheduler,recovery_jobs}` | `ingestion` `analytics` `recommendation` `cost` `metrics_query` `ai/*` · `jobs/{ingestion_jobs,maintenance_jobs}` |
| **Schemas** (`schemas/`) | – | `base common enums auth users accounts recommendations actions policies budgets alerts notifications audit system` | `resources metrics costs billing anomalies analytics dashboard ai` |
| **Seeds** | – | `seeds/core.py` (`ORDER=10`): users, accounts, policies, budgets, notification defaults | `seeds/data.py` (`ORDER=20`): price catalog, resources, metrics backfill, costs, scenarios |
| **Publishes WS events** | – | `alert.*` `action.status_changed` `notification.created` `pong` | `metric.updated` `dashboard.updated` `resource.health_changed` `anomaly.detected` `recommendation.created` |
| **Provides ports** | – | `policy_engine` `alerts` `notifier` `hub` `audit` | `cost_engine` `ingestion` `adapters` |
| **Consumes** | HTTP + WS contract only | ports `cost_engine` `ingestion` `adapters` (stubbed until P3 lands) | ports `policy_engine` `alerts` `notifier` `hub` `audit` (stubbed until P2 lands) |
| **Runs alone with** | MSW mocks + `fakeSocket` | `ports_stubs.py` | `ports_stubs.py` + pure functions |

**Why this split integrates cleanly**
- **One seam per pair, both fully specified in this file:** P1 ↔ backend = the HTTP/WS contract (§4–§9); P2 ↔ P3 = `app/ports.py` (§16.3) + the DB schema (§5). Nothing else crosses ownership lines.
- **Disjoint files** → merges cannot conflict. Shared "registration" points are **auto-discovered** (§16.4), so nobody edits `main.py`.
- **Each person can demo alone from minute one** (mocks / stubs), and integration is a switch, not a rewrite.

### 16.2 Seams at a glance

```mermaid
flowchart LR
  P1["Person 1<br/>React UI"] -- "HTTP /api/v1 + WS /ws  (§4-§9)" --> BE
  subgraph BE["FastAPI process (1 worker)"]
    P2["Person 2<br/>control plane"] <-- "app/ports.py  (§16.3)" --> P3["Person 3<br/>data & intelligence"]
  end
  P2 --> DB[(PostgreSQL §5)]
  P3 --> DB
```

### 16.3 `app/ports.py` — the P2 ↔ P3 seam (Person 2 creates it in M0 by copying this block; **nobody else edits it**)

```python
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import TYPE_CHECKING, Any, Literal, Protocol
from uuid import UUID

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.schemas.common import MoneyImpact, ProposedAction, ValidationResult

OpState = Literal["RUNNING", "SUCCEEDED", "FAILED"]

# ---------- data classes shared by adapters, ingestion and orchestrator ----------
@dataclass
class ValidationOutcome:
    ok: bool
    message: str = ""

@dataclass
class NormalizedResource:
    external_id: str
    name: str
    type: str                       # ResourceType
    region: str
    status: str                     # ResourceStatus
    size: str
    quantity: int
    min_quantity: int
    max_quantity: int
    supported_actions: list[str]    # ActionType[]
    storage_gb: float | None = None
    tags: dict[str, str] = field(default_factory=dict)

@dataclass
class MetricSeriesData:
    metric: str                     # canonical name, §6.2
    unit: str
    points: list[tuple[datetime, float]]

@dataclass
class CostRecord:
    service: str
    usage_date: date
    amount_usd: float
    resource_external_id: str | None = None
    tags: dict[str, str] = field(default_factory=dict)

@dataclass
class ProviderOperation:
    operation_id: str
    state: OpState
    message: str = ""

@dataclass
class BudgetUsage:
    used_usd: float
    forecast_usd: float

class CloudProviderAdapter(ABC):
    provider: str                   # "AWS" | "AZURE" | "GCP"
    @abstractmethod
    async def validate_credentials(self, acc: Any) -> ValidationOutcome: ...
    @abstractmethod
    async def list_resources(self, acc: Any) -> list[NormalizedResource]: ...
    @abstractmethod
    async def get_metrics(self, acc: Any, external_id: str, metrics: list[str],
                          start: datetime, end: datetime, interval: str) -> list[MetricSeriesData]: ...
    @abstractmethod
    async def get_costs(self, acc: Any, start: date, end: date) -> list[CostRecord]: ...
    @abstractmethod
    async def execute(self, acc: Any, external_id: str, action_type: str, params: dict) -> ProviderOperation: ...
    @abstractmethod
    async def get_operation_status(self, acc: Any, operation_id: str) -> ProviderOperation: ...

# ---------- PROVIDED BY PERSON 3 (consumed by Person 2) ----------
class CostEnginePort(Protocol):                       # name: "cost_engine"
    async def estimate_impact(self, db: AsyncSession, resource_id: UUID, action: ProposedAction) -> MoneyImpact: ...
    async def budget_usage(self, db: AsyncSession, budget_id: UUID) -> BudgetUsage: ...

class IngestionPort(Protocol):                        # name: "ingestion"
    async def sync_account(self, account_id: UUID) -> None: ...     # background; sets SYNCING → CONNECTED/ERROR; returns fast
    async def refresh_resource(self, resource_id: UUID) -> None: ...

class AdapterPort(Protocol):                          # name: "adapters"
    def get(self, account: Any) -> CloudProviderAdapter: ...        # Mock if account.mode==MOCK or PROVIDER_MODE=mock

# ---------- PROVIDED BY PERSON 2 (consumed by Person 3) ----------
class PolicyPort(Protocol):                           # name: "policy_engine"
    async def check_limits(self, db: AsyncSession, resource_id: UUID, action: ProposedAction,
                           impact: MoneyImpact) -> ValidationResult: ...   # POLICY + BUDGET only, role-agnostic

class AlertsPort(Protocol):                           # name: "alerts"
    async def raise_alert(self, db: AsyncSession, *, severity: str, source: str, title: str, message: str,
                          resource_id: UUID | None = None, anomaly_id: UUID | None = None) -> UUID | None: ...  # dedupes; notifies + WS alert.created
    async def resolve_alerts(self, db: AsyncSession, *, anomaly_id: UUID | None = None,
                             resource_id: UUID | None = None, source: str | None = None) -> int: ...

class NotifierPort(Protocol):                         # name: "notifier"
    async def notify_event(self, db: AsyncSession, event: str, *, title: str, body: str,
                           entity_type: str | None = None, entity_id: str | None = None) -> None: ...  # audience per §10.8

class HubPort(Protocol):                              # name: "hub"
    def has_subscribers(self, channel: str) -> bool: ...
    async def publish(self, event: str, channel: str, data: dict) -> None: ...
    async def publish_user(self, user_id: UUID, event: str, data: dict) -> None: ...

class AuditPort(Protocol):                            # name: "audit"
    async def write(self, db: AsyncSession, *, actor_id: UUID | None, action: str, entity_type: str,
                    entity_id: UUID | str | None, before: dict | None = None, after: dict | None = None) -> None: ...

# ---------- tiny registry ----------
_impl: dict[str, Any] = {}
def provide(name: str, impl: Any) -> None:            # the owner calls this at the bottom of their module
    _impl[name] = impl
def use(name: str) -> Any:                            # call at CALL time (inside functions), never at import time
    from app.ports_stubs import STUBS
    return _impl.get(name) or STUBS[name]
```
Usage: `await use("cost_engine").estimate_impact(db, rid, action)` · implementation module ends with `provide("cost_engine", CostEngine())`.
`ProposedAction`, `MoneyImpact`, `ValidationResult` come from `app/schemas/common.py` (Person 2 writes it in M0 from §6.3).

**`app/ports_stubs.py` (Person 2, M0) — `STUBS` dict; used automatically until the real provider registers**

| Port | Stub behavior |
|---|---|
| `cost_engine` | `estimate_impact` → current = projected = 100.00, delta 0, `budget=None`; `budget_usage` → (0, 0) |
| `ingestion` | `sync_account` → sets account `CONNECTED` + `last_synced_at`; `refresh_resource` → no-op |
| `adapters` | `FakeAdapter`: no resources/metrics/costs; `execute` → `SUCCEEDED` immediately; `validate_credentials` → ok |
| `policy_engine` | `check_limits` → `allowed=True`, no checks |
| `alerts` / `notifier` / `audit` | log the call; `raise_alert` returns `None` |
| `hub` | logs; `has_subscribers` → `False` |

### 16.4 Auto-discovery (nobody edits shared registration code)

```python
# app/bootstrap.py (P2) — imports every module so provide(...) calls run; called in main.py lifespan and in seed.py
import importlib, pkgutil
def import_all(pkgs=("app.services", "app.adapters", "app.jobs", "app.seeds", "app.realtime")):
    for name in pkgs:
        pkg = importlib.import_module(name)
        for m in pkgutil.walk_packages(pkg.__path__, name + "."):
            importlib.import_module(m.name)

# app/api/v1/__init__.py (P2) — mounts every router module under /api/v1
import importlib, pkgutil
from fastapi import APIRouter
api_router = APIRouter()
for m in pkgutil.iter_modules(__path__):
    mod = importlib.import_module(f"{__name__}.{m.name}")
    if hasattr(mod, "router"):
        api_router.include_router(mod.router)
```
| Kind | Convention |
|---|---|
| Router module | `router = APIRouter(tags=["<name>"])`, **full paths in the decorators** (`@router.get("/resources")`), file names as in §16.1 — paths never collide because ownership is disjoint |
| Job module | `def register(scheduler: AsyncIOScheduler) -> None:` adds its jobs (one-off startup jobs use `run_date=now+N`) |
| Seed module | `ORDER: int` and `async def run(db) -> None`; runner sorts by `ORDER` |
| Port provider | `provide("<name>", Impl())` at the bottom of the implementing module |
| WebSocket route | `realtime/ws.py` (P2) mounted by `main.py` at `/ws` |

### 16.5 Table write ownership (READ any table freely; WRITE only per this map)

| Table | Writer |
|---|---|
| `users` `refresh_tokens` `policies` `budgets` `actions` `alerts` `notifications` `notification_settings` `audit_logs` | **P2** |
| `cloud_accounts` | **P2** — all columns except `status` and `last_synced_at` (**P3**) |
| `resources` `metrics` `costs` `price_catalog` `anomalies` `ai_conversations` | **P3** |
| `recommendations` | **P3** inserts rows and sets `EXPIRED`; **P2** sets `ACCEPTED` / `DISMISSED` (+`dismissed_*`) |

P3 never writes `alerts` / `audit_logs` / `notifications` directly — it goes through `AlertsPort` / `AuditPort` / `NotifierPort`.

### 16.6 Import rules & shared stable API

Across ownership lines you may import **only**: `app.ports`, `app.core.*` (`config.settings`, `errors.ApiError`, `deps.{current_user,require,get_db}`, `security.decrypt_credentials`), `app.db.*` (`session.async_session`, `models.*`), `app.schemas.{base,common,enums}`. Everything else in another person's folders is off-limits — use a port or HTTP. P2 ships these in M0 and keeps them stable.

### 16.7 Git workflow & shared files
- One monorepo; `main` is protected (PR + green CI). Branches: `p1/<task>`, `p2/<task>`, `p3/<task>`; commit/PR prefix `[P1]`/`[P2]`/`[P3]` + milestone (e.g. `[P3] M1: mock adapter + seeds`).
- **CODEOWNERS** mirrors §16.1. Each person edits only their paths. Shared files have exactly one owner (P2): `docker-compose.yml`, `.env.example`, `backend/Dockerfile`, `requirements.txt`, `ports*.py`, `main.py`, all migrations/models, `ARCHITECTURE.md`. Need a change there → CONTRACT GAP (§20).
- Small PRs, rebase on `main` before opening. P2 reviews any PR that touches API shapes; a teammate reviews the rest. Never force-push `main`.
- **Merge order at every sync (§18.2): P2 → P3 → P1.** (Not because of conflicts — there are none by construction — but because P2's skeleton/ports must exist before P3's code registers against them.)
- CI (`.github/workflows/ci.yml`, P2): backend `ruff` + `alembic upgrade head` + `pytest` (Postgres service) · frontend `npm ci` + typecheck + lint + build · contract job (export OpenAPI, fail if `contracts/openapi.json` is stale, run `npm run contract:check`) · on `main`: `docker compose up -d --build` + `scripts/smoke_api.py --group read`.

---

## 17. Playbooks

> Each playbook: **Mission → You own → You provide → You consume → Milestones (do them in order) → Rules → Done.** After every milestone print a MILESTONE REPORT (START HERE #6).

### 17.1 Person 1 — Frontend

**Mission:** build the entire React app against the contract, fully working on mocks, and make switching to the real backend a one-line env change.
**You own:** `frontend/**`, `docs/gaps/p1.md`. **You provide:** UI, `frontend/Dockerfile`, `frontend/nginx.conf`. **You consume:** REST + WS only (§4–§9) — via MSW until Gate G1.

**M0 — Scaffold (mocks-first)**
1. Vite + React 18 + TS + Tailwind + shadcn/ui + React Router + TanStack Query + Zustand + MSW + sonner + Recharts + react-hook-form + zod. Scripts: `dev`, `build`, `typecheck`, `lint`, `gen:api`, `contract:check`.
2. `src/api/types.ts` = §6.1–§6.5 **verbatim**.
3. `api/client.ts` (§13.2 #1), `api/ws.ts` (§9: subscribe, ping 25 s, backoff, 4401 → refresh + reconnect, event→cache mapping §13.2 #4), `mocks/fakeSocket.ts`.
4. MSW: auth for the 4 seeded users (permissions per §12), `/system/health`, list/detail endpoints serving the §11 dataset (14 resources) and a deterministic time-series generator.
5. Layout: sidebar filtered by `user.permissions`, header (notification bell, AI button, role badge/user menu), route guards.
6. `Dockerfile` + `nginx.conf` (§15.2), dev proxy (§13.2 #10). Commit `package-lock.json`.
**Done when:** `VITE_USE_MOCKS=true npm run dev` logs in as all 4 users with different navigation; `npm run build` and `docker build ./frontend` pass.

**M1 — Read pages**
Dashboard · Monitoring (traffic, latency, storage, uptime, health) · Resources list (filters, search, sort, pagination) · Resource detail (metrics charts with range/interval picker, health, cost) · Costs (summary, timeseries, breakdown, forecast band, cost anomalies, billing statements, budget bars).
**Done when:** every route renders on mocks with loading/empty/error states → **Gate G1: flip `VITE_USE_MOCKS=false` for these pages.**

**M2 — The workflow**
Recommendations list + **review drawer** (cost impact, budget bar, policy checks, "Explain" via `/ai/explain`) · **Scale modal** (§13.2 #6) · Approvals page · live updates + toasts · notification bell. MSW reproduces the three outcomes; `fakeSocket` scripts the spike.
**Done when:** demo storyline steps 2–6 (§1) work on mocks.

**M3 — Admin & extras**
Policies + Budgets CRUD (zod-validated to §6 shapes) · Accounts (credential form per provider; MOCK default) · Alerts center · Notification settings (+test) · Audit log · Users admin · AI panel (chat + summarize; `suggestedActions` → navigate / open preview) · resource edit (`PATCH`) · demo spike button (§13.2 #11).
Stretch (only if time): what-if cost simulator (slider → `/actions/preview`), dark mode.

**M4 — Integration & polish**
Flip every page to the real backend, fix drift (`gen:api` + `contract:check`), responsive layout, error boundary, `docker compose` build, run the UI smoke test (§18.3-B).

**Rules:** no endpoints/fields/enums outside this file · **display** backend numbers, never recompute cost/policy/approval logic · gate UI by `permissions`, not role names · never call cloud/LLM directly · money as USD via `Intl`, "Estimated" on projections · every mutation handles `BLOCKED` / `PENDING_APPROVAL` / `409` / `422`.
**Done =** all routes in §13.1 work on mocks **and** on the real backend by env only; passes the UI smoke test; drift check green.

### 17.2 Person 2 — Platform backend & Integration lead

**Mission:** own the backend shell, the database, security, the control plane (policies → orchestrator → actions), realtime, notifications, deployment — and make the three parts integrate.
**You own:** §16.1 column 2. **You provide:** shared core (§16.6), ports `policy_engine alerts notifier hub audit`. **You consume:** ports `cost_engine ingestion adapters` (stubs until P3 lands).
**Contract keeper:** you maintain this file (§20).

**M0 — Skeleton (BLOCKS the others — deliver first, target ≈ first 2 hours)**
1. Repo folders, `.gitignore`, `.env.example` (§15.1), `docker-compose.yml`, `backend/Dockerfile`, `requirements*.txt`, CODEOWNERS.
2. `core/config.py` (pydantic-settings; DB URL normalization), `core/errors.py` + handlers (§4.3), `main.py` (lifespan: `import_all`, scheduler start/stop; auto-mounted routers; `/ws`; docs URLs; `redirect_slashes=False`), `bootstrap.py`, `api/v1/__init__.py`.
3. `ports.py` + `ports_stubs.py` (§16.3); `schemas/{base,common,enums}.py` mirroring §6.1/§6.3 shared types.
4. `db/`: async session + **all models per §5** + Alembic initial migration incl. the partial unique indexes.
5. `core/security.py` (argon2, JWT, Fernet), `core/deps.py` (`current_user` from DB, `require(perm)`, role order, RBAC map §12).
6. `api/v1/auth.py`, `api/v1/system.py`; `seed.py` runner + `seeds/core.py` (§11).
7. `export_openapi.py`, CI workflow, README quickstart. Announce: **"Skeleton is on main"**.
**Done when (= Gate G0):** `docker compose up --build` → `/api/v1/system/health` UP; login works for the 4 users; `/api/docs` renders; `contracts/openapi.json` exported; CI green.

**M1 — Control-plane CRUD & realtime**
`users`, `cloud_accounts` (Fernet credentials; `adapters` port for `validate_credentials`; `ingestion.sync_account` after create/sync), `policies` (+`/rbac/roles`), `budgets` (usage via `cost_engine.budget_usage`), `audit` (+`services/audit.py`), `alerts` (+`services/alerts.py`: dedupe, notify, WS), `notifications` + settings + `services/notifier.py` + `in_app` channel, **WebSocket hub** (`/ws`: token auth, 4401, subscribe/unsubscribe, ping/pong, `publish`, `publish_user`, `has_subscribers`). Tests.

**M2 — Policy engine, orchestrator, actions, recommendations router**
`services/policy.py` (`check_limits` + full validation, §10.6) · `services/orchestrator.py` (state machine §7.9, idempotency, in-flight rule, re-validation, background execute + polling, audit, notifications, WS `action.status_changed`) · `api/v1/actions.py` · `api/v1/recommendations.py` (per-role `policyCheck` at read; `accept` → action; `dismiss`) · startup recovery job.
**Done when:** with stubbed ports, tests prove `BLOCKED`, `PENDING_APPROVAL`, `EXECUTING → SUCCEEDED`, approve re-validation, conflict, idempotency, RBAC 403s.

**M3 — Channels & the smoke script**
`email` + `whatsapp` channels (log fallback), `scripts/smoke_api.py` (spec in §18.3-A), CI compose-smoke job.

**M4 — Integration lead**
Run gates G1–G4 (§18.1–§18.2), triage with §18.5, keep `contracts/openapi.json` fresh, deploy (§18.6), rehearse the demo (§1) twice, final README.

**Rules:** you are the **only** author of migrations/models/`ports.py`/compose/CI · never break the shared API (§16.6) without a version bump · answer CONTRACT GAPs within ~1 hour (§20).
**Done =** §7 endpoints you own return exact shapes, gates G0–G4 pass, deployed, demo rehearsed.

### 17.3 Person 3 — Data & Intelligence

**Mission:** produce and analyze the data — cloud adapters (with a rich mock cloud), ingestion, analytics, cost engine, recommendations, the read APIs, and the AI layer.
**You own:** §16.1 column 3. **You provide:** ports `cost_engine ingestion adapters`. **You consume:** ports `policy_engine alerts notifier hub audit` (stubs until P2 lands).

**M0 — Pure logic (start immediately; needs no DB and no teammates)**
1. `adapters/mock_generator.py` — deterministic `f(profile, metric, timestamp, quantity)` (§11): daily/weekly curves, noise, spike multiplier, CPU ∝ `baselineQty/quantity`. `adapters/price_catalog.py` — §11 prices + ladders.
2. Pure functions with dataclass in/out: cost impact (§10.5), analytics (z-score, health, trend — §10.3), recommendation rules (§10.4).
3. If P2's skeleton isn't merged yet, copy §16.3 to `app/ports.py` **locally** (don't commit it).
**Done when:** `pytest tests/p3` is green without a DB and reproduces §8/§11 numbers: `121.47 → 182.21 = +60.74` (4→6 `t3.medium`), `worker-pool` RIGHT_SIZE `−91.10`, `staging-api` STOP `−15.18`, `orders-db` EXPAND 500→625 GB.

**M1 — Read plane (after Gate G0)**
`MockAdapter` (+ AWS/Azure/GCP mock flavors, naming/tags per provider) + `adapters/registry.py` (`provide("adapters")`) · `seeds/data.py` (§11: resources, catalog, 7-day backfill, 30-day costs, scenarios) · `services/ingestion.py` + `jobs/ingestion_jobs.py` (§10.2; `provide("ingestion")`) · `metrics_query.py` (downsampling §6.2) · routers `resources` (+`PATCH`, audited via `AuditPort`), `metrics`, `costs`, `billing`, `dashboard`.
**Done when (= Gate G1):** after `docker compose up`, every GET in §7.2/§7.4/§7.5/§7.6 returns the exact §6.4 shapes with plausible data; 7-day charts non-empty; `dashboard.updated` fires each cycle.

**M2 — Intelligence**
`services/analytics.py` + routers `anomalies`, `analytics` · `services/recommendation.py` (§10.4 incl. clamping via `policy_engine.check_limits`) · `services/cost.py` (`provide("cost_engine")`, incl. `budget_usage`) · alerts/notifications via ports · WS publishing (`metric.updated` only with subscribers, `dashboard.updated`, `resource.health_changed`, `anomaly.detected`, `recommendation.created`) · `mock_control` + scripted spike (§11).
**Done when (= Gate G2 part):** within ~5 min of startup a `SCALE_UP` for `checkout-api` appears with the exact §8 numbers; the first-boot scenarios (§11) yield their recommendations, health states, alerts and the cost anomaly.

**M3 — AI & extras**
`services/ai/*` + `api/v1/ai.py` (loopback tools with the caller's token, read-only, template fallback, 20 req/min limit) · budget threshold alerts · cost forecast · **stretch:** live AWS adapter (boto3 via `asyncio.to_thread`, `requirements-live.txt`).

**M4 — Hardening**
Indexes / N+1 (`GET /resources` < 300 ms), coverage of §14 rule 11 tests, document tunables, support integration.

**Rules:** you are the only writer of your tables (§16.5) · never import P2's internals — use ports (§16.6) · adapters never leak provider-specific names · every number the UI shows comes from your engines, not the LLM.
**Done =** §7 endpoints you own return exact shapes, engines reproduce the documented numbers, demo scenarios trigger on their own.

---

## 18. Integration & deployment runbook

### 18.1 Sync gates

| Gate | When | Must be merged | Pass criteria (on a clean `docker compose down -v && docker compose up --build`) |
|---|---|---|---|
| **G0 Skeleton** | P2 M0 done | P2 M0 | health UP · 4 logins work through nginx at `http://localhost` · `/api/docs` renders · `contracts/openapi.json` exported · CI green · P1 M0 builds on mocks · P3 M0 tests green |
| **G1 Read plane** | P3 M1 + P1 M1 | P2 M0–M1 · P3 M1 · P1 M1 | `smoke_api.py --group read` passes · P1 flips `VITE_USE_MOCKS=false` and Dashboard/Monitoring/Resources/Costs render real data (14 resources, non-empty charts) · `npm run contract:check` green |
| **G2 Workflow** | P2 M2 + P3 M2 + P1 M2 | everything above + P2 M2 · P3 M2 · P1 M2 | `smoke_api.py --group workflow` passes · UI smoke steps 1–6 (§18.3-B) pass on the real stack · live WS events reach the UI |
| **G3 Complete** | all M3 done | all M3 | all routes work · RBAC group passes for the 4 roles · AI fallback works with no LLM key · notifications arrive in-app · full UI smoke (1–8) |
| **G4 Release** | before demo/deploy | everything | §18.6 checklist green · deployed · post-deploy verification · demo rehearsed twice on the deployed URL |

### 18.2 How to integrate at every sync (the exact procedure)
1. **Each person:** rebase on `main`, run own tests + lint, open PR(s) titled `[Pn] Mx: …`.
2. **Person 2 merges in this order: P2 → P3 → P1** (§16.7) and tags nothing until step 6.
3. On a clean machine (or the VM): `git pull` → `docker compose down -v && docker compose up --build -d` → `docker compose ps` (all healthy).
4. **Contract check:** `python scripts/smoke_api.py --base http://localhost/api/v1 --group <read|workflow|all>` (§18.3-A).
5. **Person 1:** set `VITE_USE_MOCKS=false` (build arg / `.env` for dev) and walk the gate's UI checklist; run `npm run gen:api && npm run contract:check`.
6. Any failure → look it up in §18.5 → the named owner fixes → repeat from step 1 (only the failing part). When green: `git tag gate-N`, everybody rebases, next milestone.
7. **P1 ↔ backend switch = env only.** No code change is allowed at integration time; if one is needed it's a contract bug → CONTRACT GAP.

### 18.3 Smoke tests

**A) `scripts/smoke_api.py` (Person 2 writes it in M3; usable earlier by group)** — `--base <url> --group read|rbac|workflow|all`
- **General (all groups):** every response has `success`; lists have `meta`; errors have `error.code`; **no snake_case keys** (except inside `tags`, `params`, `byHealth`, `byProvider`, `healthCounts`, `before`, `after`); all timestamps end in `Z`; every `*Usd` field is a number; `GET /resources/` (trailing slash) → 404 (not 307); missing token → 401; bad body → 400 `VALIDATION_ERROR`.
- **`read`:** logs in as `viewer`; GETs every read endpoint in §7 → 200 + envelope; `/resources` = 14 items across 3 providers; time-series ≤ 500 points; `/dashboard/overview` has all keys; `/system/health` UP.
- **`rbac`:** viewer `POST /actions` → 403; devops `POST /policies` → 403 and `PATCH /resources/{id}` → 403; devops `POST /actions/{id}/approve` → 403; manager `POST /budgets` → 201; only admin `GET /users` → 200; inactive/removed users → 401/403.
- **`workflow` (assumes a **fresh** database; fixed order):**
  1. As `devops`: `POST /actions/preview` `checkout-api` → 6 instances ⇒ `deltaMonthlyUsd == 60.74`, `allowed`.
  2. Wait (≤ 6 min, or call `POST /system/mock/spike` when `demoControls`) for a `NEW` `SCALE_UP` recommendation on `checkout-api` with `proposedAction.params.targetInstances == 6` and `costImpact.deltaMonthlyUsd == 60.74`; as `viewer` the same recommendation has `policyCheck.allowed == false` (PERMISSION failed).
  3. `devops` accepts it → 201, status `EXECUTING` → poll ≤ 30 s → `SUCCEEDED`; `GET /resources/{id}`.`quantity == 6`.
  4. `POST /actions` target **12** → 201 `BLOCKED`, POLICY check failed. Missing `Idempotency-Key` → 400. Target = current → 400. Unsupported action on `assets-bucket` → 400.
  5. `POST /actions` target **10** (from 6: +$121.47) → `PENDING_APPROVAL`, `requiresApproval`, `approverRole == MANAGER`. A second `POST /actions` on the same resource → **409**. Same `Idempotency-Key` twice → same action id.
  6. As `manager`: approve → poll ≤ 30 s → `SUCCEEDED`; `quantity == 10`.
  7. `worker-pool` `RIGHT_SIZE` recommendation (present after the first ingestion cycle): `devops` accepts → `SUCCEEDED`, `size == t3.medium`, delta `−91.10`.
  8. Cleanup: as `manager`, scale `checkout-api` back to 4 → `SUCCEEDED`. Check `GET /audit-logs` (manager) contains the actions above and `GET /notifications` (devops) is non-empty.

**B) UI smoke test (Person 1 with Person 2; also the demo rehearsal)**
1. Login as `devops@cloudops.dev` → dashboard shows live KPIs.
2. Wait for / trigger the spike → recommendation appears live + toast.
3. Open Review → cost impact, policy checks, AI explanation shown.
4. Apply (4 → 6) → status `EXECUTING → SUCCEEDED` live; CPU chart drops; audit entry exists; in-app notification arrives.
5. Scale `checkout-api` to **12** → `BLOCKED` with the safety-limit message.
6. Scale to **10** → `PENDING_APPROVAL` → login as `manager@cloudops.dev` → approve → succeeds.
7. `viewer@cloudops.dev`: no Apply/Approve buttons; calling the API directly returns `403`.
8. Stop the backend for ~20 s → UI falls back to polling and recovers on reconnect (no stale data after resync).

### 18.4 Integration edge-case register (each has a rule and an owner)

| # | Edge case | Rule that prevents it | Owner |
|---|---|---|---|
| 1 | snake_case leaks into JSON | `CamelModel` everywhere; smoke asserts no snake_case keys | P2/P3 |
| 2 | Money arrives as a string (Decimal) | schemas use `float`; smoke asserts numbers | P2/P3 |
| 3 | Nulls disappear from payloads | never `response_model_exclude_none` | P2/P3 |
| 4 | Validation errors return 422 in another shape | global handler → 400 `VALIDATION_ERROR` envelope | P2 |
| 5 | Naive/local timestamps | tz-aware UTC only; smoke asserts `Z` | P2/P3 |
| 6 | Trailing-slash redirect leaks the internal host | `redirect_slashes=False`; client never adds `/` | P2/P1 |
| 7 | Access token expires mid-session | single shared refresh then retry; WS closes 4401 → refresh + reconnect | P1/P2 |
| 8 | Multiple tabs invalidate each other's refresh token | **no rotation** (§7.1) | P2 |
| 9 | Stale role in JWT keeps old privileges | authorize with the DB role on every request | P2 |
| 10 | Double-click / network retry applies an action twice | `Idempotency-Key` + unique (user, key) | P1/P2 |
| 11 | Two actions race on one resource | partial unique index + `409`; UI disables Scale while one is in flight | P2/P1 |
| 12 | Recommendation accepted twice / expired | `409` unless `NEW` and not expired | P2 |
| 13 | No-op or unsupported action | `400` (structural) before anything is created | P2 |
| 14 | State changes between request and approval | re-validate at approve; `422` + `BLOCKED` | P2 |
| 15 | Backend restarts while an action is executing | startup recovery job resumes polling | P2 |
| 16 | Events missed during a WS drop | on reconnect: re-subscribe + invalidate all queries; polling fallback | P1 |
| 17 | Recommendation proposes something policy would block | engine clamps via `policy_engine.check_limits`, else skips | P3 |
| 18 | `policyCheck` differs per role but WS payload is shared | WS carries a light event; client refetches | P3/P1 |
| 19 | Two people write the same table | write-ownership map (§16.5) + ports | all |
| 20 | Model ≠ migration | only P2 authors models/migrations | P2 |
| 21 | Re-running the seed duplicates data | idempotent steps + deterministic ids; skip existing backfill | P2/P3 |
| 22 | New mock account shows nothing | MockAdapter creates 3 default resources on first sync | P3 |
| 23 | Mixed 5-min/1-min data skews analytics | resample to 5-min buckets first | P3 |
| 24 | One failing account stalls ingestion | per-account timeout, `gather(return_exceptions=True)`, account → `ERROR` | P3 |
| 25 | Blocking SDK call freezes the API | `asyncio.to_thread` for all blocking calls | P3 |
| 26 | Multi-worker breaks scheduler/WS | exactly 1 Uvicorn worker (§14 rule 8) | P2 |
| 27 | nginx can't resolve `backend` at startup | compose healthchecks + `depends_on: service_healthy` | P2/P1 |
| 28 | Managed DB URL scheme differs | normalize to `postgresql+asyncpg://` | P2 |
| 29 | `VITE_*` ignored in the Docker build | build args → `ENV` before `npm run build` | P1 |
| 30 | WebSocket dropped by the proxy | `Upgrade` headers + long `proxy_read_timeout` | P2/P1 |
| 31 | CORS errors in a split deployment | set `CORS_ORIGINS`; prefer the single-origin nginx setup | P2 |
| 32 | Unknown enum value from a newer backend | UI renders the raw string, never crashes | P1 |
| 33 | Huge time-series payloads | ≤ 500 points else 400; max `pageSize` 100 | P3 |
| 34 | Demo controls exposed in production | `ENABLE_DEMO_CONTROLS=false` (endpoint returns 404) | P2/P3 |
| 35 | Secrets leak (git, logs, WS URL) | `.env` git-ignored; never log credentials; `access_log off` on `/ws` | P2 |
| 36 | Cost numbers differ between UI, engine and smoke test | one price catalog (§11); smoke asserts `60.74` / `−91.10` | P3 |

### 18.5 Troubleshooting matrix

| Symptom | Likely cause | Owner | Fix |
|---|---|---|---|
| UI shows blank/`undefined` fields | camelCase/alias mismatch or renamed field | P2/P3 | fix schema alias; run `contract:check` |
| `401` loop / kicked to login | refresh not shared/retried, or clock/secret mismatch | P1 (client) / P2 (secret) | one in-flight refresh; same `JWT_SECRET` across restarts |
| Everything 404 under `/api` in prod | nginx `/api/` not proxied or wrong backend name | P2/P1 | check `nginx.conf`, compose service name `backend` |
| WebSocket connects then drops | missing `Upgrade` headers / timeout, or token expired | P2/P1 | §15.2 nginx block; handle 4401 |
| Charts empty on the real backend | no metrics ingested / seed skipped | P3 | check ingestion job logs, `SEED_ON_START=true` on first boot |
| No recommendation appears | spike not started, engine cool-down, or policy clamp skipped it | P3 | call `POST /system/mock/spike`; check logs; wait one cycle |
| Action stuck in `EXECUTING` | adapter never reports `SUCCEEDED` / polling stopped | P2/P3 | check `get_operation_status`; restart triggers recovery |
| `409` on Apply | another action in flight for the resource | P1 | show message; wait/cancel the pending one |
| `403` for a role that should work | permission map mismatch (§12) | P2 | fix `require()`/RBAC map |
| CORS error in browser | split origins without `CORS_ORIGINS` | P2 | set env or use the nginx single origin |
| Backend crash-loops on start | migration/seed error or missing env | P2 | `docker compose logs backend`; check `.env` |
| Numbers differ between pages | two cost code paths | P3 | route everything through `cost_engine` |
| AI panel errors | LLM key missing/timeout | P3 | fallback template must respond; check `LLM_API_KEY` |
| Docker build ignores `VITE_*` | args not passed | P1 | Dockerfile `ARG`→`ENV`; compose `build.args` |

### 18.6 Deployment runbook (Person 2 leads)

**Pre-deploy checklist**
- [ ] `main` is green; gate **G3** passed; tag `release-1`.
- [ ] `.env` for the target: `ENV=prod`, strong `DB_PASSWORD` / `JWT_SECRET` / `ENCRYPTION_KEY`, `LLM_API_KEY` (optional), SMTP/WhatsApp (optional).
- [ ] `SEED_ON_START=true` for the **first boot only** (demo users), then `false`. Real (non-demo) deployments: change the seeded passwords immediately.
- [ ] `ENABLE_DEMO_CONTROLS=true` for a demo, `false` otherwise. `PROVIDER_MODE=mock` for a demo; `live` needs `INSTALL_LIVE=true` build arg + real credentials.
- [ ] Exactly one backend worker; only ports 80/443 exposed; the database port is **not** published.
- [ ] HTTPS in front (required for `wss://` when the page is `https://`).

**Option A — single VPS / EC2 (recommended for demos)**
```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 git
git clone <repo-url> cloudops && cd cloudops
cp .env.example .env && nano .env            # fill secrets, ENV=prod
docker compose up -d --build
docker compose ps                            # db, backend, frontend all healthy
curl -s http://localhost/api/v1/system/health
python3 scripts/smoke_api.py --base http://localhost/api/v1 --group read
# HTTPS (Caddy): caddy reverse-proxy --from cloudops.example.com --to localhost:80
```
Update: `git pull && docker compose up -d --build` · Logs: `docker compose logs -f backend` · Backup: `docker compose exec db pg_dump -U cloudops cloudops > backup.sql` · Reset demo data: `docker compose down -v && docker compose up -d --build`.

**Option B — Render / Railway (managed)**
1. Create a PostgreSQL instance; copy its URL into the backend's `DATABASE_URL` (any `postgres://` form works — it is normalized).
2. Backend = Web Service from `backend/` (Docker), env vars from §15.1, health check path `/api/v1/system/health`, **one instance, always-on**.
3. Frontend = Static Site from `frontend/` (`npm ci && npm run build`, publish `dist`, rewrite `/*` → `/index.html`) with env `VITE_API_BASE_URL=https://<api-host>/api/v1`, `VITE_WS_URL=wss://<api-host>/ws`.
4. Backend `CORS_ORIGINS=https://<frontend-host>`.

**Post-deploy verification:** smoke `--group read` against the public URL → login as each role → dashboard loads → browser devtools shows the WS `101 Switching Protocols` → trigger the spike → recommendation + toast → run UI smoke (§18.3-B).

**Demo-day checklist:** reset to a fresh database ≈ 15 min before (`down -v && up -d --build`) so the scripted spike timing is clean · pre-login tabs as `devops` and `manager` · press *Simulate spike* if the timer is missed · keep a backup screen recording · rehearse the storyline (§1) twice on the deployed URL.

---

## 19. Out of scope for MVP (don't build unless asked)
Terraform apply, real invoice ingestion, multi-tenant orgs, SSO, Kubernetes-internal autoscaling, auto-apply of recommendations without a human, horizontal backend scaling (Redis pub/sub), Azure/GCP **live** adapters (they exist as mocks behind the same interface).

---

## 20. Change control
- Any API/type/enum/port change → edit **this file first**, bump the version, add a changelog line, then tell everyone to **re-upload the new file to their AI**.
- After freeze only **additive** changes (new optional fields/endpoints) are allowed; renames/removals need all three persons' agreement.
- Missing/ambiguous detail → append to your `docs/gaps/pN.md`: `- [date] GAP: <what> · found by: Pn · proposal: <answer> · status: open`. Person 2 (contract keeper) decides within ~1 hour, updates this file (patch bump, e.g. `2.0.1`), and closes the gap. Until then, use the stub/mock and the most conservative interpretation.

**Changelog**
- `2.0.0` — **FINAL.** Added the 3-person split (§16–§18): ownership map, `ports.py` seam + stubs, auto-discovery, table write-ownership, playbooks per person ("I am Person N"), sync gates, integration procedure, smoke tests, edge-case register, troubleshooting, deployment runbook, demo storyline. **Contract changes vs 1.1:** no refresh-token rotation; `resources.manage` permission + `PATCH /resources/{id}`; one in-flight action per resource (409); structural errors → 400 vs rule violations → `BLOCKED`; `SystemHealth.demoControls` + `ENABLE_DEMO_CONTROLS`; WS: `dashboard.updated` added, `cost.updated` removed, `metric.updated` only on `resource:{id}`, `recommendation.created` is a light event, `user` channel; typed payloads for all endpoints (§6.4–§6.5); AI data access via loopback HTTP; 14-resource seed with scenarios, price catalog and ladders; DB role used for authorization; `actions.resource_id` nullable + `resource_name`; docker-compose sets `DATABASE_URL` from `DB_PASSWORD`; Docker build args for `VITE_*`; Uvicorn proxy headers.
- `1.1.0` — Stack change: Spring Boot → FastAPI + PostgreSQL, Next.js → React + Vite; single-origin Docker deployment; contract fixes (`supportedActions`, `CloudCredentials`, `Budget.forecastUsd`, `SuggestedAction`, `actions.read`, removed `BUDGET_GUARD`, per-viewer `policyCheck`).
- `1.0.0` — Initial contract.
