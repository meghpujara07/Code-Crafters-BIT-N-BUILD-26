# Person 2 — C4 Decision Plane Completion

Commit target: `[P2] C4 Decision plane — policy engine, orchestrator, actions, recommendations router, recovery job`

## Implemented

- `app/services/policy.py`
  - structural rule evaluation through the policy port
  - permission, safety-policy, budget, and approval evaluation
  - matching by provider/account/resource type/tags
  - most restrictive safety limits
  - allowed windows with timezone support
  - role hierarchy for approvals
- `app/services/orchestrator.py`
  - structural validation before action creation
  - idempotency replay
  - in-flight conflict handling
  - BLOCKED / PENDING_APPROVAL / APPROVED / EXECUTING / SUCCEEDED / FAILED / REJECTED / CANCELLED flow
  - approve-time revalidation
  - provider execution + 3-second polling + 5-minute timeout
  - resource refresh after success
  - audit, notifications and `action.status_changed` WebSocket event
- `app/api/v1/actions.py`
  - preview, create, list, get, approve, reject, cancel
- `app/api/v1/recommendations.py`
  - list/get with per-requester `policyCheck`
  - accept → action creation
  - dismiss
- `app/jobs/recovery_jobs.py`
  - startup recovery for EXECUTING actions
- `alembic/versions/0002_c4_action_indexes.py`
  - partial unique in-flight action index
  - removes the permanent recommendation `(resource,type)` uniqueness constraint so lifecycle/cooldown behavior can work
- `app/main.py`
  - startup recovery hook
- `app/db/models/action.py`
  - SQLAlchemy representation of the in-flight partial unique index
- `app/seeds/core.py`
  - demo password and policy values aligned with the frozen architecture
- `backend/tests/p2/test_c4_decision_plane.py`
  - C4 unit coverage for policy blocking, blocked action creation, no-op/unsupported validation

## Verification performed

- `python -m compileall -q app backend/tests` — PASS
- `pytest -q backend/tests/p2` — **19 passed**
- `python -m app.export_openapi` — PASS
- OpenAPI contains the C4 action/recommendation routes under `/api/v1`

## Docker/PostgreSQL integration

The C4 code is wired for the existing Docker/PostgreSQL architecture, including the `service_healthy` database dependency and Alembic migration. Docker was not available in the execution environment used to verify this artifact, so the final real-PostgreSQL workflow must be run on a machine with Docker.

Recommended final gate:

```bash
docker compose down -v
docker compose up --build -d
docker compose ps
python scripts/smoke_api.py --base http://localhost/api/v1 --group workflow
```

The smoke script itself is intentionally left for C4/M3, exactly as specified by the architecture.
