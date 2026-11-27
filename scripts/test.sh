#!/usr/bin/env bash

set -Eeuo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
backend_dir="$repo_root/backend"
frontend_dir="$repo_root/frontend"
backend_env_file="$backend_dir/.env"
run_id="$(od -An -N6 -tx1 /dev/urandom | tr -d ' \n')"
test_database="altri_test_${run_id}"
temp_root="$(mktemp -d "${TMPDIR:-/tmp}/altri-tests-${run_id}.XXXXXX")"
api_pid=""
frontend_pid=""
test_database_created=0
playwright_started=0
source_database=""

print_log_if_present() {
  local file="$1"
  if [[ -f "$file" ]]; then
    cat -- "$file"
  fi
}

stop_process_tree() {
  local pid="$1"
  local child
  while read -r child; do
    [[ -n "$child" ]] && stop_process_tree "$child"
  done < <(ps -o pid= --ppid "$pid" 2>/dev/null)
  kill -TERM "$pid" 2>/dev/null || true
}

stop_process() {
  local pid="$1"
  [[ -n "$pid" ]] || return 0
  if kill -0 "$pid" 2>/dev/null; then
    stop_process_tree "$pid"
    for _ in {1..30}; do
      kill -0 "$pid" 2>/dev/null || return 0
      sleep 0.1
    done
    kill -KILL "$pid" 2>/dev/null || true
  fi
}

cleanup() {
  local status=$?
  trap - EXIT
  set +e

  if (( status != 0 && playwright_started )); then
    local artifact_dir="$frontend_dir/artifacts"
    local trace_file
    if [[ -d "$frontend_dir/test-results" ]]; then
      while IFS= read -r -d '' trace_file; do
        mkdir -p -- "$artifact_dir"
        cp -- "$trace_file" "$artifact_dir/playwright-failure-${run_id}-$(basename "$(dirname -- "$trace_file")").zip"
        printf 'Preserved Playwright failure trace: %s\n' "${trace_file#"$repo_root"/}"
      done < <(find "$frontend_dir/test-results" -type f -name trace.zip -print0)
    fi
  fi

  stop_process "$frontend_pid"
  stop_process "$api_pid"

  if (( test_database_created )) && [[ "$test_database" =~ ^altri_test_[a-f0-9]{12}$ ]]; then
    dropdb --if-exists --force \
      --host "$DB_HOST" --port "$DB_PORT" --username "$DB_USER" \
      --maintenance-db postgres "$test_database"
    if (( $? != 0 )); then
      printf 'Warning: could not remove isolated test database %s. Normal development data was not modified.\n' "$test_database" >&2
      status=1
    fi
  fi

  rm -rf -- "$temp_root"
  exit "$status"
}
trap cleanup EXIT

run_check() {
  local label="$1"
  shift
  printf '\n=== %s ===\n' "$label"
  if "$@"; then
    return 0
  else
    local status=$?
    printf '%s failed with exit code %s.\n' "$label" "$status" >&2
    return "$status"
  fi
}

get_free_port() {
  node -e 'const net = require("node:net"); const server = net.createServer(); server.listen(0, "127.0.0.1", () => { console.log(server.address().port); server.close(); });'
}

wait_for_port() {
  local port="$1"
  local process_id="$2"
  local stdout_log="$3"
  local stderr_log="$4"
  local label="$5"

  for _ in {1..60}; do
    if ! kill -0 "$process_id" 2>/dev/null; then
      print_log_if_present "$stdout_log"
      print_log_if_present "$stderr_log"
      printf '%s process exited before becoming ready.\n' "$label" >&2
      return 1
    fi
    if node -e 'const net = require("node:net"); const socket = net.createConnection({host: "127.0.0.1", port: Number(process.argv[1])}); socket.once("connect", () => { socket.end(); process.exit(0); }); socket.once("error", () => process.exit(1));' "$port"; then
      return 0
    fi
    sleep 0.5
  done

  print_log_if_present "$stdout_log"
  print_log_if_present "$stderr_log"
  printf '%s did not become ready within 30 seconds.\n' "$label" >&2
  return 1
}

if [[ ! -f "$backend_env_file" ]]; then
  printf 'Missing %s. Configure the PostgreSQL connection in backend/.env first.\n' "$backend_env_file" >&2
  exit 1
fi

# backend/.env follows shell-compatible KEY=value syntax. Export values so
# process environment overrides the dotenv defaults in backend/conf/settings.py.
set -a
# shellcheck source=/dev/null
. "$backend_env_file"
set +a

for name in DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME; do
  if [[ -z "${!name:-}" ]]; then
    printf 'backend/.env must define %s to create an isolated PostgreSQL test database.\n' "$name" >&2
    exit 1
  fi
done

source_database="$DB_NAME"
DB_NAME="$test_database"
APP_NOW="2026-11-11T15:00:00Z"
UV_CACHE_DIR="$temp_root/uv-cache"
export DB_NAME APP_NOW UV_CACHE_DIR PGPASSWORD="$DB_PASSWORD"

api_port="$(get_free_port)"
frontend_port="$(get_free_port)"
API_PORT="$api_port"
PLAYWRIGHT_PORT="$frontend_port"
NEXT_PUBLIC_API_URL="http://127.0.0.1:$api_port"
PLAYWRIGHT_BASE_URL="http://127.0.0.1:$frontend_port"
FRONTEND_URL="$PLAYWRIGHT_BASE_URL"
export API_PORT PLAYWRIGHT_PORT NEXT_PUBLIC_API_URL PLAYWRIGHT_BASE_URL FRONTEND_URL

for command in pg_isready pg_dump createdb pg_restore dropdb uv npm node; do
  if ! command -v "$command" >/dev/null 2>&1; then
    printf 'Required command not found on PATH: %s\n' "$command" >&2
    exit 1
  fi
done

pg_isready --host "$DB_HOST" --port "$DB_PORT" --username "$DB_USER" --dbname "$source_database"
printf "Creating an isolated snapshot of '%s' in '%s'.\n" "$source_database" "$test_database"
snapshot_file="$temp_root/seeded-database.dump"
pg_dump --host "$DB_HOST" --port "$DB_PORT" --username "$DB_USER" \
  --format custom --no-owner --no-privileges --file "$snapshot_file" "$source_database"
createdb --host "$DB_HOST" --port "$DB_PORT" --username "$DB_USER" \
  --maintenance-db postgres "$test_database"
test_database_created=1
pg_restore --host "$DB_HOST" --port "$DB_PORT" --username "$DB_USER" \
  --no-owner --no-privileges --dbname "$test_database" "$snapshot_file"

run_check 'Backend unittest discovery (PostgreSQL snapshot)' \
  bash -c 'cd "$1" && uv run python -m unittest discover -v' _ "$backend_dir"
run_check 'Frontend lint' bash -c 'cd "$1" && npm run lint' _ "$frontend_dir"
run_check 'Frontend typecheck' bash -c 'cd "$1" && npm run typecheck' _ "$frontend_dir"
run_check 'Frontend production build' bash -c 'cd "$1" && npm run build' _ "$frontend_dir"

api_stdout="$temp_root/backend-server.stdout.log"
api_stderr="$temp_root/backend-server.stderr.log"
printf '\n=== Starting API on the isolated database ===\n'
(cd "$backend_dir" && uv run uvicorn main:app --host 127.0.0.1 --port "$api_port") >"$api_stdout" 2>"$api_stderr" &
api_pid=$!
wait_for_port "$api_port" "$api_pid" "$api_stdout" "$api_stderr" 'API'

frontend_stdout="$temp_root/frontend-server.stdout.log"
frontend_stderr="$temp_root/frontend-server.stderr.log"
printf '\n=== Starting frontend server ===\n'
(cd "$frontend_dir" && node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port "$frontend_port") >"$frontend_stdout" 2>"$frontend_stderr" &
frontend_pid=$!
wait_for_port "$frontend_port" "$frontend_pid" "$frontend_stdout" "$frontend_stderr" 'Frontend'

playwright_started=1
run_check 'Playwright two-browser meeting synchronization' \
  bash -c 'cd "$1" && npm exec playwright -- test --reporter=list' _ "$frontend_dir"

printf '\nAll requested checks passed. Playwright traces (if any failures) are in frontend/test-results/.\n'
