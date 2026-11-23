# Repository guide

## User-mandated constraints

- Do not create database migration files or run migration commands unless explicitly instructed.
- Do not edit any README file unless explicitly instructed.
- Never edit `seed.json`, `assessment-brief.md`, `assessment-brief.docx`, or `Task README.md`.
- Never add a Python library. If one is needed, ask the user to install it before proceeding.
- Never edit `pyproject.toml`, `uv.lock`, or `package-lock.json`.

## Project context

This repository is a starter implementation of the EOS team-management assessment. The product spec and rules are in [assessment-brief.md](assessment-brief.md); seed records and expected report conventions are in [Task README.md](Task%20README.md) and [seed.json](seed.json). Keep the seeded IDs unchanged, and use the brief as the source of truth for domain behavior.

The app is split into two independently run projects:

- `backend/` is a FastAPI API using Tortoise ORM with PostgreSQL (`asyncpg`). [main.py](backend/main.py) configures the app, middleware, exception handlers, ORM lifecycle and feature routers. API areas are separated into `apps/auth`, `apps/company` and `apps/traction`; request/response schemas and handlers belong with their feature. Shared configuration, database registration, authentication middleware and permissions are in `backend/conf/`.
- `backend/models/` defines the persisted domain. `User` and `Membership` connect people to teams; `Company` and `Team` establish tenancy. Traction data connects `Measurable` to weekly `Score`, `Rock` to `Milestone`, `Issue` to optional source metadata, `Todo` to an optional source `Issue`, and `Meeting` to `MeetingAttendee`.
- `frontend/` is a Next.js App Router TypeScript app. `app/layout.tsx` provides global styles and theme setup; page-level UI lives under `app/`, shared UI under `components/`, and shared helpers under `lib/`. It currently contains the initial template rather than the assessment flows.

Backend feature routers are currently largely scaffolding. Extend the existing feature/model split rather than assuming a requested endpoint or behavior already exists. Enforce role and team access in the API, not only in the UI.

## Build, run and checks

Run commands from the relevant project directory.

### Backend (`backend/`)

- Install/sync dependencies: `uv sync`
- Run the API: `uv run uvicorn main:app --reload`
- Interactive API docs: `http://localhost:8000/docs`

Configure PostgreSQL and the backend variables in `.env` using `.env.example` as a template before starting the API. The project currently has no configured backend test runner, single-test command, or linter in `pyproject.toml`.

### Frontend (`frontend/`)

- Install dependencies: `npm ci`
- Development server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Lint one file: `npx eslint app/page.tsx` (replace with the file being changed)

There is currently no frontend test script or configured test runner, so there is no single-test command yet.

## Domain and implementation conventions

- The company timezone is `America/Chicago`. Store timestamps in UTC; interpret `week_start` and date-only due dates in company time. For time-dependent rules, use `APP_NOW` with the default and semantics documented in Task README, not the machine clock.
- Role values are lowercase (`admin`, `team_member`, `observer`); IDs are strings, including seeded IDs.
- Keep authorization and data integrity server-side. Reuse the ORM models and validators in `backend/utils/` for persistence rules; apply the assessment’s rounding, boundary, ordering and concurrency requirements when implementing computed behavior.
- Frontend TypeScript is strict and imports use the `@/` alias rooted at `frontend/`. Follow the existing shadcn/ui component organization and shared class-name helper when extending the UI.
- Before changing frontend code, follow `frontend/AGENTS.md`: this repository uses a newer Next.js release with breaking changes, so consult the relevant documentation shipped in `frontend/node_modules/next/dist/docs/`. `frontend/CLAUDE.md` points to the same instructions.
- Always make sure [AGENTS.md](AGENTS.md) and [copilot-instructions.md](.github/copilot-instructions.md) are synced.
