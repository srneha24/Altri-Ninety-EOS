# Backend (FastAPI API)

REST API and live meeting stream for Altri Ninety EOS. For the product overview, tests and assumptions see the [project README](../README.md). The API documentations, generated using Apidog during backend development, are also added in the repository &rarr; ([OpenAPI Spec](../docs/Altri%20Ninety%20EOS%20API%20Documentation.openapi.json) | [Markdown](../docs/Altri%20Ninety%20EOS%20API%20Documentation.md)).

## Stack

- Python 3.13, managed with [uv](https://docs.astral.sh/uv/)
- FastAPI (`fastapi[standard]`) with Pydantic request/response schemas
- Tortoise ORM on PostgreSQL 17 (`asyncpg`), with Tortoise migrations plus raw-SQL constraints
- JWT access and refresh tokens (`pyjwt`); roles and team access are enforced in the API
- Server-Sent Events for live meetings
- `unittest` and `httpx` for tests

## Layout

| Path | Contents |
| :-- | :-- |
| `main.py` | App setup, CORS, auth middleware, routers, `GET /server-now` |
| `apps/auth`, `apps/company`, `apps/traction` | Feature routers, schemas and views (traction holds scorecard, issues, to-dos, rocks and meetings) |
| `apps/traction/rules.py` | Business rules from section 2.6 (status, completion, progress, ordering, rating, rounding) |
| `models/` | Tortoise models and custom validators |
| `migrations/` | Schema migrations, including DB constraints and partial unique indexes |
| `conf/` | Settings, database, middleware, permissions, responses, exception handlers |
| `utils/` | Application clock (`APP_NOW`), tokens, logging, JSON helpers |
| `seed.py` | Loads `../seed.json`; idempotent, one transaction |
| `rules_report.py` | Prints every computed value from 2.6 as JSON |
| `tests/` | Rule, API and seed tests |

## Configuration

Copy `.env.example` to `.env` for local runs. Docker Compose sets these variables itself.

| Variable | Purpose |
| :-- | :-- |
| `JWT_SECRET` | Signs access and refresh tokens |
| `APP_NOW` | The application's "now" (default `2026-11-11T15:00:00Z`); the clock advances from this value |
| `FRONTEND_URL` | The frontend origin allowed by CORS (for example `http://localhost:3000`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection |

The `JWT_SECRET` in `docker-compose.yaml` is for demo use only. Set your own for anything beyond local evaluation.

## Run with Docker

From the repository root:

```bash
docker compose up --build            # database, backend and frontend
docker compose up --build db backend # backend and database only
```

On start, the backend container runs `tortoise migrate`, then `seed.py`, then `fastapi run` on port 8000. The image is built from the repository root because it copies `seed.json`.

## Run locally

Requirements: Python 3.13, `uv`, and a running PostgreSQL with an empty database (the default name is `ninety_eos_altri_db`).

```bash
cd backend
cp .env.example .env          # fill in the values
uv sync
uv run tortoise migrate
uv run python seed.py
uv run uvicorn main:app --reload
```

The API is at <http://localhost:8000> and the interactive docs are at <http://localhost:8000/docs>. The published reference is on [Apidog](https://share.apidog.com/e1be8b3d-6dcd-4a1f-a62e-f782bb60046e).

`seed.py` preserves the IDs and timestamps in `seed.json`, assigns deterministic IDs to rows that have none, and leaves existing rows unchanged when rerun. If any record fails, the whole transaction rolls back.

## Tests and rules report

The full suite (backend, frontend checks and the two-browser test) runs from the repository root with `scripts/test.sh` or `scripts/test.ps1`; see the root README. Backend tests alone, against a migrated and seeded database:

```bash
uv run python -m unittest discover -v
```

Rules report (add `--output <path>` to also write a file):

```bash
uv run python rules_report.py
```
