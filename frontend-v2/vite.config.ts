import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load VITE_* (and unprefixed Sentry vars) for plugin wiring. The schema in
  // src/config/env.ts is still the runtime source of truth — this is just for
  // build-time plugin config.
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Restaurant Management System',
        short_name: 'RMS',
        description: 'Multi-tenant restaurant operations — KDS, POS, delivery, reports.',
        theme_color: '#F97316',
        background_color: '#0F172A',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/login\//],
        // UI-F-22 perf: pre-cache self-hosted woff2 + svg sprite so subsequent
        // visits hit the SW cache instead of the network.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Hero / gallery imagery still comes from Unsplash CDN. Cache-first
            // so re-renders + nav events don't re-fetch — the URL already has
            // immutable query params (w, q).
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
    // Sentry source-map upload — only active when a CI token is provided so
    // local builds stay fast and don't ping Sentry.
    ...(env.VITE_SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: env.VITE_SENTRY_ORG,
            project: env.VITE_SENTRY_PROJECT,
            authToken: env.VITE_SENTRY_AUTH_TOKEN,
            telemetry: false,
          }),
        ]
      : []),
    // Perf: Vite/rolldown emits <link rel="modulepreload"> for every chunk
    // reachable from the entry — including `optional-features` (~170 kB gzip
    // of cropper, maps, qrcode, markdown, xlsx, date-fns) which the customer
    // landing never uses. Strip it post-build so it loads only when a lazy()
    // route actually fires. modulePreload.resolveDependencies didn't catch it
    // under rolldown, so we do a literal regex strip instead.
    {
      name: 'strip-optional-features-preload',
      apply: 'build' as const,
      transformIndexHtml(html: string) {
        return html.replace(
          /\s*<link rel="modulepreload"[^>]*\/assets\/(optional-features|sentry|payments|charts)-[^"]+"[^>]*>\s*/g,
          '',
        )
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    host: true,
  },
  build: {
    // UI-F-22: browser support floor — Chrome 90+, Safari 15+, Firefox 90+, Android WebView 90+
    target: ['chrome90', 'safari15', 'firefox90', 'edge90'],
    sourcemap: true,
    // Perf: by default Vite emits `<link rel="modulepreload">` tags for every
    // chunk reachable from the entry — including lazy-loaded ones — so the
    // browser eagerly downloads them in parallel with the entry. That hurts
    // the customer landing because optional-features (~170 kB gzip — cropper,
    // maps, qrcode, markdown, xlsx, date-fns) and route-level chunks get
    // pulled in even though the landing page never touches them.
    //
    // Filtering the dependency list keeps preloads ONLY for chunks the
    // customer landing actually needs (react-vendor, framer, radix, tanstack,
    // i18n, icons). Other chunks load on-demand when their lazy() import
    // resolves at navigation time.
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        if (filename.endsWith('index.html')) {
          return deps.filter((d) => (
            d.includes('react-vendor') ||
            d.includes('framer') ||
            d.includes('radix') ||
            d.includes('tanstack') ||
            d.includes('icons') ||
            d.includes('i18n') ||
            d.includes('rolldown-runtime')
          ))
        }
        return deps
      },
    },
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) requires a function form; the old object form throws
        // "manualChunks is not a function" at build time.
        //
        // UI-F-22 perf rev-3 (2026-06-25) — Previous rev split 13 vendor packs
        // which spiked TBT (Lighthouse Perf 45 → 37) due to too many tiny lazy
        // chunks parsing in the main thread on hydration. We now collapse the
        // niche packs (image-crop / maps / qrcode / markdown / xlsx / date) into
        // a single `optional-features` chunk that is still lazy-loaded but only
        // pulls one network request when actually needed. Heavy vendors that
        // ship on the customer landing (framer, radix, icons, react-vendor,
        // tanstack) stay split so the entry chunk stays small.
        manualChunks: (id: string): string | undefined => {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('framer-motion')) return 'framer'
          if (id.includes('@stripe') || id.includes('@paypal/react-paypal-js')) return 'payments'
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('@sentry')) return 'sentry'
          if (id.includes('react-dom/') || id.includes('node_modules/react/')) {
            return 'react-vendor'
          }
          if (id.includes('@tanstack')) return 'tanstack'
          // i18n is imported synchronously from main.tsx, so it gets its own
          // small chunk — keeping it out of `optional-features` so that
          // chunk stays purely lazy and doesn't get modulepreloaded on
          // first paint (saving ~187 kB gzip from the customer landing
          // critical path).
          if (id.includes('react-i18next') || id.includes('i18next')) return 'i18n'
          // Collapsed niche features — only used on specific routes (profile
          // image cropper, location map, table QR codes, terms markdown,
          // reports export, date picker). Bundling them keeps the chunk
          // count low so each lazy chunk has meaningful payload and TBT
          // stays bounded on the customer landing.
          if (
            id.includes('react-easy-crop') ||
            id.includes('@react-google-maps') ||
            id.includes('qrcode') ||
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('xlsx') ||
            id.includes('papaparse') ||
            id.includes('react-day-picker') ||
            id.includes('date-fns')
          ) {
            return 'optional-features'
          }
          return undefined
        },
      },
    },
  },
  }
})
