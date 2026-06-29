# Rollback Drill — Customer Frontend v2 Cutover

Owner: Frontend release-engineering · Last updated: 2026-06-25

This document describes how to roll the customer site **back to the legacy
React 18 build** if frontend-v2 misbehaves in production. For a forward-fix
patch (faster, preferred when possible) see `docs/hotfix-runbook.md`.

---

## 1. Trigger conditions

Rollback is the right answer when forward-fix would take longer than the
business can tolerate. Trip the rollback if **any** of these holds for 5 min:

| Trigger                                                              | Source                          |
| -------------------------------------------------------------------- | ------------------------------- |
| Frontend error rate > 1% of sessions, sustained 5 min                | Sentry `production` environment |
| P0 customer-blocking issue from `hotfix-runbook.md` and no fix in 30 min | Telegram bridge + CTO call   |
| LCP regression > 20% vs. baseline on real-user monitoring            | Sentry Performance              |
| `/checkout` or `/api/customer/order` 5xx > 5% over 5 min             | Backend logs + Sentry           |
| Loss of authentication for > 10 sessions / 10 min                    | Sentry + customer reports       |

**Approver:** CTO (or delegated tech lead if CTO unreachable). Decision logged
in Telegram with the trigger reading that justified it.

---

## 2. Pre-cutover prep (do this BEFORE go-live)

These items must be in place before the cutover so rollback is reversible in
under 5 minutes.

### 2.1 Nginx config snapshot

```bash
# On the prod web host:
sudo cp /etc/nginx/sites-enabled/customer.conf \
        /etc/nginx/sites-available/customer.legacy.conf
sudo cp /etc/nginx/sites-enabled/customer.conf \
        /etc/nginx/sites-available/customer.v2.conf
# customer.legacy.conf points root at /var/www/legacy-react/dist
# customer.v2.conf    points root at /var/www/frontend-v2/dist
# /etc/nginx/sites-enabled/customer.conf is a symlink to whichever is active.
```

Both site files exist at all times. Only the symlink target changes.

### 2.2 DNS TTL lowered

24 h before cutover, lower the A/AAAA record TTL for the customer hostname
(e.g. `app.example.com`) to **60 seconds**. This caps the rollback propagation
delay if we need to swap to a different origin entirely. Restore the TTL to
3600 s seven days after a clean cutover.

### 2.3 Version tags

The new build is tagged `v2.0.0-rc.<n>` on the release commit. The previous
production legacy build keeps its existing tag (e.g. `v1.4.7`). Confirm both
tags exist with `git tag --list "v*"`. Each tagged commit's `dist/` is
preserved on the web host under `/var/www/releases/<tag>/`.

### 2.4 Cloudflare instant rollback enabled

For Cloudflare Pages deployments, "Instant Rollback" is on by default — the
previous deployment is selectable from the Pages dashboard for 30 days. Verify
this for the `frontend-v2` project under **Settings → Builds & deployments**
before cutover.

---

## 3. Rollback steps

Pick one path based on hosting target. Time-to-recover (TTR) noted per path.

### Path A — Nginx symlink flip (self-hosted, TTR ≤ 1 min)

```bash
ssh prod-web-01
sudo ln -sfn /etc/nginx/sites-available/customer.legacy.conf \
             /etc/nginx/sites-enabled/customer.conf
sudo nginx -t && sudo systemctl reload nginx
```

If the nginx config test fails, do **not** reload — revert the symlink and
investigate. The legacy config has been live before, so failure here implies
a permissions or filesystem issue.

### Path B — Cloudflare Pages instant rollback (TTR ≤ 30 s)

1. Open Cloudflare dashboard → Pages → `frontend-v2` project.
2. Click **Deployments** → previous successful deployment.
3. Click **Rollback to this deployment**.
4. Confirm.

Cloudflare flips the production alias atomically. Cache purges automatically.

### Path C — DNS swap (TTR ≤ 60 s, only if origin needs to change)

Use only when both A and B are unavailable. In the DNS provider, change the A
record for `app.example.com` from the v2 origin IP to the legacy origin IP.
Because TTL is 60 s (see §2.2), propagation completes in about a minute.

---

## 4. Verification

Run all four checks. If any fails, you are not rolled back — escalate.

1. **Smoke E2E vs. legacy URL.** Each release keeps a versioned URL like
   `https://legacy.app.example.com` pointing at the legacy origin. Run:
   ```bash
   cd frontend-v2
   BASE_URL=https://legacy.app.example.com \
     npx playwright test --project=chromium-desktop \
     e2e/customer-home.spec.ts e2e/customer-cart-flow.spec.ts
   ```
   Both must pass.
2. **Sentry recovery.** Open Sentry → `production` environment → Issues. The
   error rate should drop within 5 min. Pin the rollback time on the chart for
   the RCA.
3. **Manual smoke.** From a clean browser session:
   - Load `/`, see the legacy hero (visual diff).
   - Open `/menu`, add an item, complete a test order with the cashier-side
     order id verified.
4. **Backend health.** Confirm `/api/health` returns 200 and that backend
   metrics show no spike — the rollback should not have moved backend load.

---

## 5. Communication

Run these in parallel with the verification steps. Do not wait for verification
to start communicating.

### 5.1 Status page

Within 2 min of pulling the trigger, post:

> **Investigating** — We have rolled back a recent frontend update while we
> investigate an issue. The site is fully operational. We will share more
> detail shortly.

Within 30 min, post the follow-up with what was rolled back and the next-step
ETA.

### 5.2 Customer email (only if checkout was blocked > 15 min)

```
Subject: A brief interruption — and your order

Hi {name},

Between {start_local} and {end_local} our online ordering experienced an
interruption. We have reverted the change and the site is back to normal.

If you tried to place an order during this window and were charged but did not
receive a confirmation, please reply to this email or call {branch_phone}. Any
duplicate or failed charges have been auto-refunded.

We are sorry for the disruption.

— {Brand} team
```

### 5.3 Internal post-mortem schedule

- Within 2 h — incident bridge debrief, decisions recorded in Telegram.
- Within 48 h — written RCA in `docs/incidents/<date>-rollback.md` using the
  template in `hotfix-runbook.md` §6.
- Within 1 week — post-mortem review meeting with action items assigned.

---

## 6. Roll-forward criteria

After a rollback, do not re-deploy frontend-v2 until **all** of:

- [ ] Root cause identified and reproduced in staging.
- [ ] Fix merged to `main`, tagged as `v2.0.0` (or next), with green CI.
- [ ] Lighthouse + E2E + a11y all green on the fix branch.
- [ ] CTO sign-off on a written re-cutover plan that references this drill.
- [ ] Customer email scheduled in case of further surprise.

The second cutover should re-use the staged window from the first attempt
(low-traffic Tuesday morning) — not a Friday evening.
