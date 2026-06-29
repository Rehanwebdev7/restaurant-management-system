# Traffic ramp runbook — Phase 7 cutover

This is the explicit playbook for moving production traffic from the legacy
CRA bundle (`frontend/`) to the v2 Vite bundle (`frontend-v2/`). Total
expected wall-clock from "begin staging deploy" to "100% production on v2"
is ~8 days assuming no rollbacks.

## Roles

| Role | Responsibility |
|---|---|
| Release captain | Owns the runbook, calls go/no-go at each gate |
| On-call SRE | Watches Nginx + Spring Boot logs, drives rollback if needed |
| Customer support lead | Owns the "?ui=legacy" escape hatch + customer comms |

Pin a single Telegram channel for the duration of the ramp.

## Pre-cutover gates

All of these MUST pass at least 24 hours before the production cutover:

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm playwright test` — full suite green, 0 flakes across 3 consecutive runs
- [ ] `npm run build` succeeds; bundle inspector shows no chunk > 200 kB gzip on the customer landing critical path
- [ ] Backend smoke probe (`./deploy/smoke.sh https://stage.rms.example.com`) — all 10 checks green
- [ ] Lighthouse Mobile run on staging shows Perf ≥ 60, A11y ≥ 90, BP ≥ 90 (record numbers in `frontend-v2/docs/lighthouse-baseline.md`)
- [ ] Staging has been live for at least 7 consecutive days with no P0 backend bug

## Day 0 — Staging deploy

```bash
export DEPLOY_HOST_STAGING="deploy@stage.rms.example.com"
./deploy/deploy.sh staging
./deploy/smoke.sh https://stage.rms.example.com
```

Expected duration: ~6 minutes (build ~90s, upload ~60s, validate + swap ~10s).

Then:
- Internal QA runs the per-panel checklist from `frontend-v2/docs/parity-matrix.md`
- 5 friendly tenants get invites to staging URL
- Watch Sentry for the first 72 hours — any P0 stops the ramp

## Day 3 — Beta tenant ramp on production

Production still serves legacy at `/`. Beta tenants navigate to `/v2/` via
the same Nginx config (v2 lives at `/var/www/rms/v2-staging/` for this
window — a side-deployment that doesn't touch `current`).

- [ ] Beta tenant feedback collected in dedicated channel
- [ ] Sentry release filter shows beta error rate ≤ 1.5× legacy rate
- [ ] Lighthouse on production /v2/ matches staging numbers

## Day 5 — Cutover (off-peak: Tue 03:00 IST)

```bash
export DEPLOY_HOST_PRODUCTION="deploy@rms.example.com"

# 1. Move legacy CRA build into /legacy/ slot (one-time, idempotent)
ssh "$DEPLOY_HOST_PRODUCTION" \
  "mv /var/www/rms/legacy-staging /var/www/rms/legacy"

# 2. Deploy v2 to production current/
./deploy/deploy.sh production

# 3. Reload Nginx with the new server block (location / now serves v2 SPA,
#    /legacy/ now serves CRA)
ssh "$DEPLOY_HOST_PRODUCTION" \
  "sudo cp /etc/nginx/sites-available/rms.conf{,.bak.$(date +%s)} && \
   sudo cp ~/rms-deploy/nginx-rms.conf /etc/nginx/sites-available/rms.conf && \
   sudo nginx -t && \
   sudo systemctl reload nginx"

# 4. Smoke probe
./deploy/smoke.sh https://rms.example.com
```

Cutover window: 5 minutes target, 15 minutes hard limit. If smoke fails:

```bash
./deploy/rollback.sh production
```

Rollback completes in ~3 seconds.

## Day 5–35 — Soak window (30 days)

Both bundles live:
- `https://rms.example.com/` — v2 (new default)
- `https://rms.example.com/legacy/` — legacy CRA
- `https://rms.example.com/?ui=legacy` — escape hatch (uncomment the Nginx
  `if ($arg_ui = "legacy")` block in `nginx-rms.conf` to activate)

Daily checks:
- Sentry error rate vs the Day-5 baseline. Investigate any sustained 1.5× rise.
- Telegram channel for customer-reported issues.
- Backend p95 latency vs `migration-baseline.json` (UI-F-44).

Per-week check:
- Lighthouse run on production. Perf ≥ 60 sustained.
- Run `pnpm playwright test --grep customer` against production.

## Day 35 — Sunset legacy

- [ ] Sentry shows v2 error rate has been ≤ Day-5 baseline for 21 consecutive days
- [ ] No active "?ui=legacy" sessions in last 7 days (check Nginx access log)
- [ ] Final per-panel parity matrix sign-off

```bash
ssh "$DEPLOY_HOST_PRODUCTION" \
  "sudo rm -rf /var/www/rms/legacy && \
   sudo sed -i '/location \\/legacy\\//,/^[[:space:]]*}/d' /etc/nginx/sites-available/rms.conf && \
   sudo nginx -t && sudo systemctl reload nginx"
```

Update `PENDING_WORK.md` cutover section to ✅ COMPLETE.

## Emergency rollback procedure

1. SRE declares "ROLLBACK" in the Telegram channel.
2. Release captain runs `./deploy/rollback.sh production` — Nginx flips the
   `current` symlink to the previous release. Total: ~3 seconds.
3. Run `./deploy/smoke.sh https://rms.example.com` against the rolled-back
   state. Expect all 10 checks green.
4. Post-mortem template at `frontend-v2/docs/hotfix-runbook.md` filled in
   within 24h.

## Communication templates

**T-24h pre-cutover** (#engineering):

> Cutover scheduled Tue 03:00 IST. Staging green for {N} days, beta tenants
> reported no P0. Channel for incident comms: #rms-cutover-day5. Release
> captain: @captain. SRE on call: @sre.

**T-0 cutover start** (#status):

> Beginning RMS v2 cutover. /v2/ → /. Legacy preserved at /legacy/. Expected
> downtime: 0s (symlink swap). Watch this channel for updates.

**T+5 success**:

> ✅ v2 live on rms.example.com. Smoke probe 10/10 green. Sentry baseline
> set. Soak window starts now (30 days). Legacy fallback at /legacy/ until
> {sunset date}.

**Rollback announcement**:

> ⚠️ RMS rollback initiated by @sre. Reason: {short}. v2 → previous release.
> Customers may see a brief reload. Investigation in #rms-cutover-day5.
