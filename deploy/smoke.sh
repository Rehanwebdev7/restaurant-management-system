#!/usr/bin/env bash
#
# Post-deploy smoke probe. Runs against a freshly-deployed environment to
# catch obvious regressions before letting traffic in. Returns non-zero on
# any failure so CI can gate the cutover or trigger an auto-rollback.
#
# Usage:
#   ./smoke.sh https://stage.rms.example.com
#   ./smoke.sh https://rms.example.com
set -euo pipefail

base="${1:-}"
if [[ -z "$base" ]]; then
  echo "usage: $0 <base-url>" >&2
  exit 1
fi

pass=0
fail=0
report=()

check() {
  local label="$1" url="$2" expect="$3"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$url" || echo "000")"
  if [[ "$code" == "$expect" ]]; then
    pass=$((pass+1))
    report+=("✅ $label  ($code)")
  else
    fail=$((fail+1))
    report+=("❌ $label  expected $expect got $code  ($url)")
  fi
}

# ── App shell ─────────────────────────────────────────────────────────────
check "customer home"        "$base/"                        200
check "customer /menu"       "$base/menu"                    200
check "panel /login"         "$base/login"                   200
check "service worker"       "$base/sw.js"                   200
check "firebase SW"          "$base/firebase-messaging-sw.js" 200
check "manifest"             "$base/manifest.webmanifest"    200
check "favicon"              "$base/favicon.svg"             200

# ── Backend reachability ──────────────────────────────────────────────────
check "backend root /rms"    "$base/rms/api/auth/fcm-web-config" 200
check "customer branding"    "$base/rms/api/customer/branding"   200

# ── Legacy fallback (during 30-day soak) ──────────────────────────────────
check "legacy /legacy/"      "$base/legacy/"                 200

echo
echo "════════════════════════════════════════════════════════════════"
for line in "${report[@]}"; do echo "  $line"; done
echo "════════════════════════════════════════════════════════════════"
echo "  Passed: $pass   Failed: $fail"
echo

if [[ $fail -gt 0 ]]; then
  echo "❌ smoke failed — consider running ./rollback.sh"
  exit 1
fi
echo "✅ smoke passed"
