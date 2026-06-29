#!/usr/bin/env bash
#
# RMS — instant rollback to the previous release.
#
# Pairs with deploy.sh. When `current` was last swapped, the previous bundle
# was preserved under `previous`. This script swaps them back. Total time is
# bounded by SSH + symlink + Nginx reload (~3 seconds).
#
# Usage:  ./rollback.sh {staging|production}
set -euo pipefail

env_name="${1:-}"
case "$env_name" in
  staging|production) ;;
  *)
    echo "usage: $0 {staging|production}" >&2
    exit 1
    ;;
esac

case "$env_name" in
  staging)    host="${DEPLOY_HOST_STAGING:?DEPLOY_HOST_STAGING not set}" ;;
  production) host="${DEPLOY_HOST_PRODUCTION:?DEPLOY_HOST_PRODUCTION not set}" ;;
esac

deploy_root="${DEPLOY_ROOT:-/var/www/rms}"
reload_cmd="${DEPLOY_NGINX_RELOAD_CMD:-sudo systemctl reload nginx}"

echo "════════════════════════════════════════════════════════════════"
echo " RMS rollback — env=$env_name  host=$host"
echo "════════════════════════════════════════════════════════════════"

ssh "$host" bash -s -- "$deploy_root" "$reload_cmd" <<'REMOTE'
set -eu
root="$1"; reload="$2"
if [[ ! -L "$root/previous" ]]; then
  echo "ERROR: no previous release to roll back to" >&2
  exit 4
fi
prev="$(readlink "$root/previous")"
curr="$(readlink "$root/current" 2>/dev/null || echo '')"
ln -sfn "$prev" "$root/current"
if [[ -n "$curr" ]]; then ln -sfn "$curr" "$root/previous"; fi
$reload
echo "  current  → $(readlink "$root/current")"
echo "  previous → $(readlink "$root/previous" 2>/dev/null || echo '(none)')"
REMOTE

echo "✅ rollback complete on $env_name"
