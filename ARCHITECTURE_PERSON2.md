# CloudOps — Person 2 Work Plan (4 Commits)

> **Companion to `ARCHITECTURE.md` v2.0.0 (FROZEN).** That file is still the contract.
> This file does one thing: it splits **Person 2's** work into **4 commits (C1–C4)** that can be written by
> **4 different agents, in parallel, without ever breaking each other's code.**
> **Version:** P2-PLAN 1.0.0 · **Rule #1:** if this file and `ARCHITECTURE.md` disagree on an endpoint, JSON
> shape, enum, error code, env var or table column → **`ARCHITECTURE.md` wins** (and that is a bug in this file,
> fix it via §12). On *who writes which file, in which commit* → **this file wins**.

---

## 0. START HERE — instructions for the agent writing a commit

You are writing **exactly one** commit: **C1**, **C2**, **C3** or **C4**. The user will tell you which
(`Write commit C3`). If they don't, ask once and wait.

1. Reply first with a **5-line confirmation**: which commit · the exact file list you will create · the files you
   will read but never edit · what you will stub via ports · your definition of done.
2. **Create only the files listed in your commit's "Files I create (EXCLUSIVE)" table.** Creating or editing *any*
   other file is a bug — even a one-line fix, even if it looks broken. Log a CONTRACT GAP instead (§12).
3. Every file in "Files I import (FROZEN)" **already exists exactly as specified in §4**. Do not re-derive,
   re-declare or shadow them. If your working tree does not have them yet, **assume §4 verbatim** and write
   against it — C1 lands before you merge (§11).
4. Output complete, runnable files — one fenced code block per file, preceded by its path. No `TODO`, no
   `pass  # later`, no placeholders in shipped code.
5. Cross-commit calls go through **`app.ports.use(...)` only** (§3 Law 4). Never
   `from app.services.alerts import ...` across a commit boundary.
6. When done, print a **COMMIT REPORT**: ✅ files created · ⚠️ deviations · ❓ contract gaps · 📣 what the other
   commits can now rely on · ▶️ the exact verification commands you ran.
7. Never invent endpoints, fields, enums, error codes, env vars, table columns or port methods.

---

## 1. What Person 2 owns (unchanged from `ARCHITECTURE.md` §16.1)

| | Person 2 |
|---|---|
| **Folders** | `backend/app/{main,bootstrap,ports,ports_stubs,export_openapi,seed}.py` · `core/` · `db/` · `realtime/` · `alembic/` · `jobs/{scheduler,recovery_jobs}.py` · `services/{policy,orchestrator,alerts,notifier,audit,notification/*}` · P2 routers & schemas · `docker-compose.yml` · `.env.example` · `backend/Dockerfile` · `requirements.txt` · `.github/` · `scripts/` · `contracts/` · `tests/{conftest.py,p2/}` · `docs/gaps/p2.md` |
| **Routers** | `auth` `users` `cloud_accounts` `recommendations` `actions` `policies`(+rbac) `budgets` `alerts` `notifications`(+settings) `audit` `system` |
| **Provides ports** | `policy_engine` `alerts` `notifier` `hub` `audit` |
| **Consumes ports** | `cost_engine` `ingestion` `adapters` (Person 3 — stubbed until they land) |
| **Never touches** | `frontend/**` · files inside `backend/app/adapters/` · P3 routers/services/schemas/seeds · `requirements-live.txt` |

---

## 2. The four commits at a glance

| | Commit | Title | Maps to | Provides after merge | Gate |
|---|---|---|---|---|---|
| **C1** | `[P2] C1` | **Foundation** — skeleton, config, DB + migration, security, RBAC, ports, auth, system, seeds, Docker, CI | M0 | The whole shared API (§16.6). **Unblocks P1, P3, C2, C3, C4.** | **G0** |
| **C2** | `[P2] C2` | **Realtime & notification plane** — WS hub + `/ws`, audit, alerts, notifier + 3 channels, alerts/notifications/audit routers | M1 (part) + M3 (part) | ports `hub` `audit` `alerts` `notifier` | G1 |
| **C3** | `[P2] C3` | **Control-plane CRUD** — users, cloud accounts, policies (+rbac roles), budgets | M1 (part) | admin surfaces for P1; policy/budget rows C4 reads | G1 |
| **C4** | `[P2] C4` | **Decision plane** — policy engine, orchestrator, actions, recommendations router, recovery job, smoke script | M2 + M3 (part) | port `policy_engine`; the demo workflow | **G2** |

**Dependency direction is strictly one-way: C1 → {C2, C3, C4}.**
C2, C3 and C4 **do not depend on each other at all** — they meet only through `ports.py` and the database, both
frozen in C1. That is what makes parallel authoring safe.

```
                 ┌──────── C2  realtime / alerts / notifications / audit ───────┐
C1 foundation ───┼──────── C3  users / accounts / policies / budgets ───────────┼──► integration
                 └──────── C4  policy engine / orchestrator / actions / recs ───┘
        (C2 ⟂ C3 ⟂ C4 : disjoint files, zero imports between them, ports + DB only)
```

---

## 3. The ten non-breakage laws (read before writing a line)

1. **One file has exactly one author commit.** The ownership matrix in §10 is exhaustive. If a file is not in
   your table, you may `import` it, never write it.
2. **C1 declares everything shared, up front.** Every symbol that crosses a commit boundary is written out in
   §4. C1 ships §4 *exactly*, including symbols nothing uses yet.
3. **Only C1 writes a migration.** One Alembic revision, id `0001_initial`, covering **all 17 tables of §5**.
   A missing column is a CONTRACT GAP, never a second migration. (This is why two agents can never produce
   conflicting revision graphs.)
4. **Cross-commit calls are ports-only.** C3 and C4 reach audit/alerts/notifier/hub **only** via
   `await use("audit").write(...)`, `await use("hub").publish(...)` — even though the same person wrote them.
   If C2 hasn't merged, `use()` returns C1's stub and your code still runs.
5. **Nobody edits `main.py`, `bootstrap.py`, `api/v1/__init__.py` or `jobs/scheduler.py` after C1.** Routers,
   jobs, seeds and port providers are **auto-discovered** (§4.9). You add a file; the app finds it.
6. **C1's `main.py` boots with any subset of C2/C3/C4 present.** Router discovery and the `/ws` mount are
   tolerant of missing modules. Every package directory — including empty ones — ships an `__init__.py` in C1.
7. **`requirements.txt` is complete in C1**, including `aiosmtplib`, `httpx`, `apscheduler`, `numpy` that only
   C2/C4 use. No later commit adds a dependency (that is a CONTRACT GAP).
8. **`.env.example` is complete in C1** — every variable of §15.1, including SMTP/WhatsApp used only by C2 and
   `ENABLE_DEMO_CONTROLS` used only by C4. No later commit adds an env var.
9. **`ci.yml` is written once, in C1, and is tolerant:** the smoke step runs `if [ -f scripts/smoke_api.py ]`,
   so CI is green before C4 exists and exercises the script after C4 lands.
10. **Generated files are never merged by hand.** `contracts/openapi.json` is regenerated at the end of every
    commit (`python -m app.export_openapi`). On a git conflict: delete it, re-run the exporter, commit.

> **Test-namespace law** (kills the last possible collision): every commit writes tests **only** into
> `backend/tests/p2/` with its own prefix — `test_c1_*.py`, `test_c2_*.py`, `test_c3_*.py`, `test_c4_*.py`.
> `conftest.py` belongs to C1 alone; the fixtures you need are already there (§4.11).

---

## 4. FROZEN INTERFACES — written by C1, relied on verbatim by C2/C3/C4

This is the *only* surface other commits may touch. C1: ship it exactly. C2/C3/C4: assume it exists exactly
like this, even if the file is not in your tree yet.

### 4.1 Package skeleton (C1 creates every directory **with an `__init__.py`**, even when empty)

```
backend/app/
  __init__.py  main.py  bootstrap.py  ports.py  ports_stubs.py  seed.py  export_openapi.py
  core/__init__.py  config.py  errors.py  security.py  deps.py  rbac.py  pagination.py  util.py
  db/__init__.py  session.py  base.py  models/__init__.py  (+ one module per table group)
  schemas/__init__.py  base.py  common.py  enums.py  auth.py  users.py  accounts.py
                       policies.py  budgets.py  alerts.py  notifications.py  audit.py
                       recommendations.py  actions.py  system.py
  api/__init__.py  api/v1/__init__.py  api/v1/auth.py  api/v1/system.py
  services/__init__.py  services/notification/__init__.py
  realtime/__init__.py
  jobs/__init__.py  jobs/scheduler.py
  adapters/__init__.py          # EMPTY package only — Person 3 fills it; C1 never adds files here
  seeds/__init__.py  seeds/core.py
```

The empty `__init__.py` files in `services/`, `realtime/`, `adapters/`, `jobs/`, `seeds/` are **load-bearing**:
`bootstrap.import_all` walks these packages and fails if one is missing.

### 4.2 `app/ports.py` — copy `ARCHITECTURE.md` §16.3 **verbatim**

No edits, no additions, ever, by anyone, in any commit — **including "harmless" optional keyword arguments.**
`use(name)` resolves at **call time**, never at import time. The two directions:

* **P2 provides:** `policy_engine` (C4) · `alerts` `notifier` `hub` `audit` (C2)
* **P2 consumes:** `cost_engine` `ingestion` `adapters` (Person 3)

### 4.3 `app/ports_stubs.py` — `STUBS: dict[str, Any]`

Per §16.3's stub table. The ones that make parallel work possible inside P2:

| Stub | Behaviour |
|---|---|
| `audit` | log at DEBUG, return `None` — C3/C4 run with no C2 |
| `alerts` / `notifier` | log; `raise_alert` → `None`; `resolve_alerts` → `0` |
| `hub` | log; `has_subscribers` → `False`; `publish*` → no-op |
| `policy_engine` | `check_limits` → `ValidationResult(allowed=True, requires_approval=False, approver_role=None, checks=[])` |
| `cost_engine` | `estimate_impact` → current = projected = `100.00`, delta `0.0`, `deltaPercent 0.0`, `budget=None`; `budget_usage` → `BudgetUsage(0.0, 0.0)` |
| `ingestion` | `sync_account` → set the account `CONNECTED` + `last_synced_at=utcnow()`; `refresh_resource` → no-op |
| `adapters` | `FakeAdapter`: empty lists; `execute` → `ProviderOperation(op_id, "SUCCEEDED")`; `validate_credentials` → ok |

### 4.4 `app/core/config.py`

```python
settings   # module-level singleton (pydantic-settings BaseSettings)
```
Fields (names frozen, all from §15.1): `env`, `database_url`, `jwt_secret`, `encryption_key`, `cors_origins`,
`seed_on_start`, `provider_mode`, `ingestion_interval_seconds`, `enable_demo_controls`, `llm_provider`,
`llm_api_key`, `llm_model`, `internal_api_base`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_password`,
`smtp_from`, `whatsapp_token`, `whatsapp_phone_number_id`, plus `app_version: str = "2.0.0"`,
`access_token_ttl_minutes: int = 15`, `refresh_token_ttl_days: int = 7`.
`database_url` normalizes `postgres://` / `postgresql://` → `postgresql+asyncpg://` (§14 rule 7).

### 4.5 `app/core/errors.py`

```python
class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, details: list[dict] | None = None) -> None: ...
    status: int; code: str; message: str; details: list[dict]
```
Raise this and nothing else. `main.py`'s handlers render the §4.1 envelope. Codes: §4.2 only.

### 4.6 `app/core/security.py`

```python
def hash_password(raw: str) -> str                                      # argon2
def verify_password(raw: str, hashed: str) -> bool
def create_access_token(user_id: UUID, role: str) -> tuple[str, int]    # (jwt, expires_in_seconds)
def create_refresh_token(user_id: UUID) -> tuple[str, UUID, datetime]   # (jwt, jti, expires_at)
def decode_token(token: str) -> dict                                    # bad/expired → ApiError(401,"UNAUTHENTICATED")
def encrypt_credentials(data: dict) -> str                              # Fernet
def decrypt_credentials(blob: str) -> dict
```

### 4.7 `app/core/deps.py`

```python
async def get_db() -> AsyncIterator[AsyncSession]
async def current_user(...) -> User                  # decodes JWT, loads the User row; missing/inactive → 401/403
def require(permission: str) -> Callable             # FastAPI dependency → 403 FORBIDDEN
async def current_user_ws(token: str) -> User | None # used by C2's /ws; returns None instead of raising
```
**Authorization always reads `user.role` from the DB row**, never the JWT claim (§4), so role changes and
deactivation take effect on the next request.

### 4.8 `app/core/rbac.py`

```python
PERMISSIONS: tuple[str, ...]                  # the 15 permissions of §6.3, in §6.3 order
ROLE_PERMISSIONS: dict[str, list[str]]        # exactly the §12 matrix
ROLE_ORDER: dict[str, int]                    # VIEWER 0 < DEVOPS 1 < MANAGER 2 < ADMIN 3
def permissions_for(role: str) -> list[str]
def role_at_least(role: str, minimum: str) -> bool
def roles_with_permission(permission: str) -> list[str]   # C2 builds notification audiences from this
```

### 4.9 Auto-discovery conventions (C1 writes the loaders; C2/C3/C4 just follow the shape)

| Kind | Convention | Written by |
|---|---|---|
| Router module | `router = APIRouter(tags=["<name>"])`, **full paths in the decorators** (`@router.get("/actions")`), no prefix, no trailing slash | C2, C3, C4 |
| Job module | `def register(scheduler: AsyncIOScheduler) -> None:` (one-off jobs use `run_date=now+N`) | C4 (`recovery_jobs.py`) |
| Seed module | `ORDER: int` + `async def run(db) -> None`, idempotent | C1 (`core.py`, `ORDER=10`) |
| Port provider | `provide("<name>", Impl())` on the **last line** of the implementing module | C2, C4 |
| WebSocket | `app/realtime/ws.py` exposes `router = APIRouter()` containing `@router.websocket("/ws")` | C2 |

`main.py` (C1) mounts the WS router **tolerantly**, so the app boots before C2 exists:

```python
try:
    from app.realtime.ws import router as ws_router
    app.include_router(ws_router)      # "/ws" is declared inside the module, NOT under /api/v1
except ModuleNotFoundError:
    log.warning("realtime.ws not present yet — WebSocket disabled")
```
`api/v1/__init__.py` skips modules without a `router` attribute. `bootstrap.import_all` tolerates a
`ModuleNotFoundError` from the optional packages (`app.adapters`, `app.realtime`) and logs it.

### 4.10 Schemas frozen in C1

`app/schemas/base.py` — `CamelModel`, `PageMeta`, `ApiResponse[T]`, `PagedResponse[T]`, exactly as §4.3.
`app/schemas/enums.py` — every enum of §6.1 (`StrEnum`, member name == value).
`app/schemas/common.py` — the shapes C4 **and** Person 3 both depend on:

```python
class BudgetImpact(CamelModel):
    name: str; limit_usd: float; used_usd: float; after_change_usd: float; within_budget: bool

class MoneyImpact(CamelModel):
    current_monthly_cost_usd: float; projected_monthly_cost_usd: float
    delta_monthly_usd: float; delta_percent: float; budget: BudgetImpact | None

class ActionParams(CamelModel):
    target_instances: int | None = None; target_size: str | None = None; target_storage_gb: float | None = None

class ProposedAction(CamelModel):
    type: ActionType; params: ActionParams

class ValidationCheck(CamelModel):
    name: Literal["PERMISSION", "POLICY", "BUDGET", "APPROVAL"]; passed: bool; message: str

class ValidationResult(CamelModel):
    allowed: bool; requires_approval: bool; approver_role: Role | None; checks: list[ValidationCheck]

class ActorRef(CamelModel):          # {id, name}: Action.requestedBy / approvedBy, AuditLog.actor
    id: UUID; name: str
```
Empty params (`START`/`STOP`) serialize as `{}`, never `null`. Nullable fields are always **present with `null`**
— `response_model_exclude_none` is banned everywhere.

**C1 also writes the remaining P2 schema modules in full** — `users, accounts, policies, budgets, alerts,
notifications, audit, recommendations, actions, auth, system` — from §6.3/§6.4. C2/C3/C4 **import** them and
never create or edit one. (Two agents must never author the same response shape; that is how camelCase drift and
`meta` inconsistencies get into a codebase.) A schema you need but cannot find → CONTRACT GAP, not a local model.

### 4.11 `pagination.py`, `util.py`, `conftest.py`

```python
# app/core/pagination.py — so C2, C3 and C4 emit byte-identical meta
class PageParams:  page: int = 1; page_size: int = 20        # FastAPI dependency; pageSize > 100 → 400
async def paginate(db, stmt, p: PageParams) -> tuple[list[Any], PageMeta]
def apply_sort(stmt, model, sort: str | None, allowed: set[str], default: str)   # unknown field → 400

# app/core/util.py
def utcnow() -> datetime      # tz-aware UTC
def money(v) -> float         # round(float(v), 2)
def iso(dt: datetime | None) -> str | None

# backend/tests/conftest.py fixtures (C1) — all four commits use these; nobody redefines them
db        # AsyncSession on a throwaway schema, rolled back per test
client    # httpx.AsyncClient over the ASGI app
seeded    # runs seeds/core.py → 4 users, 3 accounts, 3 policies, 2 budgets
auth      # auth("devops") -> {"Authorization": "Bearer …"} for any of the 4 seeded roles
```

### 4.12 ORM models — frozen attribute names (`from app.db.models import X`)

All 17 tables of §5 land in C1. Attributes are the **snake_case** column names of §5. Enum-valued columns are
plain `String` — **no native PostgreSQL enum types** (frozen, so nobody ever needs a second migration to add a
value). Money is `NUMERIC(14,2)`; schemas convert with `money()`. Every model has `id`, `created_at`,
`updated_at` except `Metric` (PK `(resource_id, metric, ts)`, no `id`/`updated_at`).

| Class | Module | Written to by |
|---|---|---|
| `User`, `RefreshToken` | `models/user.py` | C1 (seed + auth), C3 |
| `CloudAccount` | `models/cloud_account.py` | C3 — except `status` / `last_synced_at` (**Person 3**) |
| `Resource`, `Metric`, `Cost`, `PriceCatalog`, `Anomaly` | `models/resource.py`, `models/telemetry.py` | **Person 3 only** — P2 reads |
| `Recommendation` | `models/recommendation.py` | P3 inserts + sets `EXPIRED`; **C4** sets `ACCEPTED`/`DISMISSED` |
| `Policy`, `Budget` | `models/governance.py` | C3 |
| `Action` | `models/action.py` | **C4 only** |
| `Alert`, `Notification`, `NotificationSetting` | `models/notification.py` | **C2 only** |
| `AuditLog` | `models/audit.py` | **C2 only** (append-only, via `AuditPort`) |
| `AiConversation` | `models/ai.py` | Person 3 only |

The two partial unique indexes on `actions` and the one on `recommendations` (§5) **must be in `0001_initial`**,
authored by C1, even though only C4 relies on them.

---

## 5. COMMIT C1 — Foundation

**Goal:** the stack boots, migrates, seeds, logs in 4 users, serves `/api/docs` — and **every other commit, plus
Person 1 and Person 3, can start.** Nothing else in the repo exists yet, and that is fine.

### Files I create (EXCLUSIVE)

| Path | Notes |
|---|---|
| `docker-compose.yml` · `.env.example` · `.gitignore` · `README.md` · `CODEOWNERS` | §15.1, §15.2 verbatim |
| `.github/workflows/ci.yml` | ruff · `alembic upgrade head` · pytest (Postgres service) · OpenAPI drift · guarded compose-smoke (Law 9) |
| `scripts/wait_for_health.sh` · `contracts/.gitkeep` · `docs/gaps/p2.md` | |
| `backend/Dockerfile` · `requirements.txt` · `alembic.ini` · `alembic/env.py` · `alembic/versions/0001_initial.py` | **all 17 tables + the partial unique indexes** |
| every `__init__.py` of §4.1 | including the empty `adapters/` package |
| `app/main.py` · `bootstrap.py` · `ports.py` · `ports_stubs.py` · `export_openapi.py` · `seed.py` | §4.2, §4.3, §4.9 |
| `app/core/{config,errors,security,deps,rbac,pagination,util}.py` | §4.4–§4.8, §4.11 |
| `app/db/{session,base}.py` · `app/db/models/*` | §4.12 |
| **all** `app/schemas/*.py` | §4.10 |
| `app/api/v1/auth.py` · `app/api/v1/system.py` | §7.1 · `/system/health` (§7.13) |
| `app/jobs/scheduler.py` | `AsyncIOScheduler`, auto-discovers job modules exposing `register()` |
| `app/seeds/core.py` | `ORDER=10`: 4 users, 3 MOCK accounts, 3 policies, 2 budgets, default notification settings (§11) |
| `backend/tests/conftest.py` · `backend/tests/p2/test_c1_*.py` | §4.11 |

### Must-haves
- `FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json", redirect_slashes=False)`.
- Handlers for `ApiError`, `RequestValidationError` → **400 `VALIDATION_ERROR`**, `StarletteHTTPException`, and a
  bare `Exception` → 500 `INTERNAL_ERROR` (never leak a traceback). All four emit the §4.1 envelope.
- Lifespan: `import_all()` → `scheduler.start()` → yield → `scheduler.shutdown()`.
- CORS from `settings.cors_origins`; Dockerfile CMD runs `--workers 1 --proxy-headers --forwarded-allow-ips='*'`.
- `/auth/refresh` returns a **new access token and the same refresh token** (no rotation). `/auth/logout` revokes
  the `jti`. `/auth/me` returns `User` including `permissions`.
- `/system/health` needs **no auth** and returns `SystemHealth` with `demoControls` from `ENABLE_DEMO_CONTROLS`.
- Seeds idempotent, `uuid5`-deterministic, with the two fixed ids of §11 (`checkout-api` = `b4a2e0d1-…`,
  `devops@cloudops.dev` = `3d2f6b1e-…`).

### Definition of done (= Gate G0)
```bash
docker compose down -v && docker compose up --build -d
curl -s localhost/api/v1/system/health      # {"success":true,"data":{"status":"UP","db":"UP",…}}
# login works for admin / manager / devops / viewer, each returning its §12 permission list
curl -s localhost/api/docs                  # renders
python -m app.export_openapi                # writes contracts/openapi.json
pytest backend/tests/p2 -q && ruff check backend
curl -si localhost/api/v1/resources/        # 404, NOT 307
python -m app.seed && python -m app.seed    # second run changes no row counts
```
Then announce **"Skeleton is on main"** — C2/C3/C4, P1 and P3 unblock on that message.

**Commit message:** `[P2] C1: foundation — skeleton, models, migration, security, RBAC, ports, auth, seeds, docker, CI`

---

## 6. COMMIT C2 — Realtime & notification plane

**Goal:** provide the four P2 ports everyone else consumes (`hub`, `audit`, `alerts`, `notifier`) plus the read
surfaces for alerts, notifications and audit. **Depends on C1 only. Knows nothing about C3 or C4.**

### Files I create (EXCLUSIVE)

| Path | Contents |
|---|---|
| `app/realtime/hub.py` | connection registry, channel subscriptions, `hub = Hub()`, `provide("hub", hub)` |
| `app/realtime/ws.py` | `router = APIRouter()` with `@router.websocket("/ws")` |
| `app/services/audit.py` | `AuditPort` impl → `provide("audit", …)` |
| `app/services/alerts.py` | `AlertsPort` impl → `provide("alerts", …)` |
| `app/services/notifier.py` | `NotifierPort` impl → `provide("notifier", …)` |
| `app/services/notification/{base,in_app,email,whatsapp}.py` | channel ABC (§10.8) + 3 channels |
| `app/api/v1/{alerts,notifications,audit}.py` | §7.11 + `/audit-logs` (§7.13) |
| `backend/tests/p2/test_c2_*.py` | |

### Files I import (FROZEN — never edit)
`app.ports`, `app.core.*`, `app.db.models.{Alert,Notification,NotificationSetting,AuditLog,User,Action}`,
`app.schemas.{base,common,enums,alerts,notifications,audit}`, `app.core.rbac.roles_with_permission`.

### Frozen behaviour (the other commits code against this)

**Hub / `/ws` (§9)**
- `/ws?token=<accessToken>`. Bad or expired token → **close code 4401**, and no other close code for auth.
- Channels: `dashboard`, `alerts`, `actions`, `recommendations`, `resource:{uuid}`, `user`, `system`. `user` is
  subscribed **automatically on connect**; a client may not subscribe to someone else's user channel.
- Client frames: `{"action":"subscribe"|"unsubscribe","channels":[…]}` and `{"action":"ping"}` → `pong` on
  `system`. An unknown `action` is ignored, never fatal.
- **The hub is the only place that builds the §9 envelope** `{event, channel, ts, data}` and stamps `ts`
  (server-generated UTC, `…Z`). Callers pass `data` only, already camelCase.
- A failed send drops that socket and never propagates to the caller. Publishing to a channel with no
  subscribers is a silent no-op.

**Audit** — `write(db, *, actor_id, action, entity_type, entity_id, before=None, after=None)`.
`actor_id=None` means SYSTEM. Append-only — no update or delete path exists. **Never raises:** a failed audit
write logs an error and returns, because an audit failure must not fail a user's request.

**Alerts** — `raise_alert(...) -> UUID | None`. Dedupe key = (`source`, `title`, `resource_id`) among rows with
`status='OPEN'`; a duplicate returns `None` and writes nothing. On a new row: persist →
`notify_event("ALERT_CREATED", …)` → `hub.publish("alert.created", "alerts", Alert)`. `resolve_alerts(...)` flips
matching OPEN rows to `RESOLVED`, publishes `alert.resolved` per row, returns the count.

**Notifier** — `notify_event(db, event, *, title, body, entity_type=None, entity_id=None)`.
The frozen port carries no audience argument, so **the notifier resolves the audience itself** (§10.8):

| Event | Audience resolution |
|---|---|
| `ALERT_CREATED` | active users whose role has `metrics.read` |
| `RECOMMENDATION_CREATED` | active users with `actions.request` |
| `APPROVAL_REQUESTED` | users with `actions.approve` **and** `role_at_least(role, action.validation["approverRole"])` — read from the `actions` row named by `entity_type="ACTION"` / `entity_id` |
| `ACTION_COMPLETED` / `ACTION_FAILED` | the action's `requested_by` (+ `approved_by` when set) — same lookup |
| `BUDGET_THRESHOLD` / `COST_ANOMALY` | users with `budgets.write` |

> **Contract for C4 and Person 3:** for any action-related event you **must** pass `entity_type="ACTION"` and
> `entity_id=str(action.id)`, otherwise the audience cannot be resolved and the notifier logs "no recipients".
> This is exactly why `ports.py` needs no extra arguments — do not add any.

Fan-out honours each user's `notification_settings` (defaults: `IN_APP` on for all events; `EMAIL`/`WHATSAPP` off
until a `destination` is set). `InAppChannel` writes a `notifications` row **and**
`hub.publish_user(user_id, "notification.created", Notification)`. `EmailChannel` (aiosmtplib) and
`WhatsAppChannel` (httpx) **log instead of failing** when credentials are unset and run blocking work in
`asyncio.to_thread`. One row per (user, channel); `delivery_status ∈ SENT|FAILED|LOGGED`.

**Routers** — `GET /alerts` (`metrics.read`; filters `status,severity,page`; paginated) ·
`POST /alerts/{id}/acknowledge` · `/resolve` (`actions.request`) ·
`GET /notifications?unread=true&page`, `POST /notifications/{id}/read`, `POST /notifications/read-all` —
**caller's own rows only**: never a permission check, always a `user_id == current_user.id` filter ·
`GET /notification-settings`, `PUT /notification-settings`, `POST /notification-settings/test` ·
`GET /audit-logs` (`audit.read`; filters `actorId,entityType,from,to,page`; newest first; `actor: null` = SYSTEM).

### Definition of done
`pytest backend/tests/p2/test_c2_*.py` proves: 4401 on a bad token · subscribe/unsubscribe/ping→pong ·
`has_subscribers` accuracy · alert dedupe returns `None` and writes one row · `resolve_alerts` count +
`alert.resolved` published · in-app row + `publish_user` call · settings-driven fan-out · credential-less channels
log and never raise · audit row shape and the never-raises guarantee · user A's `/notifications` never contains
user B's rows. Then `python -m app.export_openapi` and commit `contracts/openapi.json`.

**Commit message:** `[P2] C2: realtime hub + /ws, audit, alerts, notifier with 3 channels, alerts/notifications/audit routers`

---

## 7. COMMIT C3 — Control-plane CRUD

**Goal:** the administrative surfaces. **Depends on C1 only.** Reaches C2 exclusively through `use("audit")`, and
Person 3 through `use("adapters")`, `use("ingestion")`, `use("cost_engine")` — so it is fully functional on stubs
even if neither has merged.

### Files I create (EXCLUSIVE)

| Path | Endpoints |
|---|---|
| `app/api/v1/users.py` | §7.13 `GET/POST/PATCH/DELETE /users` (`users.manage`) |
| `app/api/v1/cloud_accounts.py` | §7.3 `GET/POST /cloud-accounts`, `POST /cloud-accounts/{id}/sync`, `DELETE` |
| `app/api/v1/policies.py` | §7.10 policies CRUD **+ `GET /rbac/roles`** |
| `app/api/v1/budgets.py` | §7.10 budgets CRUD |
| `backend/tests/p2/test_c3_*.py` | |

### Files I import (FROZEN — never edit)
`app.ports.use`, `app.core.{deps,security,rbac,pagination,util,errors}`,
`app.db.models.{User,CloudAccount,Policy,Budget,Resource}`,
`app.schemas.{base,common,enums,users,accounts,policies,budgets}`.

### Frozen behaviour
- **Every write** calls
  `await use("audit").write(db, actor_id=user.id, action="<VERB>_<ENTITY>", entity_type="USER|CLOUD_ACCOUNT|POLICY|BUDGET", entity_id=obj.id, before=…, after=…)` (§14 rule 6).
  Never `import app.services.audit`.
- **Users:** password hashed via `security.hash_password`; `password_hash` never leaves the API. Deleting
  yourself → 400. Deactivation/deletion takes effect on the next request (DB-role authorization, §4).
  Response = `User` with `permissions` from `rbac.permissions_for(role)`.
- **Cloud accounts:** `credentials` **required when `mode=LIVE`**, validated with
  `use("adapters").get(account).validate_credentials(account)` → invalid → **400 `VALIDATION_ERROR`**.
  Stored via `security.encrypt_credentials`. Credentials are **never** returned and **never** logged.
  After create and on `/sync`: `await use("ingestion").sync_account(account.id)` then return
  `{"status": "SYNCING"}` immediately (the port returns fast by contract).
  **C3 never writes `status` or `last_synced_at` after creation** — those columns belong to Person 3 (§16.5);
  set `status="SYNCING"` only on the initial insert. `resourceCount` = `COUNT(resources)` for the account.
  `DELETE` cascades resources/metrics; `actions` keep their history (`resource_id` → NULL, `resource_name` kept).
- **Policies:** validate `rules` against `SafetyLimitRules` when `type=SAFETY_LIMIT` and `ApprovalRules` when
  `type=APPROVAL_RULE` (§6.3) — a mismatch is 400. Store as JSONB exactly as validated. `priority` orders display
  only; **all matching policies apply**. C3 never *evaluates* a policy — that is C4.
- **Budgets:** `usedUsd` / `usedPercent` / `forecastUsd` are **computed at read time** from
  `await use("cost_engine").budget_usage(db, budget.id)`; `usedPercent = round(used / amount * 100, 2)` (0 when
  `amount == 0`). Never stored, never accepted in a request body. With the C1 stub they are `0.0` — correct
  behaviour, not a bug.
- **`GET /rbac/roles`** returns `[{role, permissions}]` for the 4 roles straight from `rbac.ROLE_PERMISSIONS`.
- Permissions per §12: `users.manage`, `accounts.manage`, `policies.write` → ADMIN; `budgets.write` → MANAGER+;
  reads gated by `policies.read` / `resources.read`.
- 201 on POST for users/policies/budgets/cloud-accounts; `{"deleted": true}` on DELETE (never 204).

### Definition of done
`pytest backend/tests/p2/test_c3_*.py` proves: CRUD round-trips for all four entities · the full 403 matrix for
viewer/devops/manager/admin · credentials absent from every response **and** every log line · LIVE without
credentials → 400 · the budget read path calls `cost_engine` (assert on a fake registered with `provide`, not on
the number) · audit called on every write · `GET /rbac/roles` matches §12 exactly · `pageSize=101` → 400 ·
unknown `sort` field → 400. Then regenerate `contracts/openapi.json`.

**Commit message:** `[P2] C3: control-plane CRUD — users, cloud accounts, policies (+rbac), budgets`

---

## 8. COMMIT C4 — Decision plane

**Goal:** the heart of the demo — validate → approve → execute — plus the recommendations router and the smoke
script. **Depends on C1 only.** Reaches C2 via `use("audit"|"alerts"|"notifier"|"hub")` and Person 3 via
`use("cost_engine"|"adapters"|"ingestion")`. On pure stubs it still runs end to end (costs come back as 100.00,
execution succeeds immediately) — which is exactly how you test it before anyone else merges.

### Files I create (EXCLUSIVE)

| Path | Contents |
|---|---|
| `app/services/policy.py` | policy engine (§10.6) → `provide("policy_engine", …)` |
| `app/services/orchestrator.py` | state machine, idempotency, execution, polling |
| `app/api/v1/actions.py` | §7.9 |
| `app/api/v1/recommendations.py` | §7.8 |
| `app/jobs/recovery_jobs.py` | `register(scheduler)` — resume `EXECUTING` actions at startup |
| `scripts/smoke_api.py` | §18.3-A, `--base <url> --group read|rbac|workflow|all` |
| `backend/tests/p2/test_c4_*.py` | |

### Files I import (FROZEN — never edit)
`app.ports.{use,provide}`, `app.core.*`, `app.db.models.{Action,Policy,Budget,Resource,Recommendation,User,CloudAccount}`,
`app.schemas.{base,common,enums,actions,recommendations}`.
**Do not import `app.schemas.policies`** — the engine reads `policy.rules` as a plain dict, so C3 and C4 never
share a mutable surface. (Reading the `policies` table is allowed; writing it is not.)

### Frozen behaviour

**Policy engine (`services/policy.py`)**
```python
async def validate(db, *, user, resource, action_type, params, for_read=False) -> ValidationResult
async def check_limits(db, resource_id, action, impact) -> ValidationResult   # PolicyPort: steps 2–3, role-agnostic
provide("policy_engine", PolicyEngine())     # last line of the module
```
- **Structural checks run first and raise — no Action row is created** (§4 "structural vs rule"):
  resource missing → 404 · `action_type not in resource.supported_actions` → 400 · params missing/mistyped → 400 ·
  target equals current (no-op) → 400.
- **Rule checks collect ALL results, never fail fast**, in this exact order with these exact `name`s:
  `PERMISSION` → `POLICY` → `BUDGET` → `APPROVAL`. Messages are human-readable and rendered verbatim by the UI.
- `POLICY` = built-in bounds (`min_quantity ≤ target ≤ max_quantity`, target ≥ 1) **plus every enabled
  `SAFETY_LIMIT` whose scope matches** — all apply, most restrictive wins: `maxInstances`, `minInstances`,
  `maxScaleStepPercent`, `maxCostIncreasePerActionUsd`, `blockedActions`, `allowedWindows` (evaluated in each
  window's own timezone).
- `BUDGET` uses `MoneyImpact.budget`: `hardLimit && afterChange > amount` → failed. A **soft** overrun *passes*
  with a message starting `"Warning: "`.
- `APPROVAL` matches every enabled `APPROVAL_RULE` (`costDeltaMonthlyUsdGt` **OR** `actionTypeIn`);
  `approver_role` = the **highest** role among matched rules. If `role_at_least(user.role, approver_role)`, the
  check passes with `"You are authorized to approve this yourself."` while `requires_approval` stays **true**
  (so `approvedBy` gets filled) and no separate approval step is needed.
- `allowed = all(c.passed for c in checks)`. `for_read=True` (recommendations list) must write nothing.

**Orchestrator (`services/orchestrator.py`)** — the only writer of `actions`.
```
POST /actions
  ├ structural validation                                   → 400, before any row exists
  ├ Idempotency-Key missing → 400 ; repeat by same user      → return the ORIGINAL action, still 201
  ├ another PENDING_APPROVAL|APPROVED|EXECUTING for this resource → 409 CONFLICT
  ├ costImpact = use("cost_engine").estimate_impact(...)     (snapshot, stored on the row)
  ├ validation = policy.validate(...)
  ├ any check failed          → BLOCKED   (terminal, 201)
  ├ requiresApproval, role <  → PENDING_APPROVAL + notify_event("APPROVAL_REQUESTED", entity_type="ACTION", entity_id=…)
  └ otherwise                 → APPROVED → EXECUTING (background task)
```
- Execution: `use("adapters").get(account).execute(...)` inside `asyncio.create_task`, then poll
  `get_operation_status` **every 3 s, 5 min timeout** → `SUCCEEDED` | `FAILED`. On success,
  `await use("ingestion").refresh_resource(resource_id)`.
- **Every** state change: an audit row (`before`/`after`) + `use("hub").publish("action.status_changed",
  "actions", {"actionId": …, "status": …, "message": …})`, and on terminal states
  `notify_event("ACTION_COMPLETED"|"ACTION_FAILED", entity_type="ACTION", entity_id=…)`.
- **Approve re-validates** (§10.6). If it now fails → `422 POLICY_VIOLATION` or `422 BUDGET_EXCEEDED` **and** the
  action becomes `BLOCKED`. Approving a non-`PENDING_APPROVAL` action → 409. The approver needs `actions.approve`
  **and** `role_at_least(role, validation.approverRole)`, else 403.
- `reject` (needs `actions.approve`) → `REJECTED`; `cancel` (**requester only**, from `PENDING_APPROVAL` only) →
  `CANCELLED`. Both terminal.
- `POST /actions/preview` is a **pure dry run**: no row, no audit, no notification, and it **ignores the
  in-flight rule** (never 409). Returns `{costImpact, validation}`.
- `resource_name` is denormalized onto the row at creation so deleted resources keep a readable history.

**Recommendations router (`api/v1/recommendations.py`)**
- `GET /recommendations` and `/{id}`: rows come from Person 3; **`policyCheck` is computed per requesting user at
  read time** via `policy.validate(..., for_read=True)`. The column does not exist and must not be added.
  Newest first, paginated, filters `status,type,resourceId,provider`.
- `POST /{id}/accept` (201): 409 unless `status == NEW` and `expires_at` is in the future. Build the action from
  `proposed_action`. The recommendation becomes `ACCEPTED` **unless the resulting action is `BLOCKED`** — then it
  stays `NEW`. C4 sets only `ACCEPTED` / `DISMISSED` / `dismissed_*` (§16.5); never `EXPIRED`, never an insert.
- `POST /{id}/dismiss`: `DISMISSED` + `dismissed_at` / `dismissed_by`, optional `reason`.

**Recovery job** — one-off at startup (`run_date=now+5s`): every `EXECUTING` action with a
`provider_operation_id` resumes polling; one without → `FAILED` with a clear `error`.

### Definition of done
`pytest backend/tests/p2/test_c4_*.py` — **all on stubs, no Person 3 code required** — proves: `BLOCKED` ·
`PENDING_APPROVAL` → approve → `EXECUTING` → `SUCCEEDED` · reject · cancel · approve-time re-validation → 422 +
`BLOCKED` · in-flight 409 · idempotent repeat returns the same id · missing `Idempotency-Key` → 400 · no-op → 400
· unsupported action → 400 · preview writes nothing and never 409s · each policy rule in isolation (maxInstances,
minInstances, step %, cost cap, blockedActions, allowedWindows, built-in bounds) · soft vs hard budget ·
`check_limits` ignores PERMISSION/APPROVAL · per-role `policyCheck` (viewer → `allowed=false`, PERMISSION failed)
· accept on a non-`NEW`/expired recommendation → 409 · an accept that ends `BLOCKED` leaves it `NEW` · recovery
resumes. Then run `scripts/smoke_api.py --group workflow` against a live stack and regenerate the OpenAPI export.

**Commit message:** `[P2] C4: policy engine, orchestrator, actions + recommendations routers, recovery job, smoke script`

---

## 9. Hard rules for whoever writes C2, C3 or C4

1. Do **not** create `main.py`, `bootstrap.py`, `ports.py`, `ports_stubs.py`, `jobs/scheduler.py`,
   `api/v1/__init__.py`, any `schemas/*.py`, any `db/models/*`, any migration, `requirements.txt`,
   `.env.example`, `docker-compose.yml`, `Dockerfile`, `ci.yml` or `conftest.py`. Ever. They are C1's.
2. Do **not** import another commit's module. The legal cross-boundary imports are exactly §4; everything else
   goes through `use(...)`.
3. Do **not** add a column, env var, dependency, enum value, permission, WS event, port argument or error code.
   → CONTRACT GAP.
4. Do **not** write a table you don't own (§4.12 / §16.5). C3 writes `users`, `cloud_accounts`, `policies`,
   `budgets`; C2 writes `alerts`, `notifications`, `notification_settings`, `audit_logs`; C4 writes `actions` and
   the recommendation status columns. **Reading any table is always allowed.**
5. Do **not** call `use()` at import time — only inside functions, at call time. Otherwise you capture a stub
   forever and the real implementation never takes over.
6. `provide(...)` goes on the **last line** of the implementing module, after the class is fully defined.
7. Router modules declare **full paths**, **no prefix**, **no trailing slash** (`@router.get("/cloud-accounts")`).
8. Return `ApiResponse[T]` / `PagedResponse[T]`. `meta` appears **only** on paginated lists. Money is `float`,
   2 decimals, `*Usd` suffix. Timestamps are tz-aware UTC serialized with `Z`. No snake_case in any payload
   except inside `tags`, `params`, `before`, `after`.
9. Keep routers thin: parse → service → schema. Logic lives in `services/` so it is testable without HTTP.
10. Tests live in `backend/tests/p2/test_c<N>_*.py` and use only C1's fixtures.

---

## 10. File → commit ownership matrix (the conflict-free proof)

| Area | C1 | C2 | C3 | C4 |
|---|:-:|:-:|:-:|:-:|
| repo root, docker, CI, `scripts/wait_for_health.sh` | ✅ | | | |
| `scripts/smoke_api.py` | | | | ✅ |
| migration, models, `db/` | ✅ | | | |
| `core/*`, `ports*.py`, `bootstrap`, `main`, `seed`, `seeds/core`, `export_openapi` | ✅ | | | |
| **all** `schemas/*` | ✅ | | | |
| `jobs/scheduler.py` | ✅ | | | |
| `jobs/recovery_jobs.py` | | | | ✅ |
| `api/v1/auth`, `system` | ✅ | | | |
| `api/v1/alerts`, `notifications`, `audit` | | ✅ | | |
| `api/v1/users`, `cloud_accounts`, `policies`, `budgets` | | | ✅ | |
| `api/v1/actions`, `recommendations` | | | | ✅ |
| `realtime/*` | | ✅ | | |
| `services/audit`, `alerts`, `notifier`, `notification/*` | | ✅ | | |
| `services/policy`, `orchestrator` | | | | ✅ |
| `tests/conftest.py` | ✅ | | | |
| `tests/p2/test_c<N>_*.py` | ✅ | ✅ | ✅ | ✅ |
| `contracts/openapi.json` | regenerated by every commit, never merged by hand (Law 10) | | | |

**Every row has exactly one owner**, so `git merge` has nothing to resolve. And because the only runtime coupling
is `ports.py` + the DB schema — both authored once, in C1 — no commit can change behaviour another commit
depends on.

---

## 11. How the four commits land

**Merge order: C1 → (C2 | C3 | C4, in any order) → integrate.**
C2, C3 and C4 may be written and reviewed fully in parallel; each rebases on a `main` that already contains C1.

At each merge:
```bash
git pull && docker compose down -v && docker compose up --build -d
docker compose ps                                     # db, backend healthy
pytest backend/tests/p2 -q && ruff check backend
python -m app.export_openapi && git diff --stat contracts/openapi.json
python scripts/smoke_api.py --base http://localhost/api/v1 --group read    # once C4 has landed
```

Mapping back to the team gates of §18.1: **C1 = G0** · **C2 + C3 (+ P3 M1, P1 M1) = G1** ·
**C4 (+ P3 M2, P1 M2) = G2** · all four + §18.6 = G3/G4.

If one commit lands while another is still missing, nothing breaks — the system just behaves conservatively:
no WS events (hub stub), no audit rows (audit stub), zeroed budget usage (cost_engine stub), instant successful
execution (adapters stub), everything allowed (policy_engine stub). Each of those disappears the moment the real
provider registers. **That is the design, not a defect** — and it is also how you demo any single commit alone.

---

## 12. Contract gaps

Anything missing, ambiguous or apparently wrong: **do not improvise.** Append to `docs/gaps/p2.md`:

```
- [2026-09-19] GAP: <what is missing> · commit: C3 · proposal: <most conservative fix> · status: open
```
…then continue with the most conservative interpretation consistent with `ARCHITECTURE.md`, and say so in your
COMMIT REPORT. Person 2 (contract keeper) resolves it, patches `ARCHITECTURE.md` with a version bump, and the
affected commit is amended. Never silently change a frozen interface — a rename in `ports.py`,
`schemas/common.py` or a model is the one thing that can break another agent's already-written code.

---

**Changelog**
- `P2-PLAN 1.0.0` — split Person 2's M0–M4 into commits C1–C4: exclusive file ownership per commit, all shared
  interfaces hoisted into C1 and frozen, ports-only coupling between P2's own commits, tolerant bootstrap/CI so
  any subset boots, per-commit test namespaces, merge protocol and gate mapping.
