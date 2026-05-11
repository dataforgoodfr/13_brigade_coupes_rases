# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Brigade des Coupes Rases** is a web application for Canopée (an NGO) to detect, track, and validate illegal clear-cutting of forests in France. Satellite data from GlobEO is ingested by a data pipeline and stored in PostgreSQL/PostGIS. Volunteers and admins review detected clear cuts via an interactive map and a form workflow.

## Architecture

Four sub-projects, each with its own `pyproject.toml` or `package.json`:

- `backend/` — FastAPI + SQLAlchemy + PostGIS. Exposes `api/v1/` REST endpoints. Runs on port 8080.
- `frontend/` — React + Vite SPA (TypeScript). Runs on port 5173 (dev) or 8081 (Docker).
- `data_pipeline/` — Python scripts that seed the DB from GlobEO GeoPackage files.
- `analytics/` — standalone Python analytics scripts.

Deployed on **Clever Cloud**. CI/CD via GitHub Actions (`.github/workflows/`). Shared secrets in `keepass/secrets.kdbx`.

## Local Development

### Full stack with Docker (recommended for Mac)

```bash
# First time or after architecture changes:
docker compose down -v
./start_docker.sh

# Normal start:
docker compose up db pgadmin        # DB only
docker compose up                   # Full stack
```

- Backend Docs: http://localhost:8080/docs
- Frontend (Local Dev): http://localhost:5173
- Frontend (Docker): http://localhost:8081
- Admin Login (Web App): `admin@example.com` / `admin`
- Volunteer Login (Web App): `volunteer@example.com` / `volunteer`
- pgAdmin (DB Management): http://localhost:8888 (`devuser@devuser.com` / `devuser`)
- Mailpit: http://localhost:8025

> **Mac ARM64 note:** The `.venv` inside the backend container is protected by an anonymous Docker volume (`/app/.venv`). Do not remove the `- /app/.venv` volume entry from `docker-compose.yml`.

### Backend (local, no Docker)

```bash
cd backend
poetry install --with backend
poetry run alembic upgrade head
poetry run python -m seed_dev       # dev seed (admin@example.com / password, volunteer@example.com / password)
make devserver                      # starts on port 8080
```

Run a single test:
```bash
cd backend
poetry run pytest test/path/to/test_file.py::test_function_name
```

Run all tests:
```bash
cd backend
make test
```

Generate a new Alembic migration after modifying `models.py`:
```bash
cd backend
make generate-migration
```

### Frontend (local, no Docker)

```bash
cd frontend
pnpm i
pnpm dev              # port 5173, hits real backend
pnpm dev:mock         # uses MSW mocks, no backend needed
pnpm cleanup          # Biome format + lint
pnpm build            # type-check + production build
pnpm test             # Vitest unit tests
pnpm storybook        # component explorer
```

### Data pipeline seed (realistic data)

```bash
cd data_pipeline
poetry install
python -m bootstrap.scripts.seed_database \
  --natura2000-concat-filepath bootstrap/data/natura2000/natura2000_concat.fgb \
  --enriched-clear-cuts-filepath bootstrap/data/sufosat/sufosat_clusters_enriched.fgb \
  --database-url postgresql://devuser:devuser@localhost:5432/local \
  --sample 1000

# After seeding, sync reports:
curl -X POST "http://localhost:8080/api/v1/clear-cuts-reports/sync-reports"
```

## Backend Architecture

**Entry point:** `backend/app/main.py` — creates the FastAPI app, registers CORS middleware, includes all routers, and starts an APScheduler background scheduler via `lifespan`.

**Layer structure** (all under `backend/app/`):
- `models.py` — single file with all SQLAlchemy ORM models
- `routes/` — one file per resource, thin handlers that call services
- `services/` — business logic and DB queries
- `schemas/` — Pydantic request/response models
- `deps.py` — FastAPI dependency injection (DB session, current user)

**Key domain models** (`models.py`):
- `ClearCut` — individual detected polygon (PostGIS geometry, area, dates, forest type areas)
- `ClearCutReport` — groups one or more `ClearCut`s; has a `status` workflow and is assigned to a `User`
- `ClearCutForm` — volunteer-submitted review form linked to a `ClearCutReport`
- `EcologicalZoning` — protected zones (Natura 2000, etc.) intersecting clear cuts
- `Rules` — configurable thresholds (slope, area, ecological zoning) that determine illegality
- `User` — roles: `admin` or `volunteer`; can have assigned departments and favorite reports

**Report status workflow:**
`to_validate` → `waiting_for_validation` → `validated` / `legal_validated` / `final_validated` / `rejected`
> **Note on New Zones/Assignments:** Volunteer-created zones start at `to_validate` (blue color in UI) and are *not* automatically assigned. Instead, the creator becomes the `assignment_requested_by_id`. The user can pre-fill the form while waiting for an admin to approve the assignment request via the "Actions Requises" tab.

**Coordinates:** All API coordinates use `latitude/longitude` format (SRID 4326).

## Frontend Architecture

**Stack:** React 18, TypeScript, Vite, TanStack Router (file-based), Redux Toolkit, Tailwind CSS, Leaflet, Biome.

**Folder layout under `frontend/src/`:**
- `features/clear-cut/` — core feature: interactive map, clear-cut list, form editor
  - `store/clear-cuts-slice.ts` — all async thunks and Redux state for clear cuts
  - `store/clear-cuts.ts` — Zod schemas and TypeScript types
  - `store/status.ts` — status label/color mappings
- `features/admin/` — user management and rules configuration
- `features/user/` — auth, profile, "my assigned reports"
- `features/offline/` — PWA offline detection hooks
- `shared/store/` — Redux store setup, referential data (departments, ecological zonings, rules)
- `shared/api/api.ts` — `ky` HTTP client, auth token injection
- `routes/` — TanStack Router file-based route tree
- `mocks/` — MSW handlers for `pnpm dev:mock`

**State management pattern:** Each feature slice uses `createAppAsyncThunk` + `addRequestedContentCases` helpers (in `shared/store/thunk.ts`) that wrap async state in a `RequestedContent<T>` shape (`{ status: "idle" | "pending" | "success" | "error", value?: T }`).

**Offline / PWA:** Clear-cut forms are persisted to `localStorage` via `localStorageRepository`. When offline, `getClearCutsThunk` falls back to locally stored forms. PWA update prompt is configured in `vite.config.ts` with `registerType: "prompt"` to avoid interrupting active form edits.

**Form versioning:** `ClearCutFormVersions` tracks `original`, `current`, and `latest` (server version). An ETag-based conflict detection triggers a 409 flow if the server version has changed since the form was loaded.

## Environment Variables

Backend (`backend/.env.development`):
- `DATABASE_URL` — PostgreSQL connection string
- `ENVIRONMENT` — `development` | `test` | `production`
- `ALLOWED_ORIGINS` — comma-separated CORS origins
- `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` — image uploads

Frontend (`frontend/.env.development`):
- `VITE_API` — backend base URL (default `http://localhost:8080`)

## Commit & Branch Conventions

Branch names: `feature/name`, `chore/name`, `hotfix/name`

Commit format: `type(scope): description` — e.g. `chore(readme): ajouter détails`
