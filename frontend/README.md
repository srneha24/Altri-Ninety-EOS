# Frontend (Next.js)

The web app for Altri Ninety EOS: team page (Scorecard, Issues, To-Dos, Rocks) and the live Level 10 Meeting page. For the product overview, tests and assumptions see the [root README](../README.md).

## Stack

- Next.js 16 (App Router) with React 19 and strict TypeScript
- Tailwind CSS 4, shadcn/ui components (Base UI primitives), `lucide-react` icons, `next-themes`
- ESLint and Prettier
- Playwright for the two-browser end-to-end test
- Node.js 22

## Layout

| Path | Contents |
| :-- | :-- |
| `app/` | Routes: `/` (team page), `/login`, `/meeting` |
| `components/` | Section components (`scorecard-section`, `issues-section`, `todos-section`, `rocks-section`), `meeting-page`, workspace shell and providers |
| `components/ui/` | shadcn/ui components |
| `lib/` | API client and types, auth/token handling, the meeting event-stream reader, utilities |
| `hooks/` | Shared React hooks |
| `e2e/` | Playwright tests (`meeting-sync.spec.ts`, `source-issues.spec.ts`) |
| `artifacts/` | Committed Playwright failure trace |

Imports use the `@/` alias, rooted at this folder.

## How it talks to the API

- The API base URL comes from `NEXT_PUBLIC_API_URL`. It is inlined at build time, so changing it requires a rebuild.
- Login is by seeded email. Tokens are kept in `sessionStorage`, so each browser tab is its own session, which makes it easy to run two users side by side.
- Live meeting updates read the API's SSE stream (`.../meetings/{id}/sse`) with `fetch`, because the browser `EventSource` cannot send an `Authorization` header. The stream sends the full meeting state first and then incremental `meeting_state` and `workspace_updated` events.

## Configuration

```bash
cp .env.example .env.local
```

| Variable | Default | Purpose |
| :-- | :-- | :-- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the backend API |

The backend must allow the frontend's origin: set its `FRONTEND_URL` to wherever the frontend runs (for example `http://localhost:3000`).

## Run with Docker

From the repository root:

```bash
docker compose up --build            # database, backend and frontend
docker compose up --build frontend   # frontend (also starts the services it depends on)
```

The frontend is served at <http://localhost:3000>. `NEXT_PUBLIC_API_URL` is a build argument, set in `docker-compose.yaml` to `http://localhost:8000`. To build the image by itself:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 -t altri-ninety-eos-frontend ./frontend
```

## Run locally

Requirements: Node.js 22 and a running backend (see the [backend README](../backend/README.md)).

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

The app is at <http://localhost:3000>. Sign in with a seeded email such as `avery@acme.test` (Admin) or `blake@acme.test` (Team Member).

## Scripts

| Command | Purpose |
| :-- | :-- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier on `.ts` and `.tsx` files |

## End-to-end tests

The full suite, including these tests on an isolated database, runs from the repository root with `scripts/test.sh` or `scripts/test.ps1`. To run only the Playwright tests against servers you started yourself:

```bash
npx playwright install chromium
npm exec playwright -- test --reporter=list
```

There are two spec files in `e2e/`:

- `meeting-sync.spec.ts` — two independent browser contexts where the facilitator advances the agenda and the second browser follows. It ends any active `team_lead` meeting before it starts, so do not run it against data you care about.
- `source-issues.spec.ts` — a Team Member creates Issues from an overdue To-Do and an off-track Rock ("Make it an Issue"), then verifies they persist across a reload.

The tests use `PLAYWRIGHT_BASE_URL` (or `PLAYWRIGHT_PORT`) for the frontend and `NEXT_PUBLIC_API_URL` for the API, and keep traces on failure in `test-results/`.

## Notes

This project uses a newer Next.js release with breaking changes from older versions. Before changing framework-level code, read the docs shipped in `node_modules/next/dist/docs/` (see `AGENTS.md`).
