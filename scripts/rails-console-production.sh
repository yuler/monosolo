#!/usr/bin/env bash
# Open a Rails console inside the production core container.
#
# Connects to the Dokploy server over SSH, finds the running core container by
# its <project>-<service> names, and runs `./bin/rails console` inside it.
#
# SECURITY / SSH NOTE:
# By default, StrictHostKeyChecking=accept-new is used for initial setup convenience.
# For production environments, operators should pin known host keys in ~/.ssh/known_hosts
# or pass custom flags via PRODUCTION_SSH_OPTS (e.g. -o StrictHostKeyChecking=yes).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/dokploy.sh
source "$SCRIPT_DIR/lib/dokploy.sh"

print_help() {
  cat << 'EOF'
Usage:
  scripts/rails-console-production.sh [options]

Options:
  -h, --help                Show this help message

Environment Variables:
  PRODUCTION_HOST           SSH host (required; set in .env.local or env)
  PRODUCTION_USER           SSH user (default: root)
  PRODUCTION_PROJECT        Dokploy project name (default: monosolo)
  PRODUCTION_SERVICE        Dokploy service name (default: core)
  PRODUCTION_SSH_OPTS       Extra options passed to ssh
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      print_help
      exit 1
      ;;
  esac
done

if [ -z "${PRODUCTION_HOST:-}" ]; then
  echo "Error: PRODUCTION_HOST is not set." >&2
  echo "Specify your Dokploy server host via the PRODUCTION_HOST environment variable or in .env.local." >&2
  echo "Example: PRODUCTION_HOST=monosolo.example.com mise run core:console:production" >&2
  exit 1
fi

HOST="$PRODUCTION_HOST"
USER="${PRODUCTION_USER:-root}"
PROJECT_NAME="${PRODUCTION_PROJECT:-monosolo}"
SERVICE_NAME="${PRODUCTION_SERVICE:-core}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [ -n "${PRODUCTION_SSH_OPTS:-}" ]; then
  read -ra extra_opts <<< "$PRODUCTION_SSH_OPTS"
  SSH_OPTS+=("${extra_opts[@]}")
fi

# SSH to server and find the core container
CONTAINER_ID=$(find_dokploy_container "$HOST" "$USER" "$PROJECT_NAME" "$SERVICE_NAME" "${SSH_OPTS[@]}")

if [ -z "$CONTAINER_ID" ]; then
  echo "Error: No container found matching '${PROJECT_NAME}-*-${SERVICE_NAME}' on $HOST" >&2
  echo "Available containers:" >&2
  list_dokploy_containers "$HOST" "$USER" "${SSH_OPTS[@]}"
  exit 1
fi

echo "Found container: $CONTAINER_ID"
echo "Connecting to container..."

# Connect to container
ssh -t "${SSH_OPTS[@]}" "$USER@$HOST" "docker exec -it \"$CONTAINER_ID\" ./bin/rails console"
