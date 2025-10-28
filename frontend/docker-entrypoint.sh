#!/usr/bin/env bash
set -euo pipefail

# Defaults
: "${API_BASE:=/api}"
: "${AMAP_KEY:=}"
: "${AMAP_JS_KEY:=}"

# Render env.js from template if present
TEMPLATE="/usr/share/nginx/html/env.template.js"
OUTPUT="/usr/share/nginx/html/env.js"
if [ -f "$TEMPLATE" ]; then
  echo "[entrypoint] Rendering env.js from env.template.js"
  envsubst < "$TEMPLATE" > "$OUTPUT"
else
  echo "[entrypoint] env.template.js not found; skipping runtime env rendering"
fi

# Start nginx (or any command passed in)
exec "$@"
