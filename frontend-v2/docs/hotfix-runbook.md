# Hotfix Runbook — Customer Frontend v2

Owner: Frontend release-engineering · Last updated: 2026-06-25

Use this when prod is broken or degraded and a same-week patch is required. For a
full rollback (revert the entire cutover) see `docs/rollback-drill.md`.

---

## 1. Detection

Signals that should trigger this runbook (in priority order):

| Source                  | Channel                                | Who watches            |
| ----------------------- | -------------------------------------- | ---------------------- |
| Sentry error spike      | Sentry alert → email + Telegram bot    | On-call frontend dev   |
| Lighthouse CI red       | GitHub Actions check on main           | PR author              |
| Customer report         | Telegram support, `support@<brand>`    | Support lead → CTO     |
| Internal smoke fail     | E2E nightly run in CI                  | Release engineer       |
| Backend bug surfacing   | Spring Boot logs / Sentry backend      | Backend on-call → CTO  |

**Sentry alert rule (already configured):** new issue with >5 events / 5 min in
the `production` environment pages the on-call. Confirm the issue is from
`@sentry/react` (frontend) and not the backend Java SDK before assuming this
runbook applies.

---

## 2. Triage matrix

| Severity | Symptom                                                                | SLA             | Approver |
| -------- | ---------------------------------------------------------------------- | --------------- | -------- |
| P0       | Revenue blocking: checkout, payment, login, menu fails for >1% traffic | Same day        | CTO      |
| P1       | Degrades a flow but workaround exists (e.g. profile save 500)          | Within 1 week   | CTO      |
| P2       | Cosmetic / minor (typo, off-brand colour, alignment)                   | Next sprint     | Tech lead |

**Quick classification questions:**

1. Can a customer place a paid order right now? — No → P0.
2. Is the issue isolated to a single sub-page that has an alternate path? — Yes → P1.
3. Is it visible only on a non-critical screen (e.g. release notes modal)? — Yes → P2.

---

## 3. Communication

### Who notifies whom

| Severity | Notify                                          | Channel                 |
| -------- | ----------------------------------------------- | ----------------------- |
| P0       | CEO + CTO + Support lead immediately            | Telegram + phone call   |
| P1       | CTO + Support lead within 1 hour                | Telegram                |
| P2       | Tech lead next standup                          | Async note              |

### Customer-facing message template (P0 only)

> **Subject:** Temporary issue with online orders
>
> Hi {name}, we noticed a brief interruption affecting online ordering between
> {start_time} and {end_time}. The issue is identified and being patched. Any
> failed orders have been refunded automatically. We are sorry for the
> inconvenience — please try again, or call {branch_phone} to order directly.

Post to status page (Cloudflare status component or static `/status.html` if
not yet provisioned). Include a single sentence on what's affected and an ETA
("under investigation" is acceptable for the first update).

### Internal Telegram template

```
[HOTFIX P{0|1|2}] {short title}
Impact: {who / how many}
Detected: {timestamp UTC}
Owner: {name}
Status: triage | fixing | in review | deploying | done
Next update: {time}
```

Post every 30 min during a P0 even if the status is unchanged.

---

## 4. Fix path

```
main ─┬─────────────────────► (continues unaffected)
      │
      └── hotfix/UI-F-<id>-<slug> ──► PR ──► fast-track review ──► deploy
```

Steps:

1. `git checkout main && git pull --ff-only`.
2. `git checkout -b hotfix/UI-F-<id>-<slug>` — `<id>` matches the parity matrix
   entry or Sentry issue id.
3. Write the smallest possible patch. Avoid drive-by refactors.
4. Add a regression guard:
   - Unit assertion if logic-only.
   - Playwright spec under `e2e/regressions/UI-F-<id>.spec.ts` if user-facing.
5. `npm run lint && npx tsc --noEmit && npx playwright test --project=chromium-desktop`
   locally. All three must be green.
6. Open PR titled `hotfix(UI-F-<id>): {one-line summary}`.
7. **Fast-track review rules:** 1 reviewer for P1/P2, 2 reviewers for P0 (CTO
   approval required). Reviewer SLA — 30 min P0, 4 h P1, next business day P2.
8. Squash-merge. Tag the resulting commit on `main` as `v<prev>-hotfix.<n>`
   (e.g. `v1.0.0-hotfix.1`) so the rollback drill can target it.
9. Deploy via the same pipeline as `deployment.md` Section 1.

**Skip-rules:** never `--no-verify`, never skip the typecheck, never deploy
direct from a developer machine without the CI build artifact.

---

## 5. Verification

Mandatory before closing the incident:

- [ ] Lighthouse CI spot-check on the affected route — Perf ≥ baseline-5.
- [ ] Playwright smoke suite (`e2e/customer-home`, `e2e/customer-cart-flow`,
      `e2e/auth`, plus the new regression spec) — all green against the new
      production build.
- [ ] Manual production validation by a non-author teammate:
  1. Hard refresh, clear cache.
  2. Walk the affected flow end-to-end as a real customer.
  3. Confirm Sentry rate has dropped back below the alert threshold for 15 min.
- [ ] Status page closed with a "resolved" update.

If any check fails, do not close — re-open triage and consider rollback.

---

## 6. Post-incident

Within 48 h of resolution write a short RCA in
`frontend-v2/docs/incidents/<YYYY-MM-DD>-<slug>.md`:

```
# {Title}

- Severity: P{0|1|2}
- Detected: <UTC>
- Resolved: <UTC>
- Duration: <minutes>
- Customer impact: <count / percent / revenue if known>

## Timeline
- HH:MM — detected via <source>
- HH:MM — triaged P{n}, owner <name>
- HH:MM — fix merged (<commit sha>)
- HH:MM — deployed
- HH:MM — verified

## Root cause
<one paragraph — be specific, name the file/line>

## Why our tests missed it
<one paragraph — what test should have caught this>

## Action items
- [ ] Owner — short description — due date
- [ ] ...
```

Review the action items in the next weekly engineering sync. An incident is not
closed until every action item is either done or has a tracking ticket.
