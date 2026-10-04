#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
env_file="deploy/.env"

command -v docker >/dev/null || { echo "Docker is not installed." >&2; exit 1; }
docker compose version >/dev/null || { echo "Docker Compose v2 is not available." >&2; exit 1; }
[[ -f "$env_file" ]] || { echo "Missing deploy/.env; copy deploy/env.template first." >&2; exit 1; }

set -a
# shellcheck disable=SC1091
source "$env_file"
set +a

for name in AUTH_SECRET INTEGRATION_SECRET_KEY AUTOMATION_SECRET; do
  value="${!name:-}"
  [[ ${#value} -ge 32 && "$value" != CHANGE_ME* ]] || { echo "$name must be a unique secret of at least 32 characters." >&2; exit 1; }
done
[[ "${AUTH_SECRET}" != "${INTEGRATION_SECRET_KEY}" && "${AUTH_SECRET}" != "${AUTOMATION_SECRET}" && "${INTEGRATION_SECRET_KEY}" != "${AUTOMATION_SECRET}" ]] || { echo "Server secrets must be different." >&2; exit 1; }
[[ "${APP_DOMAIN:-}" == "hatamestate.com" ]] || { echo "APP_DOMAIN must be hatamestate.com." >&2; exit 1; }
[[ "${NODE_ENV:-}" == "production" ]] || { echo "NODE_ENV must be production." >&2; exit 1; }
[[ -z "${HATAM_PRESENTATION_MODE:-}" ]] || { echo "HATAM_PRESENTATION_MODE must not be set on the VPS." >&2; exit 1; }
[[ "${CADDY_EMAIL:-}" == *@* && "${CADDY_EMAIL}" != CHANGE_ME* ]] || { echo "Set a valid CADDY_EMAIL for certificate notices." >&2; exit 1; }

docker compose --env-file "$env_file" -f deploy/compose.yml config --quiet
echo "Preflight passed: environment and Compose configuration are valid."
