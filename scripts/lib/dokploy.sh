#!/usr/bin/env bash
# Shared Dokploy container discovery helper functions.
#
# Dokploy deploys containers with names formatted as:
#   <stack>-<project>-<id>-<service>-<replica>
# e.g., sides-monosolo-hhjmh1-core-1

# Find a container ID for a given project and service name.
# Usage: find_dokploy_container "$host" "$user" "$project" "$service" "${ssh_opts[@]}"
find_dokploy_container() {
  local host="$1"
  local user="$2"
  local project="$3"
  local service="$4"
  shift 4
  local ssh_opts=("$@")

  ssh "${ssh_opts[@]}" "$user@$host" \
    "docker ps --format '{{.ID}}\t{{.Names}}' | awk -F'\t' -v proj=\"${project}\" -v svc=\"${service}\" '\$2 ~ proj \"-.*-\" svc \"-[0-9]+\$\" {print \$1; exit}'"
}

# List available container names on the remote host (for error reporting).
# Usage: list_dokploy_containers "$host" "$user" "${ssh_opts[@]}"
list_dokploy_containers() {
  local host="$1"
  local user="$2"
  shift 2
  local ssh_opts=("$@")

  ssh "${ssh_opts[@]}" "$user@$host" "docker ps --format '{{.Names}}'"
}
