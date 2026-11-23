# Backend setup

Run these commands from `backend/` after configuring `.env` from `.env.example` and starting PostgreSQL:

```powershell
uv sync
uv run tortoise migrate
uv run python seed.py
```

`seed.py` reads `../seed.json`. It preserves IDs and seed timestamps, assigns deterministic IDs to membership, score, and meeting-attendee rows that have no IDs in the seed, and leaves rows already present in the database unchanged when rerun.

All seed rows are written inside one database transaction. If any record fails, the transaction rolls back and none of the seed changes are committed.
