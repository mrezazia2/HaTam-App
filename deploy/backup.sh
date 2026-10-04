#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
destination="${1:-$root/backups}"
retention_days="${HATAM_BACKUP_RETENTION_DAYS:-14}"
[[ "$retention_days" =~ ^[0-9]+$ ]] || { echo "HATAM_BACKUP_RETENTION_DAYS must be numeric." >&2; exit 1; }
mkdir -p "$destination"
destination="$(cd "$destination" && pwd)"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="hatam-data-${stamp}.tar.gz"
compose=(docker compose --env-file deploy/.env -f deploy/compose.yml)

"${compose[@]}" stop app reminders
trap '"${compose[@]}" start app reminders >/dev/null 2>&1 || true' EXIT
# Read the volume as the same unprivileged UID that owns uploaded media. The
# archive itself is written by the host shell, so restrictive 0600 uploads are
# backed up without granting the container extra capabilities.
"${compose[@]}" run --rm --no-deps --user 1000:1000 app tar -czf - -C /app/data . > "$destination/$archive"
(cd "$destination" && sha256sum "$archive" > "$archive.sha256")
"${compose[@]}" start app reminders
trap - EXIT
find "$destination" -maxdepth 1 -type f \( -name 'hatam-data-*.tar.gz' -o -name 'hatam-data-*.tar.gz.sha256' \) -mtime "+$retention_days" -delete
echo "Backup created: $destination/$archive"
