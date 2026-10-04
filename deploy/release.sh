#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
compose=(docker compose --env-file deploy/.env -f deploy/compose.yml)

bash deploy/preflight.sh
"${compose[@]}" build --pull
"${compose[@]}" up -d --remove-orphans

for attempt in $(seq 1 30); do
  if "${compose[@]}" exec -T app node -e "fetch('http://127.0.0.1:3000/api/system/health').then(async r=>{const b=await r.json();process.exit(r.ok&&b.status==='ready'?0:1)}).catch(()=>process.exit(1))"; then
    "${compose[@]}" ps
    echo "Release is healthy. Continue with HTTPS and role smoke checks."
    exit 0
  fi
  sleep 2
done

"${compose[@]}" logs --tail=120 app proxy reminders >&2
echo "Release failed its health check." >&2
exit 1
