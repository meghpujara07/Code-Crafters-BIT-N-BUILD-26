# C1 Foundation Commit Implementation Plan

## Goal Description
Create the initial backend foundation for the CloudOps platform as defined in `ARCHITECTURE.md` and `ARCHITECTURE_PERSON2.md`. This includes project skeleton, Docker configuration, CI/CD pipeline, database migration, FastAPI core setup, and initial API routes, adhering to all architectural constraints.

## User Review Required
> [!IMPORTANT]
> Please review the list of files and confirm that the proposed structure matches your expectations. If any adjustments are needed (e.g., additional dependencies, naming conventions), let me know before we proceed.

## Proposed Changes
---
### Docker & Environment
#### [NEW] Dockerfile
`c:/Users/Ruchikar/Desktop/BIT N BUILD/backend/Dockerfile`
- Python 3.12 slim base
- Install build deps, copy requirements, install packages
- Copy application code and Alembic files
- Expose port 8000 and run `uvicorn app.main:app`

#### [NEW] requirements.txt
`c:/Users/Ruchikar/Desktop/BIT N BUILD/backend/requirements.txt`
- fastapi[all]
- uvicorn[standard]
- sqlalchemy[asyncio]
- asyncpg
- alembic
- pydantic>=2.0
- pyjwt
- argon2-cffi
- python-dotenv
- ruff (dev)
- pytest (dev)
- httpx (dev)

---
### Alembic Migration
#### [NEW] alembic.ini
`c:/Users/Ruchikar/Desktop/BIT N BUILD/alembic.ini`
- Standard Alembic config pointing to `backend/alembic` directory.

#### [NEW] alembic/env.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/alembic/env.py`
- Async engine setup, target metadata from `app.db.models`.

#### [NEW] alembic/versions/0001_initial.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/alembic/versions/0001_initial.py`
- Create all 17 tables as described in the architecture (users, roles, permissions, projects, environments, deployments, etc.).
- Use `String` columns for enum-like fields.

---
### Application Package Skeleton
#### [NEW] app/__init__.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/app/__init__.py`
- Export `app` instance.

#### [NEW] app/main.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/app/main.py`
- Create FastAPI app with `redirect_slashes=False`.
- Include routers from `app.api`.
- Add custom exception handler to wrap errors in `{"success": false, "error": {...}}`.

#### [NEW] app/bootstrap.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/app/bootstrap.py`
- Functions to initialise DB, run migrations, load seed data.

#### [NEW] app/ports.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/app/ports.py`
- Define abstract interfaces for external services (e.g., email, LLM, encryption).

#### [NEW] app/ports_stubs.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/app/ports_stubs.py`
- Simple stub implementations used in tests.

#### [NEW] app/core/
- `app/core/config.py` – loads environment variables via `python-dotenv` and provides typed config.
- `app/core/security.py` – password hashing (argon2) and JWT utilities.
- `app/core/exceptions.py` – custom exception classes.

#### [NEW] app/db/
- `app/db/base.py` – declarative base.
- `app/db/models.py` – SQLAlchemy ORM models for the 17 tables.
- `app/db/session.py` – async session maker.

#### [NEW] app/schemas/
- Pydantic models mirroring DB tables, using camelCase field aliases.

---
### API Routes
#### [NEW] app/api/__init__.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/app/api/__init__.py`
- Export routers.

#### [NEW] app/api/auth.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/app/api/auth.py`
- Endpoints for login, token refresh, password reset (skeleton).

#### [NEW] app/api/system.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/app/api/system.py`
- Health check endpoint (`/health`) returning `{ "success": true, "status": "ok" }`.

---
### Seed Data & Tests
#### [NEW] seeds/core.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/seeds/core.py`
- Insert default admin user, roles, permissions.

#### [NEW] tests/conftest.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/tests/conftest.py`
- Pytest fixtures for async DB session and test client.

#### [NEW] tests/test_health.py
`c:/Users/Ruchikar/Desktop/BIT N BUILD/tests/test_health.py`
- Verify `/health` returns expected payload.

---
### CI/CD Adjustments
- Ensure `.github/workflows/ci.yml` runs `alembic upgrade head` before tests.
- Add step to lint Dockerfile with `hadolint` (optional).

## Open Questions
> [!WARNING]
> 1. **Dependency Versions** – Do you require specific pinned versions for any packages (e.g., FastAPI 0.110.0)?
> 2. **Database URL** – Should the DB URL be read from `POSTGRES_URL` env var or a composite of separate vars (`POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.)?
> 3. **Auth Flow** – Do you need email verification flow now, or can we leave placeholders?
> 4. **Seed Data** – Any additional initial data beyond admin user/role?

## Verification Plan
### Automated Tests
- Run `pytest` to ensure health endpoint passes.
- Run Alembic migration against a temporary Postgres container.
- Lint with `ruff` and `hadolint`.

### Manual Verification
- Start the app via `docker-compose up` and manually hit `http://localhost:8000/health`.
- Verify JWT token generation works via `/auth/login` (once implemented).

Please confirm the plan or provide adjustments.
