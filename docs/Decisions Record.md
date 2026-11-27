# Decision Record

Each decision gives the choice, the alternative I rejected, and the cost.

## 1. Data model

**Choice.** Every record carries a `team_id`. An Issue's source is stored as a JSON `source` (the API shape) plus typed nullable columns `source_measurable_id`, `source_rock_id` and `source_todo_id`. Composite FKs on `(id, team_id)` make cross-team links impossible, and a CHECK keeps the JSON and columns in sync with exactly one source set. A To-Do links to its Issue via `source_issue_id`, with the same composite FK. Scores use a company-local Monday `week_start` DATE (unique per Measurable and week). Timestamps are UTC, due dates are calendar dates in company time, and "now" comes from `APP_NOW`. A meeting's lifecycle is four nullable timestamps with an ordering CHECK, not a status column.

**Rejected.** JSON-only sources (no integrity), a polymorphic (type, id) pair (no FK), one join table per source type (more joins, little gain).

**Cost.** The redundancy depends on the CHECK, the constraints live in raw-SQL migrations the ORM doesn't see, and meeting state is derived.

## 2. API design and authorization

**Choice.** Team-scoped REST under `/traction/teams/{team_id}/...`. Authentication classes resolve the current user and their team membership, role and capabilities. Router-level dependencies verify team access, while per-route authorization dependencies enforce the required roles and capabilities server-side. This centralizes authorization instead of relying on frontend restrictions or scattered checks in individual handlers. Scores have a `PUT` upsert by (Measurable, week), since an empty cell has no row, plus a `PATCH` by ID. Make it an Issue is `POST /issues` with a `source` and is idempotent (it returns the existing unsolved Issue). Meeting transitions go through one `POST /meetings/state`.

**Rejected.** Flat resources with the team in the body (easier to skip the check), scattered role checks in individual handlers, and one endpoint per transition.

**Cost.** The transition endpoint is RPC-style, and authorization depends on correctly configuring each route's required role and capabilities.

## 3. Real-time transport and meeting state

**Choice.** Server-Sent Events, since writes already go through REST and the stream only flows one way. Postgres is the source of truth: section and timer are derived from stored timestamps, and clients use `server_now` to avoid clock skew. An overrun is a computed "over time" state, so there is no background timer and a restart loses nothing. Each connection first sends the full meeting state, then `meeting_state` and `workspace_updated` events, so late joins, refreshes and reconnects (facilitator included) recover for free. The browser reads the stream with `fetch` because `EventSource` can't send an `Authorization` header.

**Rejected.** WebSocket (more machinery for one-way data) and client polling.

**Cost.** Each connection polls the DB about every 0.5s. That is safe across workers without a broker but won't scale to many meetings (next step: LISTEN/NOTIFY or Redis). Transitions aren't row-locked, so simultaneous ones could race.

## 4. Duplicate-free Make it an Issue

**Choice.** Postgres guarantees it: partial unique indexes on open (`solved_at IS NULL`) Issues per source (team + Measurable + week, team + Rock, team + To-Do). On a conflict the API catches the `IntegrityError` and returns the existing Issue. An in-process lock per source avoids most conflicts, but it is only an optimization because it doesn't span workers. Solving an Issue frees the slot.

**Rejected.** Check-then-insert alone (races), advisory locks and `SELECT ... FOR UPDATE` (more moving parts).

**Cost.** The indexes use `source->>` JSON expressions, so they rely on the CHECK keeping the shape valid. Tests cover two simultaneous requests returning one Issue, and a direct duplicate insert being rejected by the database.

## 5. Historical meeting summaries

**Choice.** Snapshot it. When a meeting ends, the summary is built once and stored on the meeting in the same transaction as `ended_at`. It embeds what it needs (Measurable names, goals and statuses, Issue and To-Do titles, attendees, average rating), and code never rebuilds a non-empty summary. Later edits don't alter it, and the seeded meetings keep their seeded summaries.

**Rejected.** Computing it live from current rows (history would shift) and an audit or event table (more than needed).

**Cost.** Immutability is enforced in the app, not by a trigger. "During the meeting" is a timestamp window, not a stored meeting reference, so activity by non-attendees is counted. A `meeting_id` on Issues and To-Dos would be more precise.
