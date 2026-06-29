#!/usr/bin/env bash
#
# RMS — staging / production deployment script.
#
# Builds the v2 frontend, uploads it to the target environment's `dist-next`
# slot, validates the bundle, then atomically swaps the active symlink. The
# previous bundle stays in `dist-previous` for an instant rollback (see
# rollback-drill.md).
#
# Usage:
#   ./deploy.sh staging          # blue-green deploy to staging
#   ./deploy.sh production       # blue-green deploy to production
#   ./deploy.sh staging --skip-build
#
# Env vars (set by CI or your shell):
#   DEPLOY_HOST_STAGING       SSH target (e.g. deploy@stage.rms.example.com)
#   DEPLOY_HOST_PRODUCTION    SSH target
#   DEPLOY_ROOT               Server-side base path (default: /var/www/rms)
#   DEPLOY_NGINX_RELOAD_CMD   Privileged reload command (default: sudo systemctl reload nginx)
#
# Exit codes:
#   0  success — atomic swap completed, Nginx reloaded
#   1  bad arg / missing env
#   2  build failed
#   3  upload failed
#   4  post-upload health check failed (NO swap, previous bundle stays live)
#   5  swap failed
set -euo pipefail

env_name="${1:-}"
flag="${2:-}"
case "$env_name" in
  staging|production) ;;
  *)
    echo "usage: $0 {staging|production} [--skip-build]" >&2
    exit 1
    ;;
esac

case "$env_name" in
  staging)    host="${DEPLOY_HOST_STAGING:?DEPLOY_HOST_STAGING not set}" ;;
  production) host="${DEPLOY_HOST_PRODUCTION:?DEPLOY_HOST_PRODUCTION not set}" ;;
esac

deploy_root="${DEPLOY_ROOT:-/var/www/rms}"
reload_cmd="${DEPLOY_NGINX_RELOAD_CMD:-sudo systemctl reload nginx}"
release="$(date -u +%Y%m%d-%H%M%S)"
local_dist="$(cd "$(dirname "$0")/../frontend-v2/dist" 2>/dev/null && pwd || true)"

echo "════════════════════════════════════════════════════════════════"
echo " RMS deploy — env=$env_name  host=$host  release=$release"
echo "════════════════════════════════════════════════════════════════"

# 1. Build
if [[ "$flag" != "--skip-build" ]]; then
  echo "==> Building production bundle ..."
  ( cd "$(dirname "$0")/../frontend-v2" && npm ci && npm run build ) || exit 2
fi

if [[ ! -d "$local_dist" ]]; then
  echo "ERROR: build output missing at $local_dist" >&2
  exit 2
fi

# 2. Upload to dist-next
echo "==> Uploading bundle to $host:$deploy_root/releases/$release ..."
ssh "$host" "mkdir -p $deploy_root/releases/$release"
rsync -azP --delete "$local_dist"/ "$host:$deploy_root/releases/$release/" || exit 3

# 3. Health check on the new bundle from the server side (before swap)
echo "==> Validating uploaded bundle ..."
ssh "$host" bash -s -- "$deploy_root/releases/$release" <<'REMOTE'
set -eu
target="$1"
test -f "$target/index.html"               || { echo "missing index.html" >&2; exit 4; }
test -d "$target/assets"                   || { echo "missing assets/"  >&2; exit 4; }
test -f "$target/sw.js"                    || { echo "missing sw.js"    >&2; exit 4; }
test -f "$target/manifest.webmanifest"     || { echo "missing manifest" >&2; exit 4; }
echo "  index.html : $(wc -c < "$target/index.html") bytes"
echo "  assets/    : $(ls "$target/assets" | wc -l) files"
REMOTE

# 4. Atomic swap
echo "==> Swapping symlinks ..."
ssh "$host" bash -s -- "$deploy_root" "$release" "$reload_cmd" <<'REMOTE'
set -eu
root="$1"; release="$2"; reload="$3"
# Move current → previous, new → current. Symlink swap is atomic on POSIX
# filesystems so there's no window where the live server can serve a
# half-deployed bundle.
if [[ -L "$root/current" ]]; then
  ln -sfn "$(readlink "$root/current")" "$root/previous"
fi
ln -sfn "$root/releases/$release" "$root/current"
$reload
echo "  current  → $(readlink "$root/current")"
echo "  previous → $(readlink "$root/previous" 2>/dev/null || echo '(none)')"
REMOTE

echo "✅ deploy complete — release $release is live on $env_name"
echo "   rollback: ./deploy/rollback.sh $env_name"
