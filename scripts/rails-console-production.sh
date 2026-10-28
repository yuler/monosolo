#!/usr/bin/env bash
# Open a Rails console inside the production core container.
#
# Connects to the Dokploy server over SSH, finds the running core container by
# its <project>-<service> names, and runs `./bin/rails console` inside it.
set -euo pipefail

print_help() {
  cat << 'EOF'
Usage:
  scripts/rails-console-production.sh [options]

Options:
  -h, --help                Show this help message

Environment Variables:
  PRODUCTION_HOST           SSH host (default: monosolo.example.com)
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

HOST="${PRODUCTION_HOST:-monosolo.example.com}"
USER="${PRODUCTION_USER:-root}"
PROJECT_NAME="${PRODUCTION_PROJECT:-monosolo}"
SERVICE_NAME="${PRODUCTION_SERVICE:-core}"

if [ "$HOST" = "monosolo.example.com" ] && [ -z "${PRODUCTION_HOST:-}" ]; then
  echo "Notice: PRODUCTION_HOST is not set. Defaulting to $HOST." >&2
  echo "Set PRODUCTION_HOST in your environment or .env.local to target your Dokploy server." >&2
fi

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [ -n "${PRODUCTION_SSH_OPTS:-}" ]; then
  read -ra extra_opts <<< "$PRODUCTION_SSH_OPTS"
  SSH_OPTS+=("${extra_opts[@]}")
fi

# SSH to server and find the core container
# Match Dokploy names like <stack>-<project>-<id>-<service>-<replica>, e.g. sides-monosolo-hhjmh1-core-1
CONTAINER_ID=$(
  ssh "${SSH_OPTS[@]}" "$USER@$HOST" "docker ps --format '{{.ID}}\t{{.Names}}' | awk -F'\t' -v proj=\"${PROJECT_NAME}\" -v svc=\"${SERVICE_NAME}\" '\$2 ~ proj \"-.*-\" svc \"-[0-9]+\$\" {print \$1; exit}'"
)

if [ -z "$CONTAINER_ID" ]; then
  echo "Error: No container found matching '${PROJECT_NAME}-*-${SERVICE_NAME}' on $HOST" >&2
  echo "Available containers:" >&2
  ssh "${SSH_OPTS[@]}" "$USER@$HOST" "docker ps --format '{{.Names}}'"
  exit 1
fi

echo "Found container: $CONTAINER_ID"
echo "Connecting to container..."

# Connect to container
ssh -t "${SSH_OPTS[@]}" "$USER@$HOST" "docker exec -it $CONTAINER_ID ./bin/rails console"
