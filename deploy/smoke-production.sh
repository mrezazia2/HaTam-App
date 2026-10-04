#!/usr/bin/env bash
set -euo pipefail

domains=(
  hatamestate.com
  web.hatamestate.com
  app.hatamestate.com
  admin.hatamestate.com
  consultant.hatamestate.com
  agency.hatamestate.com
  panel.hatamestate.com
  www.hatamestate.com
)

for domain in "${domains[@]}"; do
  code="$(curl --silent --show-error --location --output /dev/null --write-out '%{http_code}' --max-time 20 "https://$domain/")"
  [[ "$code" == "200" ]] || { echo "HTTPS smoke failed for $domain: HTTP $code" >&2; exit 1; }
  echo "$domain: HTTP $code"
done

health="$(curl --silent --show-error --fail --max-time 20 https://hatamestate.com/api/system/health)"
[[ "$health" == *'"status":"ready"'* ]] || { echo "Health endpoint is not ready: $health" >&2; exit 1; }
echo "Public HTTPS smoke checks passed. Continue with authenticated role, upload, chat, SMS and payment checks."
