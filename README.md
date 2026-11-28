# Altri Ninety EOS

A team-management app modeled on Ninety's EOS edition: Scorecard (Measurables), Rocks, To-Dos and Issues, plus a live Level 10 Meeting that several browsers can join. Built for the Senior AI-First Software Engineer Assessment.

**Stack:** Next.js (TypeScript, shadcn/ui, Tailwind) · FastAPI + Tortoise ORM · PostgreSQL 17 · Server-Sent Events for live meetings.

**More documentation:** [Backend README](backend/README.md) (API setup, configuration, layout) · [Frontend README](frontend/README.md) (app setup, configuration, layout).

## Table of Contents

- [Deliverables Overview](#deliverables-overview)
- [Repository Layout](#repository-layout)
- [Setup](#setup)
  - [Signing In](#signing-in)
  - [Clock](#clock)
- [Tests](#tests)
  - [Prerequisites](#prerequisites)
  - [Fixture Strategy](#fixture-strategy)
  - [Clock Strategy](#clock-strategy)
  - [Failure Artifact](#failure-artifact)
- [Rules Report](#rules-report)
- [Assumptions](#assumptions)
- [Known Limitations](#known-limitations)
- [Implemented Bonus Tasks](#implemented-bonus-tasks)
- [AI Tools Used](#ai-tools-used)

## Deliverables Overview

- [Docker Compose](docker-compose.yaml)
- Rules Report
  - Script ([rules_report.py](backend/rules_report.py))
  - Output JSON ([rules_report.json](backend/rules_report.json))
- [Playwright Failed Artifact](frontend/artifacts/meeting-sync-failure-trace.zip)
- [Decisions Record.md](docs/Decisions%20Record.md)
- [App Recording Loom](https://www.loom.com/share/053263bc308a462496cb43f457e96915)

## Repository Layout

- `backend/` — FastAPI application, Tortoise ORM models, database migrations, seed and rules-report scripts, and backend tests.
- `frontend/` — Next.js application with the workspace UI, API client, Playwright end-to-end tests, and shared components.
- `docs/` — Assessment brief, task requirements, and implementation decisions.
- `scripts/` — Cross-platform test runners for the complete backend and frontend verification suite.
- `seed.json` — Seeded companies, teams, users, memberships, and traction records.
- `docker-compose.yaml` — Local Docker environment for PostgreSQL, the API, and the frontend.

## Setup

```bash
docker compose up
```

The backend container runs migrations, loads `seed.json` and starts the API. The seed script is safe to rerun.

| Service | URL |
| :-- | :-- |
| Frontend | <http://localhost:3000> |
| API | <http://localhost:8000> |
| API docs (OpenAPI, live) | <http://localhost:8000/docs> |
| API documentation | [OpenAPI JSON](docs/Altri%20Ninety%20EOS%20API%20Documentation.openapi.json) \| [Markdown](docs/Altri%20Ninety%20EOS%20API%20Documentation.md) |

### Signing In

Enter a seeded email on the login page (no password; sign-up is out of scope). Examples: `avery@acme.test` (Admin), `blake@acme.test` (Team Member). All nine users and their roles are in `seed.json`.

### Clock

The app reads "now" from `APP_NOW` (default `2026-11-11T15:00:00Z`), not the system clock. The clock starts at that value when the backend starts and then advances in real time. To use another date: `APP_NOW=2026-12-01T15:00:00Z docker compose up --build`.

## Tests

Run everything with one command from the repository root:

```powershell
.\scripts\test.ps1
```

```bash
bash ./scripts/test.sh
```

The script stops on the first failure and exits nonzero. In order, it runs:

1. Backend tests: `unittest` discovery from `backend/`. These cover every rule in 2.6 with boundary cases, authorization (cross-team read refused, Observer writes refused, cross-team IDOR refused), concurrent Make it an Issue returning one Issue, database constraint rejections, one active meeting per team, summary-snapshot immutability and seed idempotency.
2. Frontend lint, TypeScript typecheck and production build.
3. Two Playwright end-to-end tests from `frontend/e2e/`:
   - the meeting synchronization test: two independent browser contexts where the facilitator advances the agenda and the second browser follows;
   - the source-to-Issue test: a Team Member creates Issues from an overdue To-Do and an off-track Rock ("Make it an Issue"), then verifies they persist across a reload.

### Prerequisites

`uv`, Node.js/npm, the PostgreSQL client tools (`pg_isready`, `pg_dump`, `createdb`, `pg_restore`, `dropdb`) on `PATH`, and `backend/.env` (copy `backend/.env.example`) pointing at a reachable PostgreSQL database that is already migrated and seeded. The Compose database does not publish a port by default, so for the tests either add `ports: ["5432:5432"]` to the `db` service (then use `DB_HOST=localhost` with the credentials in `docker-compose.yaml`) or use a local PostgreSQL and run `uv run tortoise migrate && uv run python seed.py` in `backend/`.

### Fixture Strategy

The script takes a read-only `pg_dump` of the configured database, restores it into a uniquely named `altri_test_<id>` database, and points both the backend tests and a temporary API server at that copy. The snapshot supplies the schema (including constraints) and the seed records. Tests delete the rows they create, and the script drops only its own `altri_test_<id>` database on exit, so the development database is never reset or modified.

### Clock Strategy

The script sets `APP_NOW=2026-11-11T15:00:00Z` explicitly, and tests freeze the application clock to it. Week boundaries use America/Chicago (Monday 00:00 to Sunday 23:59:59), and tests cover instants just before and at the Monday boundary, so UTC conversion and daylight saving are exercised. For the e2e test, the script starts the API and the built frontend on free local ports.

### Failure Artifact

Playwright retains traces on failure in `frontend/test-results/`, and the script copies each failure trace to `frontend/artifacts/`. A committed example is `frontend/artifacts/meeting-sync-failure-trace.zip`.

## Rules Report

One command prints every computed value from section 2.6 as JSON, in the format from the starter README. Everything is derived from the data and `APP_NOW`:

```bash
docker compose exec -T backend uv run --no-sync python rules_report.py > backend/rules_report.json
# at another date:
docker compose exec -T -e APP_NOW=2026-12-01T15:00:00Z backend uv run --no-sync python rules_report.py
```

The committed output for a freshly seeded database at the default `APP_NOW` is `backend/rules_report.json`.

## Assumptions

- A week runs Monday to Sunday in America/Chicago. The "last closed week" is the full week before the current one. A meeting's reviewed week is the week before the week it started.
- Make it an Issue is allowed only on off-track cells. Repeating it for the same unsolved Measurable and week returns the existing Issue. Once that Issue is solved, a new one can be created.
- A To-Do's due date is 7 calendar days after creation, in company time.
- Observers can join meetings and read everything, but cannot write, facilitate, rate or own anything. Admins act as Team Members in every team.
- Attendees are users who joined the meeting. Only attendees who are Admins or Team Members can rate, and only during Conclude.
- A meeting's "Issues solved / To-Dos created during the meeting" are the records whose timestamps fall between the meeting's start and end for that team.
- Login is by seeded email only, with no password.

## Known Limitations

- Live updates use SSE with a short server-side DB poll per connection. It is simple and works across workers, but it will not scale to many concurrent meetings without a pub/sub layer (Postgres LISTEN/NOTIFY or Redis).
- The in-process lock in Make it an Issue is only an optimization. Correctness comes from the partial unique indexes in Postgres, and the lock does not coordinate across workers.
- Meeting state transitions are not row-locked, so two simultaneous transitions from the same facilitator could race.
- Meeting activity is attributed by timestamp window, not by a stored meeting reference.
- The test script needs a host-reachable PostgreSQL and the PostgreSQL client tools installed (see Tests).

## Implemented Bonus Tasks

- **Make a Rock an Issue:** Team Members and Admins can create an Issue from an off-track Rock with an overdue milestone. The Issue links back to its source Rock, and an existing unsolved Issue is shown instead of creating a duplicate.
- **Make an overdue To-Do an Issue:** Team Members and Admins can create an Issue from an overdue, incomplete To-Do. The Issue links back to its source To-Do; an existing unsolved Issue is shown instead of creating a duplicate.
- Both actions preserve the source title as the Issue title. After an Issue is solved, the source can be converted again to create a new Issue.

## AI Tools Used

- **GitHub Copilot [GPT-6 Luna, GPT-6.1 Sol]**: Most of the frontend codes, database seeding script ([seed.py](backend/seed.py)).
- **ChatGPT Codex [GPT-6 Luna, GPT-5.6 Terra]**: Error fixes on the frontend, minor error fixes on the backend, custom migration file codes, later added frontend and backend testing codes, rules report script ([rules_report.py](backend/rules_report.py)), testing scripts ([scripts/](scripts/)).
- **Antigravity Agent [Gemini 3.8 Flash, Gemini 4 Hydrogen]**: Initial testing codes.
- **Claude [Sonnect 5.5]**: README files.
