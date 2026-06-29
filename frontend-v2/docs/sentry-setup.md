# Sentry Setup — Customer Frontend v2

Owner: Frontend release-engineering · Last updated: 2026-06-25

How to provision Sentry for `frontend-v2` and confirm source maps land. The
runtime SDK (`@sentry/react`) is already initialised in `src/main.tsx`; the
build-time plugin (`@sentry/vite-plugin`) is already wired in `vite.config.ts`.
This doc is the operator-facing checklist for getting the env vars set.

---

## 1. Create the Sentry project

1. Sign in at <https://sentry.io>.
2. Pick the org (e.g. `restaurant-management`). If a new org, set timezone +
   data residency before creating the project.
3. **Create Project** → platform **React** → name **`frontend-v2`** → team
   **frontend**.
4. On the "configure SDK" step copy the DSN — it looks like
   `https://<key>@o<orgId>.ingest.sentry.io/<projectId>`. This is
   `VITE_SENTRY_DSN`.
5. Skip the in-app installer (we've already wired the SDK).

---

## 2. Generate an auth token

Used by the vite plugin to upload source maps. **Never** ship to the browser.

1. <https://sentry.io/settings/account/api/auth-tokens/> → **Create New Token**.
2. Scopes: `project:read`, `project:releases`, `org:read`. No more.
3. Name: `frontend-v2 CI source-map upload`.
4. Copy the token — Sentry will not show it again.

Store it in CI secrets:
- GitHub Actions → repo Settings → Secrets and variables → Actions →
  `SENTRY_AUTH_TOKEN`.
- Cloudflare Pages → Project → Settings → Environment variables → encrypted
  `VITE_SENTRY_AUTH_TOKEN` (production scope only).
- Vercel → Project → Settings → Environment Variables → `VITE_SENTRY_AUTH_TOKEN`
  (production scope only).

---

## 3. Env vars

Add to the production build environment (CI / hosting provider). See
`docs/deployment.md` §3 for the full env-var table.

| Variable                          | Value                                          | Where             |
| --------------------------------- | ---------------------------------------------- | ----------------- |
| `VITE_SENTRY_DSN`                 | the DSN from step 1                            | runtime + build   |
| `VITE_SENTRY_ENV`                 | `production` / `staging` / `dev`               | runtime           |
| `VITE_SENTRY_TRACES_SAMPLE_RATE`  | `0.1` (prod), `0.2` (staging), `0` (dev)       | runtime           |
| `VITE_SENTRY_AUTH_TOKEN`          | the token from step 2                          | **build only**    |
| `VITE_SENTRY_ORG`                 | org slug, e.g. `restaurant-management`         | build only        |
| `VITE_SENTRY_PROJECT`             | `frontend-v2`                                  | build only        |

The auth token is read by `vite.config.ts` via `loadEnv` — it is never inlined
into client code. The Sentry plugin block in `vite.config.ts` skips itself
entirely when `VITE_SENTRY_AUTH_TOKEN` is empty, which is how local dev builds
stay offline.

---

## 4. Build picks up the auth token automatically

Nothing extra to run. The next `npm run build` with the auth token in scope
will:

1. Detect `VITE_SENTRY_AUTH_TOKEN` via `loadEnv` (see `vite.config.ts:12-13`
   and the conditional plugin registration at `vite.config.ts:64-73`).
2. Create a Sentry release named with the git sha (default) or `package.json`
   version if set.
3. Inject debug-ids into each chunk so symbolication works without a filename
   match.
4. Upload all `dist/assets/*.js.map` artifacts to that release.
5. Mark the release as deployed to the `VITE_SENTRY_ENV` environment.

Local sanity check (do this once after you set the env vars):

```bash
cd frontend-v2
export VITE_SENTRY_AUTH_TOKEN=<token>
export VITE_SENTRY_ORG=<org-slug>
export VITE_SENTRY_PROJECT=frontend-v2
npm run build 2>&1 | grep -i sentry
```

You should see lines like `[sentry-vite-plugin] Successfully uploaded source
maps to Sentry` and the release id. If you see `[sentry-vite-plugin] Skipped`
the token is unset or unreadable.

---

## 5. Verify source maps are usable

After the first production deploy with the plugin active:

1. Open Sentry → **Releases** → most recent release.
2. Confirm "Artifacts: N source maps" (expect ~30 — one per JS chunk in the
   `manualChunks` groups plus a handful of route chunks).
3. Click an artifact → confirm the file content preview opens with original
   TypeScript, not minified output.
4. Trigger a deliberate error (e.g. log into the staging panel, open dev tools,
   run `Sentry.captureException(new Error("source map verification"))`).
5. Watch the issue appear in Sentry — the stack trace should show original
   `src/...` paths, not `assets/index-<hash>.js`.

If the stack trace is still minified:

- Check the artifact filenames match the requested `~/<chunk>.js`.
- Confirm `sourcemap: true` in `vite.config.ts:88` (it is).
- Confirm the plugin actually ran during the production build (look for the
  log line from step 4).
- Re-run with `debug: true` in `sentryVitePlugin({ ... })` to get verbose
  upload logs.

---

## 6. Operational defaults

These are already set in `src/main.tsx` and `src/lib/sentry.ts` — listed here
so ops knows what to expect on the dashboard:

- `tracesSampleRate`: from env (`0.1` in prod).
- `replaysSessionSampleRate`: `0` (off — privacy + bandwidth).
- `replaysOnErrorSampleRate`: `0.1`.
- `environment`: from `VITE_SENTRY_ENV`.
- `release`: derived from `package.json#version` + git sha.
- `beforeSend`: drops `chunkLoadError` (PWA reload-after-deploy noise) and
  `ResizeObserver loop completed` browser-internal warnings.
- PII scrubbing: `sendDefaultPii: false`. We pass only the user id (not email
  or mobile) via `Sentry.setUser({ id })` after panel login.

Verify these by clicking the project name in Sentry → Settings → and walking
each section. Mismatches mean someone shipped a config drift — open a hotfix.
