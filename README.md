# CloudOps Platform

A unified platform to monitor, manage, scale and cost‑analyze multi‑cloud infrastructure.

## Quick Start
```bash
# Copy example env and adjust as needed
cp .env.example .env

# Build and start services
docker compose up --build -d

# Wait for the API to become healthy
./scripts/wait_for_health.sh

# Run database migrations (handled automatically on container start)
# Seed initial data
python -m app.seed

# Open API docs
open http://localhost/api/docs
```

## Architecture
See `ARCHITECTURE.md` for the full design and commit plan.
