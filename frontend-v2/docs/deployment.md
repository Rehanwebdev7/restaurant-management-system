# Deployment Runbook — Customer Frontend v2

Owner: Frontend release-engineering · Last updated: 2026-06-25

End-to-end procedure for building and shipping `frontend-v2` to production.
For incident response see `docs/hotfix-runbook.md` and
`docs/rollback-drill.md`.

---

## 1. Build

```bash
cd frontend-v2
npm ci                  # use lockfile — do not `npm install`
npm run build           # tsc -b && vite build
```

Outputs:

- `dist/index.html` — entry, fingerprinted asset links.
- `dist/assets/*.{js,css,map}` — code-split chunks (manualChunks groups: framer,
  payments, charts, radix, icons, sentry, react-vendor, tanstack,
  optional-features).
- `dist/sw.js` + `dist/workbox-*.js` — PWA service worker (vite-plugin-pwa).
- `dist/manifest.webmanifest` — PWA manifest.

Expected size budget (gzipped, post-build 2026-06-25):

| Chunk              | Raw     | Gzip    |
| ------------------ | ------- | ------- |
| index (entry)      | 295 KB  | 87 KB   |
| react-vendor       | 178 KB  | 56 KB   |
| sentry             | 273 KB  | 89 KB   |
| framer             | 151 KB  | 50 KB   |
| radix              | 118 KB  | 37 KB   |
| optional-features  | 633 KB  | 188 KB  | (lazy, off the customer landing critical path) |
| **dist/ total**    | **13 MB on disk** (includes source maps) | |

If the entry chunk grows past 110 KB gzipped, investigate before deploying —
likely a new import has accidentally crossed into the eager bundle.

---

## 2. Hosting target

Two supported targets. Pick one per environment and stick with it.

### Option A — Cloudflare Pages (recommended)

- Repo connected via Cloudflare dashboard.
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Environment variables set per environment (see §3).
- `public/_headers` is auto-applied by Cloudflare Pages — no extra config.
- Instant Rollback enabled by default (see `rollback-drill.md` §2.4).
- Custom domain `app.example.com` → CNAME to `frontend-v2.pages.dev`.

### Option B — S3 + CloudFront

- S3 bucket `app-example-com-prod` with static website hosting OFF (use OAI/OAC
  via CloudFront — bucket stays private).
- `aws s3 sync dist/ s3://app-example-com-prod/ --delete --cache-control "public, max-age=31536000, immutable"` for assets.
- Override `index.html` cache: `--cache-control "public, max-age=0, must-revalidate"`.
- CloudFront distribution:
  - Origin: the S3 bucket via OAC.
  - Default root object: `index.html`.
  - Custom error response: 404 / 403 → 200 with `/index.html` (SPA fallback).
  - Response headers policy duplicating `public/_headers`.
  - Invalidate `/*` after each deploy.

### Option C — Vercel

- Import the repo, framework preset = Vite.
- `vercel.json` is committed — CSP and security headers apply automatically.
- Set env vars per environment via the Vercel dashboard.
- Production branch: `main`.

---

## 3. Environment variables

All runtime config is `VITE_*`. See `src/config/env.ts` for the canonical Zod
schema — that file is the source of truth at runtime; this table is for ops.

| Variable                       | dev                          | staging                                | prod                                  |
| ------------------------------ | ---------------------------- | -------------------------------------- | ------------------------------------- |
| `VITE_API_BASE_URL`            | `http://localhost:8091/rms`  | `https://api-staging.example.com/rms`  | `https://api.example.com/rms`         |
| `VITE_APP_ENV`                 | `development`                | `staging`                              | `production`                          |
| `VITE_SENTRY_DSN`              | empty (disabled)             | staging DSN                            | prod DSN                              |
| `VITE_SENTRY_ENV`              | `dev`                        | `staging`                              | `production`                          |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0`                       | `0.2`                                  | `0.1`                                 |
| `VITE_SENTRY_AUTH_TOKEN`       | empty                        | empty (no sourcemap upload)            | CI-injected (sourcemap upload)        |
| `VITE_SENTRY_ORG`              | empty                        | empty                                  | `<sentry-org-slug>`                   |
| `VITE_SENTRY_PROJECT`          | empty                        | empty                                  | `frontend-v2`                         |
| `VITE_STRIPE_PUBLISHABLE_KEY`  | test key                     | test key                               | live `pk_live_…`                      |
| `VITE_PAYPAL_CLIENT_ID`        | sandbox                      | sandbox                                | live                                  |
| `VITE_GOOGLE_MAPS_API_KEY`     | dev-restricted               | staging-restricted                     | prod-restricted (HTTP referrer)       |
| `VITE_FCM_API_KEY`             | empty                        | staging Firebase                       | prod Firebase                         |
| `VITE_FCM_PROJECT_ID`          | empty                        | staging Firebase                       | prod Firebase                         |
| `VITE_FCM_VAPID_KEY`           | empty                        | staging Firebase                       | prod Firebase                         |

`VITE_SENTRY_AUTH_TOKEN` must only ever live in CI secrets. Never commit it.
Never expose it to client-side runtime — it's used only by the Sentry vite
plugin during `npm run build`.

---

## 4. DNS + Nginx

### DNS

- `app.example.com` A/AAAA → CDN (Cloudflare / CloudFront / Vercel edge).
- TTL: 3600 s in steady state, dropped to 60 s for 24 h before cutover.
- `api.example.com` A → Spring Boot backend load balancer (does NOT pass through
  frontend CDN — direct).

### Nginx reverse proxy (legacy self-hosted layout)

If serving the frontend yourself (Option B / D), use this minimal pattern:

```nginx
server {
  listen 443 ssl http2;
  server_name app.example.com;

  root /var/www/frontend-v2/dist;
  index index.html;

  # SPA fallback — all non-asset paths return index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Long-cache fingerprinted assets
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Never cache the HTML shell
  location = /index.html {
    add_header Cache-Control "public, max-age=0, must-revalidate";
  }

  # Backend API — same-origin to keep CSP clean
  location /api/ {
    proxy_pass http://backend-upstream/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Headers from `public/_headers` are not applied by nginx automatically — port
them to `add_header` directives in the server block, or use a sidecar that
reads the file (Cloudflare Pages and Netlify do this natively).

---

## 5. Sentry releases + source maps

Source map upload is wired in `vite.config.ts` via `@sentry/vite-plugin`. The
plugin activates only when `VITE_SENTRY_AUTH_TOKEN` is present at build time.

```bash
# In CI (GitHub Actions):
env:
  VITE_SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  VITE_SENTRY_ORG: ${{ vars.SENTRY_ORG }}
  VITE_SENTRY_PROJECT: ${{ vars.SENTRY_PROJECT }}
run: npm ci && npm run build
```

The plugin will:
1. Create a Sentry release using `package.json` version (or the git sha).
2. Upload `dist/assets/*.js.map` to that release.
3. Associate the release with the `production` environment.

**Verification:** Sentry dashboard → Releases → most recent → confirm
"Source Maps: N artifacts uploaded". Walk the release's debug-id graph to
confirm every JS chunk has a matched map.

Source maps stay in `dist/` (they're uploaded but also shipped) — this is fine
because they're served behind the same CDN with no `SourceMap:` HTTP header,
so end users don't fetch them; Sentry uses the uploaded copy via debug-id.

---

## 6. Smoke tests post-deploy

Run these manually against the new production URL within 10 min of deploy. Any
failure is rollback grounds.

1. **Customer home** — `/` loads, hero rotates, "Order Now" CTA navigates to
   `/menu`.
2. **Menu** — `/menu` loads >0 items from `/api/customer/menu_items/...`.
3. **Cart** — Add a single item, badge increments.
4. **Checkout** — `/checkout` renders, address picker mounts (geolocation may
   prompt). Submit a test order via the QA Stripe key; confirm 200 + redirect.
5. **My orders** — `/orders` shows the placed order.
6. **Panel login** — `/login`, login as the QA cashier, lands on
   `/cashier/dashboard`.
7. **KDS** — `/kitchen/dashboard`, WebSocket badge shows "connected".
8. **Lighthouse spot-check** — Perf ≥ 40 on `/` and `/menu` (current baseline:
   40 on `/`).

Automate steps 1–6 with:

```bash
BASE_URL=https://app.example.com \
  npx playwright test --project=chromium-desktop \
  e2e/customer-home.spec.ts e2e/customer-cart-flow.spec.ts e2e/auth.spec.ts
```

---

## 7. Rollback ready

The deploy is not complete until rollback is possible:

- [ ] Previous build retained at `/var/www/releases/<prev-tag>/` (self-hosted)
      or selectable in Cloudflare Pages Instant Rollback (managed).
- [ ] Legacy customer site reachable at `https://legacy.app.example.com` for
      smoke testing.
- [ ] Nginx legacy symlink target (`customer.legacy.conf`) exists.
- [ ] DNS TTL is 60 s (lowered 24 h before, not yet restored).
- [ ] Cutover commit tagged `v2.0.0-rc.<n>`; previous tag still present.

If any of those is missing, you are flying without a parachute. Fix before
considering the deploy "done".

See `rollback-drill.md` for the actual recovery procedure.
