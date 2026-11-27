# Altri Ninety EOS

## Verification

Run the complete verification sequence from the repository root:

```powershell
.\scripts\test.ps1
```

On Bash, run the equivalent script:

```bash
bash ./scripts/test.sh
```

The script stops on the first failure and returns a nonzero exit code. It runs Python's built-in `unittest` discovery from `backend/`, frontend lint, TypeScript checking, a production build, and the two-browser Playwright meeting synchronization test. Playwright retains traces on failure under `frontend/test-results/`; the script also copies each failure trace to `frontend/artifacts/` so a later run does not remove it. Failure output is printed in the terminal.

### Database fixture and cleanup

The API tests need the seeded PostgreSQL records and the database constraints installed by the repository's existing schema. The script reads connection settings from `backend/.env`, takes a read-only `pg_dump` snapshot of the configured database, restores it into a uniquely named `altri_test_<id>` database, and points the backend tests and temporary API server at that isolated database. The snapshot supplies the seed records and schema; test-created rows are cleaned up by the tests, and the script drops only its uniquely named database in its `finally` cleanup. It never resets or deletes the configured development database. PostgreSQL client tools (`pg_isready`, `pg_dump`, `createdb`, `pg_restore`, and `dropdb`) must be installed and available on `PATH`.

Tests freeze the application clock to `APP_NOW`. Its default is `2026-11-11T15:00:00Z`, and the verification script sets that value explicitly for repeatable runs. The backend's `APP_NOW` environment setting can be changed when running tests manually. Week boundaries use the company's `America/Chicago` timezone: weeks start Monday at 00:00 and finish Sunday at 23:59:59. Tests cover instants immediately before and at the following Monday boundary, so UTC conversion and daylight saving offsets are part of the expected behavior.

The Playwright test starts two independent browser contexts against the API and built frontend. The script starts both servers on temporary local ports, with the API using the same isolated database as the backend tests.

## Running the application

Configure `backend/.env` from `backend/.env.example`, then run `docker compose up --build`. The API documentation is available at `http://localhost:8000/docs`.
