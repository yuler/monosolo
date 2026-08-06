#!/usr/bin/env bash
set -euo pipefail

# Colorized logging helpers that use gum when available, otherwise plain echo.
log()   { gum style --foreground 212 "✦ $*"; }
ok()    { gum style --foreground 78  "✔ $*"; }
warn()  { gum style --foreground 227 "⚠ $*"; }
step()  { gum style --foreground 99  "▶ $*"; }

if ! command -v gum >/dev/null 2>&1; then
  warn "gum not found; falling back to plain output"
  log()  { echo "✦ $*"; }
  ok()   { echo "✔ $*"; }
  warn() { echo "⚠ $*"; }
  step() { echo "▶ $*"; }
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

CORE_PORT="${CORE_PORT:-3001}"
WEB_PORT="${WEB_PORT:-3000}"

CORE_URL="http://core.monosolo.localhost:${CORE_PORT}"
WEB_URL="http://web.monosolo.localhost:${WEB_PORT}"

step "Local subdomain URLs (*.localhost → 127.0.0.1)"
ok "core  ${CORE_URL}"
ok "web   ${WEB_URL}"
log "Also: http://localhost:${CORE_PORT}  ·  http://localhost:${WEB_PORT}"
echo

# Let the debug gem allow remote connections, but avoid loading until `debugger` is called
export RUBY_DEBUG_OPEN="${RUBY_DEBUG_OPEN:-true}"
export RUBY_DEBUG_LAZY="${RUBY_DEBUG_LAZY:-true}"

step "Starting via overmind (Procfile.dev)…"
exec overmind start -f Procfile.dev "$@"
