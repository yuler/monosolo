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

if ! gum confirm "This will remove logs, temp files and local caches. Continue?"; then
  ok "Aborted."
  exit 0
fi

choices=$(gum choose --no-limit \
  "Rails logs & tmp (core/log, core/tmp)" \
  "Rails storage (core/storage/*.sqlite3)" \
  "Node modules (root + apps)" \
  "Local .env files" \
  "All of the above")

clean_logs() {
  step "Clearing Rails logs and tmp"
  (cd core && ./bin/rails log:clear tmp:clear 2>/dev/null) || rm -rf core/log/* core/tmp/*
  ok "Rails logs & tmp cleared"
}

clean_storage() {
  step "Removing SQLite databases"
  rm -f core/storage/*.sqlite3 core/storage/*.sqlite3-shm core/storage/*.sqlite3-wal
  ok "Storage cleared"
}

clean_node() {
  step "Removing node_modules"
  rm -rf node_modules core/node_modules apps/*/node_modules packages/*/node_modules
  ok "node_modules removed"
}

clean_env() {
  step "Removing local .env files"
  rm -f core/.env
  ok ".env removed"
}

echo "$choices" | while IFS= read -r line; do
  case "$line" in
    *"logs & tmp"*)   clean_logs ;;
    *"storage"*)      clean_storage ;;
    *"Node modules"*) clean_node ;;
    *".env files"*)   clean_env ;;
  esac
done

# "All of the above" without specific picks => clean everything
if echo "$choices" | grep -q "All of the above" && [ -z "$choices" ]; then :; fi

ok "Clean complete!"
