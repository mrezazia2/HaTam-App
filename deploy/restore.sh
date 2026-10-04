#!/usr/bin/env bash
set -euo pipefail

[[ "${1:-}" == "--confirm" && -f "${2:-}" ]] || { echo "Usage: bash deploy/restore.sh --confirm /absolute/path/hatam-data-*.tar.gz" >&2; exit 1; }
archive="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
checksum="$archive.sha256"
[[ -f "$checksum" ]] || { echo "Missing checksum: $checksum" >&2; exit 1; }
cd "$(dirname "${BASH_SOURCE[0]}")/.."
(cd "$(dirname "$checksum")" && sha256sum --check "$(basename "$checksum")")
compose=(docker compose --env-file deploy/.env -f deploy/compose.yml)
archive_name="$(basename "$archive")"

"${compose[@]}" stop app reminders
trap '"${compose[@]}" start app reminders >/dev/null 2>&1 || true' EXIT
"${compose[@]}" run --rm --no-deps -v "$(dirname "$archive"):/restore:ro" app sh -c 'find /app/data -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + && tar -xzf "/restore/$1" -C /app/data' sh "$archive_name"
"${compose[@]}" run --rm --no-deps app node scripts/vps.mjs migrate
"${compose[@]}" start app reminders
trap - EXIT
echo "Restore completed. Run bash deploy/release.sh and verify all roles."
