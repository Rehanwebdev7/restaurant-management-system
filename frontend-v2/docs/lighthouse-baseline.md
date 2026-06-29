# Lighthouse Baseline — UI-F-6

> Captured against `vite preview` on http://localhost:4173/ (headless Chrome).
> Raw JSON: `frontend-v2/lighthouse-after-v2.json` (latest run, Lighthouse 12.x).

## History

| Run                | Performance | TBT       | FCP     | LCP   | TTI    | CLS   |
| ------------------ | ----------- | --------- | ------- | ----- | ------ | ----- |
| 2026-06-24 baseline| **45**      | 742 ms    | 5.4 s   | 6.9 s | 9.8 s  | 0.002 |
| 2026-06-25 rev-2   | **37**      | 1,830 ms  | 4.3 s   | 7.2 s | 7.5 s  | 0     |
| 2026-06-25 rev-3   | **40**      | 878 ms    | 5.5 s   | 7.5 s | 7.5 s  | 0     |
| 2026-06-26 rev-4   | **57**      | 230 ms    | 4.4 s   | 7.9 s | —      | 0     |

## Latest result — rev-4 (2026-06-26)

Perf +17 (40 → 57), TBT -648 ms (878 → 230). All three Session 15 perf
optimizations landed:
1. Sentry init now deferred to `requestIdleCallback` — ~88 kB gzip off the
   critical-path bundle. ErrorBoundary uses the new buffered
   `captureException` helper from `src/lib/sentry.ts` so the boundary stays
   tiny and Sentry loads in idle.
2. i18n carved out of `optional-features` into its own chunk so the heavy
   primitives bundle stays purely lazy.
3. A `transformIndexHtml` plugin strips `<link rel="modulepreload">` tags
   for `optional-features`, `sentry`, `payments`, and `charts` — Vite was
   eagerly preloading them post-rolldown despite their downstream lazy()
   imports. Customer landing now only preloads what it actually needs.

Net: **~275 kB gzip cut from the customer landing critical path**. The
remaining FCP/LCP cost is the customer steakhouse hero image + Cormorant
Garamond font — addressing those needs a separate sprint (preconnect,
fetchpriority, smaller hero variant). A11y stays ≥ 92, BP 96, SEO 92.

## /menu mobile (2026-06-26)

| Metric | Value |
|---|---|
| Perf | 37 |
| A11y | 96 |
| FCP | 4.6 s |
| LCP | 7.2 s |
| TBT | 1,270 ms |
| CLS | 0 |

/menu remains the slowest route — the dish grid mounts 30+ `<DishCard>`s
each with a framer-motion `<motion.article>` wrapper. To bring /menu in
line with / requires either a virtualised grid (TanStack Virtual) or
demoting the per-card hover/tap animation behind reduced-motion. Tracked
for a future sprint.

## Latest result — rev-3 (2026-06-25)

Recovered 3 points after collapsing 6 niche vendor chunks (image-crop, maps,
qrcode, markdown, xlsx, date, i18n) into a single `optional-features` chunk.
The earlier 13-way split was bleeding TBT because each tiny chunk forced
its own parse/eval pass on hydration. The new shape: ~7 chunks instead of
~13, with the niche chunk staying lazy (only loaded when those routes need
it). TBT dropped 952 ms (1830 → 878), recovering more than half the
regression from rev-2.

| Metric                         | rev-2     | rev-3   | Δ      |
| ------------------------------ | --------- | ------- | ------ |
| First Contentful Paint (FCP)   | 4.3 s     | 5.5 s   | +1.2 s |
| Largest Contentful Paint (LCP) | 7.2 s     | 7.5 s   | +0.3 s |
| Total Blocking Time (TBT)      | 1,830 ms  | 878 ms  | −952 ms|
| Cumulative Layout Shift (CLS)  | 0         | 0       | 0      |
| Speed Index                    | 4.9 s     | 6.7 s   | +1.8 s |
| Time to Interactive (TTI)      | 7.5 s     | 7.5 s   | 0      |

## Honest read

TBT recovered substantially but FCP/SI regressed slightly because more
shared code now lives in the larger `optional-features` chunk that
gets prefetched on certain navigations. Net Lighthouse Perf score is back
toward baseline (45 → 40, still 5 short). Next levers to recover the
remaining 5 points: extract `framer-motion` out of the customer entry
(only used on hero), self-host Inter font (UI-F-46 still pending), and
defer the offline-queue + sentry init from `main.tsx` onto `requestIdleCallback`.

Accessibility and Best Practices drops are minor and likely from one of the
new components — the audit trail filter Select uses a plain icon prefix that
may trigger an "icon-only button" finding; we should re-test specifically.

## Top next-step recommendations

1. **Reduce TBT** — defer the lazy `import()` calls in `router/index.tsx`
   until the route is actually visited. Currently 50+ `lazy(() => import())`
   wrappers parse synchronously at module-eval. Consider grouping into a
   single dynamic-import per role-bundle.
2. **Inline critical CSS** — the customer landing route still ships a 14 kB
   `index-*.css` chunk that blocks FCP. Vite's `cssCodeSplit: true` is on,
   but the home route is the worst offender — pull above-the-fold styles
   into `<style>` in `index.html`.
3. **Audit the new audit-trail Select trigger** — give the icon-only filter
   button an explicit `aria-label="Filter by action"` if it's flagged.
4. **Self-host Inter font** — still pending from UI-F-46. CDN round-trip to
   `fonts.googleapis.com` continues to delay FCP on cold load.
5. **Defer `framer-motion`** — even after manualChunks it lands in the
   entry chunk via the customer hero animation. Conditionally import only on
   `/`, `/menu`, `/signature`.

## Notes

- CLS 0 — improvement from 0.002, basically perfect, no layout jumps.
- Best Practices 96 — single ding likely a third-party iframe/sourcemap warning;
  was 100 before so worth re-running to confirm it's not flaky.
- SEO 92 — unchanged. Robots.txt still missing.
- All 10 new restaurant sub-pages added 2026-06-25 are tree-shaken into the
  `extraSubpages-*.js` chunk and only parsed when visited; they do not
  contribute to entry-bundle size.

## Files

- `lighthouse-after-v2.json` — latest run (rev-3, 2026-06-25, perf-only).
- `lighthouse-after.json` — rev-2 run, all 4 categories. Keep for history.
- `lighthouse-baseline.json` — initial baseline. Keep for history.
