#!/bin/sh
set -eu

root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root_dir"

npm ci --ignore-scripts
npm audit --audit-level=high

node --check archive/one-time-fixes/create_job_photos_rls.js
node --check archive/one-time-fixes/fix_job_access.js
node --check archive/one-time-fixes/fix_job_gates.js
node --check archive/one-time-fixes/remove_duplicate_gate.js
node --check archive/scripts/verify_job.js

cd apps/web
npm ci
npm audit --audit-level=high
npm run typecheck
npx eslint components/views/KanbanView.tsx lib/api/rate-limit.ts middleware.ts --max-warnings=0
npm run build

port=18766
log_file="${TMPDIR:-/tmp}/legacy-field-command-proofline.log"
body_file="${TMPDIR:-/tmp}/legacy-field-command-proofline-body"
npx next start -p "$port" >"$log_file" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT INT TERM

attempt=0
until curl -fsS "http://127.0.0.1:$port/login" >"$body_file"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    cat "$log_file"
    exit 1
  fi
  sleep 1
done

grep -q 'Legacy Field Command' "$body_file"
grep -q 'Sign in' "$body_file"

root_status=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/")
api_status=$(curl -sS -o "$body_file" -w '%{http_code}' "http://127.0.0.1:$port/api/field/jobs")
test "$root_status" = '307'
test "$api_status" = '503'
grep -q 'SERVICE_NOT_CONFIGURED' "$body_file"

kill "$server_pid"
wait "$server_pid" 2>/dev/null || true
trap - EXIT INT TERM
