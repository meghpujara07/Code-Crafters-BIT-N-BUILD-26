# CloudOps Frontend

Multi-cloud infrastructure control plane UI — React 18 + TypeScript + Vite.

## Quick Start

```bash
# Install dependencies
npm install

# Run with mock backend (no real backend needed)
VITE_USE_MOCKS=true npm run dev

# Run against a real backend
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build

# Docker
docker build -t cloudops-frontend .
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | REST API base URL |
| `VITE_WS_URL` | *(derived from window.location)* | WebSocket URL |
| `VITE_USE_MOCKS` | `false` | Enable MSW mock backend |

## Architecture

See `ARCHITECTURE.md` in the repo root for the full contract and team split. This frontend is **Person 1's** scope. All API types are in `src/api/types.ts`, matching §6 of the architecture doc verbatim.
