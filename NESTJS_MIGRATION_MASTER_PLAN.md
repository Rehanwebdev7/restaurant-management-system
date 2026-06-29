# 🚀 RMS Backend Migration Master Plan — Spring Boot → NestJS

**Project:** Restaurant Management System (Multi-Tenant SaaS)
**Working Directory:** `D:\PHP GITHUB\restaurant-management-system`
**Migration Decision:** Spring Boot (Java 17) → **NestJS (TypeScript / Node.js)**
**Database:** Supabase PostgreSQL (NO CHANGE — same DB, same 52 tables)
**Frontend:** React 18 (NO CHANGE — only API base URL switches)
**Plan Date:** 17 June 2026
**Plan Owner:** shaikhparvez7863
**Email:** webdekhodevelopers@gmail.com

---

## 🛑 STRATEGY UPDATE — 2026-06-22 (READ FIRST)

> **Migration is DEFERRED. Do NOT execute this plan yet.**
>
> **Owner decision (22 June 2026):** Pehle Spring Boot me project ko **A to Z complete** karenge (sare features, polish, bug fixes, production-ready). **Uske baad** is plan ko execute karke NestJS me shift karenge.
>
> **Reason:**
> - Project near-completion stage par hai
> - Mid-flight language switch dual maintenance burden create karta hai
> - Complete-then-migrate approach se hamare paas **dono codebases** rahenge: stable Spring Boot version + naya NestJS version
> - NestJS shift tab hoga jab Spring Boot version fully done + tested ho
>
> **Current state of this plan:**
> - ✅ Plan complete + senior audited (13 findings, F-1 to F-13)
> - ✅ Saved in project root + `.claude/plans/`
> - ✅ Tech decisions locked, library mapping done
> - ⏸️ **Execution PAUSED until owner gives explicit "ab shift karo" signal**
>
> **Until then:**
> - Spring Boot codebase continues as the active production backend
> - Do NOT create `developer` branch / restructure folders / scaffold NestJS / install Prisma / touch ANY code based on this plan
> - This file stays as a frozen reference — refresh tech decisions only if Spring Boot completion phase changes underlying assumptions (e.g., new heavy library added, new payment provider, new role)
>
> **When migration eventually starts:** Resume from `SESSION RESUMABILITY PROTOCOL` section below, run Phase 0 audit fresh (Spring Boot will have evolved by then), then proceed.

---

## 🧭 SESSION RESUMABILITY PROTOCOL

> **READ THIS FIRST IF YOU ARE A NEW SESSION OR AGENT.**
>
> This plan file is the **single source of truth** for migration progress. When tokens run out or session restarts:
>
> 1. Read this entire file top-to-bottom
> 2. Find the **PROGRESS DASHBOARD** below to see current phase
> 3. Each phase has a `STATUS:` line — values are: 🔲 `NOT_STARTED` / 🔄 `IN_PROGRESS` / ✅ `DONE` / ⏸️ `BLOCKED`
> 4. Each phase lists **DELIVERABLES** — verify on disk before claiming "done"
> 5. Each phase has **VERIFICATION** commands — run them to confirm phase actually completed
> 6. Resume at the first phase that is not `✅ DONE`
> 7. Update this file's STATUS lines + PROGRESS DASHBOARD as work proceeds
> 8. Never skip phases — order is intentional (low risk → high risk)
>
> **The new project folder will be:** `D:\PHP GITHUB\restaurant-management-system-nestjs\`
> (Old Spring Boot folder untouched as safety net.)

---

## 🔍 SENIOR AUDIT FINDINGS (Self-Review v1)

> **Audit Date:** 17 June 2026 — performed before execution begins. These 13 findings were missed in the initial plan and are now mandatory. Each finding lists severity, which phase it patches, and what to do.

### 🚨 CRITICAL (Production Blockers — Fix Before Phase Execution)

#### F-1: Supabase Connection Pooling + Prisma + PgBouncer 🔥
- **Severity:** CRITICAL — production will fail without this
- **Patches:** Phase 1, Phase 2
- **Issue:** Supabase exposes TWO connection strings:
  - **Direct** (port `5432`) — for migrations and schema introspection only
  - **Pooler / PgBouncer transaction mode** (port `6543`) — for runtime queries
  - PgBouncer transaction mode **does NOT support prepared statements**, which Prisma uses by default → runtime crashes
- **Fix:**
  - `.env` must have TWO URLs:
    ```
    DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    DIRECT_URL="postgresql://...db.supabase.co:5432/postgres"
    ```
  - `schema.prisma` datasource block needs both:
    ```prisma
    datasource db {
      provider  = "postgresql"
      url       = env("DATABASE_URL")
      directUrl = env("DIRECT_URL")
    }
    ```
  - Use `directUrl` for `prisma db pull` and `prisma migrate`. Use `url` (pooler) at runtime.
  - Connection limit per pod = 1 for serverless, 5–10 for VPS

#### F-2: Money / Decimal Precision Handling 💰
- **Severity:** CRITICAL — financial bugs = silent revenue loss
- **Patches:** Phase 2, Phase 9
- **Issue:** Java uses `BigDecimal` everywhere for prices/totals. JavaScript `Number` is float64 → `0.1 + 0.2 === 0.30000000000000004`. NOT acceptable for money.
- **Fix:**
  - All money columns in Prisma must use `Decimal` type (Prisma exposes as `Decimal.js` instance, not number)
  - Use `decimal.js` library for all money arithmetic in services
  - NEVER do `price * qty` with raw numbers — use `new Decimal(price).times(qty)`
  - Add lint rule / code review checklist: no math operators on money fields
  - Add jest tests for cart totals, GST calculations, discount math — verify exact paise match

#### F-3: Timezone Strategy (UTC + IST) 🕒
- **Severity:** CRITICAL — KOT timestamps, shift reports, billing cutoffs will misalign
- **Patches:** Phase 1, Phase 4, Phase 11
- **Issue:** Restaurant business is shift-based. Java JVM timezone vs Node `TZ` env may differ. DB column types matter (`timestamp` vs `timestamptz`).
- **Fix:**
  - Standard: **store in DB as `timestamptz` (UTC)**, display in `Asia/Kolkata` (IST)
  - Set `TZ=Asia/Kolkata` in process env OR force `UTC` and convert at boundary
  - Use `date-fns-tz` or `luxon` for IST conversions — NEVER raw `new Date()`
  - Document: "Business day = 04:00 IST to 03:59 IST next day" or whatever current rule is
  - Verify by comparing existing Java KOT timestamps for 10 sample orders

#### F-4: Webhook URL Update at Payment Providers 💳
- **Severity:** CRITICAL — payments will go to old backend after cutover, money stuck
- **Patches:** Phase 9, Phase 13
- **Issue:** Stripe / PayPal / CCAvenue dashboards have webhook URLs pointing to `https://yourdomain/rms/webhooks/...`. After cutover these still hit Java backend (if still running) or 404 (if Java gone).
- **Fix:**
  - During parallel run: register **BOTH** URLs in Stripe/PayPal dashboard (`/rms/...` AND `/rms-v2/...`). Stripe supports multiple webhook endpoints.
  - CCAvenue typically allows ONE webhook URL → use API gateway / nginx to fan-out
  - On cutover day: remove old URL, keep only new
  - Document each provider's webhook secret rotation procedure
  - Include test: trigger sandbox event → verify NestJS processes it

#### F-5: WebSocket Horizontal Scaling (KDS) 🔥
- **Severity:** CRITICAL — KDS breaks when scaled past 1 instance
- **Patches:** Phase 6
- **Issue:** socket.io stores connection state in process memory. If 2 NestJS instances run behind load balancer, kitchen tablet connects to instance A, cashier order arrives at instance B → message not broadcast → kitchen never sees order.
- **Fix:**
  - Choose ONE:
    - **(a) Sticky session** (LB pins client to instance) — simpler, single-region
    - **(b) Redis adapter** (`@socket.io/redis-adapter`) — proper horizontal scaling, recommended
  - If Supabase Realtime is acceptable as alternative, evaluate — but Redis adapter is the standard
  - Document choice in plan; if Redis: add Redis to Phase 1 infrastructure

### ⚠️ HIGH SEVERITY (Reliability / Correctness)

#### F-6: Cron Jobs / Scheduled Tasks Inventory
- **Severity:** HIGH
- **Patches:** Phase 0, Phase 10
- **Issue:** Java likely has `@Scheduled` annotations (daily reports, token cleanup, FCM token refresh, billing cycles, subscription expiry). Silent if missed.
- **Fix:**
  - Phase 0 audit must `grep -r "@Scheduled" src/main/java` → list every cron
  - Phase 10 ports each to `@nestjs/schedule` `@Cron()` decorators
  - For long jobs (>30s) use BullMQ workers
  - Document each cron's purpose, frequency, and side effects

#### F-7: Performance Baseline Capture Before Migration
- **Severity:** HIGH
- **Patches:** Phase 0, Phase 12
- **Issue:** Cannot measure "regression" without baseline. After cutover, "API feels slow" complaint is unfalsifiable.
- **Fix:**
  - Phase 0: capture Java p50/p95/p99 latency for top 20 endpoints (use Apache Bench, k6, or production APM)
  - Phase 12 (shadow): NestJS p95 must be ≤ Java p95. Block cutover if not met.
  - Persist baseline in `migration-baseline.json` (committed to repo)

#### F-8: Error Monitoring (Sentry) From Day 1
- **Severity:** HIGH
- **Patches:** Phase 1 (move forward from Phase 15)
- **Issue:** Current plan defers Sentry to Phase 15. But during dev/staging/shadow we WILL hit unknown errors. Without Sentry from Phase 1 we debug blind.
- **Fix:** Add `@sentry/node` + `@sentry/nestjs` setup in Phase 1. Free tier sufficient for early phases.

#### F-9: Graceful Shutdown + Health Probes Semantics
- **Severity:** HIGH
- **Patches:** Phase 1, Phase 4
- **Issue:** Node default does NOT handle SIGTERM gracefully. WebSocket connections drop abruptly. K8s/Docker needs:
  - `/health/live` → process alive (always 200 if running)
  - `/health/ready` → ready to accept traffic (false during drain)
- **Fix:**
  - Implement `app.enableShutdownHooks()` in NestJS
  - SIGTERM handler: set ready=false → drain in-flight requests (30s) → close DB pool → close WebSocket → exit
  - Two separate health endpoints, NOT one
  - Use `@nestjs/terminus` for proper semantics

#### F-10: Multi-Instance Write Safety During Shadow Run
- **Severity:** HIGH
- **Patches:** Phase 12
- **Issue:** Current plan says "shadow run" but doesn't specify: do BOTH backends write to DB, or only Java? If both write, race conditions + duplicate state mutations possible.
- **Fix:**
  - Shadow run is **READ-only** for NestJS initially (compare GET responses)
  - For writes: NestJS receives mirrored request, processes in-memory but **rolls back DB transaction** (dry-run mode via Prisma `$transaction` with rollback)
  - Only flip writes when read parity is proven
  - Document explicit toggle: `NESTJS_WRITE_MODE=dry|live`

### 📋 MEDIUM SEVERITY (Address During Relevant Phase)

#### F-11: N+1 Query Risk With Prisma
- **Severity:** MEDIUM
- **Patches:** Phase 5+ (every module phase)
- **Issue:** Hibernate eager fetch hides N+1 problems. Prisma is explicit — must use `include` / `select`. Easy to write `prisma.order.findMany()` then loop `await prisma.user.findUnique(...)` in JS → N+1 disaster.
- **Fix:**
  - Code review checklist: every list endpoint must have explicit `include`
  - Enable Prisma query logging in staging
  - Add k6 load test per phase, fail if query count per request >10

#### F-12: Database Backup BEFORE Cutover
- **Severity:** MEDIUM (high impact, low effort)
- **Patches:** Phase 13
- **Issue:** Plan doesn't explicitly call out: take full Supabase DB snapshot the morning of cutover.
- **Fix:**
  - Pre-cutover step: Supabase dashboard → manual backup → verify restoration on staging
  - Document restore procedure (RTO target: <30 min)

#### F-13: Mobile App Forced Upgrade Strategy
- **Severity:** MEDIUM
- **Patches:** Phase 3, Phase 15
- **Issue:** Dual-mode auth solves login. But what about other API contract changes during migration? Mobile users on old version may break on new endpoints.
- **Fix:**
  - Header `X-API-Version` from mobile clients
  - NestJS responds 426 (Upgrade Required) with deep-link to Play Store / App Store if version too old
  - Cutoff date for old version = same 60-day window as AES256 deprecation
  - Coordinate with mobile team on minimum supported app version

---

## 🔧 AUDIT-DRIVEN PHASE UPDATES (Apply During Execution)

| Phase | Add These Audit-Driven Sub-Tasks |
|---|---|
| **Phase 0** | F-6 (cron inventory), F-7 (perf baseline) |
| **Phase 1** | F-1 (Supabase pooler config), F-8 (Sentry setup), F-9 (graceful shutdown + 2 health endpoints) |
| **Phase 2** | F-1 (`directUrl` block in schema.prisma), F-2 (Decimal columns audit) |
| **Phase 3** | F-13 (X-API-Version header support) |
| **Phase 4** | F-3 (timezone middleware), F-9 (@nestjs/terminus health module) |
| **Phase 5+** | F-11 (Prisma include / N+1 reviews in every module) |
| **Phase 6** | F-5 (Redis adapter for socket.io OR sticky session decision) |
| **Phase 9** | F-2 (Decimal arithmetic enforcement), F-4 (dual webhook URL registration) |
| **Phase 10** | F-6 (port all cron jobs) |
| **Phase 11** | F-3 (timezone in report timestamps) |
| **Phase 12** | F-7 (compare NestJS p95 vs baseline), F-10 (dry-run mode toggle) |
| **Phase 13** | F-4 (cutover webhook URL switch), F-12 (DB backup before cutover) |
| **Phase 15** | F-13 (mobile force-upgrade enforcement after 60 days) |

---

## 📊 PROGRESS DASHBOARD

| Phase | Title | Status | Updated |
|---|---|---|---|
| 0 | Pre-Migration Audit & Inventory | 🔲 NOT_STARTED | — |
| 1 | NestJS Scaffold + DevOps + DB Connect | 🔲 NOT_STARTED | — |
| 2 | Prisma Schema Introspection from Supabase | 🔲 NOT_STARTED | — |
| 3 | Auth Dual-Mode Bridge (AES256 ↔ JWT) | 🔲 NOT_STARTED | — |
| 4 | Shared Infrastructure (logger, config, validation, errors) | 🔲 NOT_STARTED | — |
| 5 | Customer + Public Modules (low risk first) | 🔲 NOT_STARTED | — |
| 6 | Cashier + Branch + Kitchen Modules + KDS WebSocket | 🔲 NOT_STARTED | — |
| 7 | Restaurant Owner + Branch Manager Modules | 🔲 NOT_STARTED | — |
| 8 | Superadmin + Admin Modules | 🔲 NOT_STARTED | — |
| 9 | Payments (Stripe / PayPal / CCAvenue) + Webhooks | 🔲 NOT_STARTED | — |
| 10 | Storage & Notification (S3, Drive, FCM, SMTP) | 🔲 NOT_STARTED | — |
| 11 | Reports (Excel / PDF) — Exact Format Match | 🔲 NOT_STARTED | — |
| 12 | Integration Testing + Shadow Run | 🔲 NOT_STARTED | — |
| 13 | Production Cutover | 🔲 NOT_STARTED | — |
| 14 | Decommission Spring Boot | 🔲 NOT_STARTED | — |
| 15 | Post-Migration Hardening | 🔲 NOT_STARTED | — |

**Overall Progress:** 0 / 16 phases complete (0%)

---

## 🎯 1. CONTEXT & GOAL

### Why This Migration?

Spring Boot 3.5 on Java 17 is technically sound but the **JVM runtime requires 1–2 GB RAM per instance**, making hosting cost grow disproportionately for a SaaS that targets 50k DAU at Year 5. The bottleneck is **infrastructure footprint**, not application architecture.

NestJS gives us:
- **Same architectural mental model** as Spring Boot (controllers, services, modules, DI, decorators)
- **₹16.5 lakh saved over 5 years** (5-year TCO drops from ₹45.12L → ₹28.58L)
- **200–400 MB RAM per instance** (vs 1–2 GB) → higher VM density
- **Native WebSocket** for Kitchen Display System (Tier-1 product feature)
- **Same language as React frontend** → shared TypeScript types, fewer integration bugs
- **Future microservices** path is natural in Node.js

### Non-Goals

- ❌ NOT migrating database (Supabase Postgres stays)
- ❌ NOT changing React frontend (only API base URL flips)
- ❌ NOT changing Firebase project, Stripe account, PayPal merchant ID, AWS S3 bucket
- ❌ NOT changing AES256 token format until mobile clients are upgraded (dual-mode required)

### Risk Posture (User Approved)

User explicitly accepted re-testing burden for:
- All payment webhooks
- All 9 role-based access flows
- Excel/PDF report format exactness
- Firebase FCM delivery
- Mobile auth dual-mode

---

## 🛠️ 2. LOCKED TECHNICAL DECISIONS

| Concern | Decision | Reason |
|---|---|---|
| Backend framework | **NestJS 10+** | Spring Boot mental match |
| Runtime | **Node.js 20 LTS** | Long support, stable |
| Language | **TypeScript 5+ (strict mode)** | Type safety mandatory |
| ORM | **Prisma 5+** | Best-in-class for Postgres, type-safe, auto-introspection |
| Database | **Supabase PostgreSQL (no change)** | Same DB, zero migration |
| Auth tokens | **JWT (new) + AES256 dual-mode (60 days)** | Mobile compat |
| Password hashing | **bcrypt** (12 rounds) | Industry standard |
| Validation | **class-validator + class-transformer** | NestJS native |
| Logger | **pino** | 5x faster than winston |
| Config | **@nestjs/config + Joi schema validation** | Type-safe env |
| WebSocket | **@nestjs/websockets + socket.io** | For KDS real-time |
| Excel | **exceljs** | Apache POI replacement |
| PDF | **pdfkit** (simple) + **puppeteer** (complex HTML→PDF) | iText/PDFBox replacement |
| Image | **sharp** | Thumbnailator replacement (5x faster) |
| S3 | **@aws-sdk/client-s3** | Official AWS SDK v3 |
| Google Drive | **googleapis** | Official Google SDK |
| Firebase | **firebase-admin** | Same Firebase project ID |
| Stripe | **stripe** (official Node SDK) | Same merchant account |
| PayPal | **@paypal/checkout-server-sdk** | Same merchant ID |
| Email | **nodemailer** | Gmail SMTP same config |
| Background jobs | **BullMQ + Redis** (only if needed) | Defer until proven necessary |
| API docs | **@nestjs/swagger** | Auto-generated from decorators |
| Testing | **Jest + Supertest** | NestJS default |
| Process manager | **PM2** | Production proven |
| Deployment | **Railway / Render / Hetzner VPS** | TBD by user |
| Container | **Docker (multi-stage build)** | Reproducible builds |
| CI/CD | **GitHub Actions** | Already used likely |
| Secret manager | **.env + 1Password / Doppler / AWS Secrets** | TBD; NO MORE PLAIN TEXT |

---

## 📚 3. LIBRARY MAPPING REFERENCE TABLE

| Spring Boot (Current) | NestJS Replacement | Notes |
|---|---|---|
| spring-boot-starter-data-jpa + Hibernate | **Prisma** | Auto-introspect existing 52 tables |
| spring-boot-starter-web | **@nestjs/core + @nestjs/platform-express** | Built-in |
| spring-boot-starter-mail (JavaMailSender) | **nodemailer** | Same Gmail SMTP creds work |
| Jakarta Validation API | **class-validator + class-transformer** | Decorator-based |
| Log4j2 | **pino + nestjs-pino** | Structured JSON logs |
| Apache POI 5.2.5 | **exceljs** | Excel read/write |
| iText 7 (8.0.5) + PDFBox 2.0.28 | **pdfkit** + **puppeteer** | pdfkit for simple, puppeteer for HTML templates |
| Thumbnailator 0.4.8 | **sharp** | Image compression/resize |
| AWS S3 SDK Java 2.20.20 | **@aws-sdk/client-s3** + **@aws-sdk/s3-request-presigner** | v3 SDK |
| Google API Client + Drive v3 | **googleapis** | Single npm package |
| Firebase Admin SDK 9.4.3 | **firebase-admin** | Same package name |
| Stripe Java 24.3.0 | **stripe** | Official Node SDK |
| PayPal (current implementation) | **@paypal/checkout-server-sdk** | + webhook signature verification |
| CCAvenue (custom AES) | Port encryption logic to Node `crypto` | Same algorithm, JS version |
| Lombok | TypeScript classes (no need) | Native |
| org.json | Native JSON (no library) | Built into JS |
| commons-codec | Node `crypto` module | Built-in |
| Spring Security (if any) | **@nestjs/passport + @nestjs/jwt + Guards** | More flexible |

---

## 📁 4. NEW PROJECT FOLDER STRUCTURE

```
D:\PHP GITHUB\restaurant-management-system-nestjs\
├── prisma\
│   ├── schema.prisma              # Auto-introspected from Supabase
│   └── migrations\                # Empty initially (DB unchanged)
├── src\
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   ├── common\
│   │   ├── decorators\            # @Roles, @CurrentUser, @Public
│   │   ├── filters\               # Global exception filter
│   │   ├── guards\                # JwtAuthGuard, RolesGuard, Aes256AuthGuard (legacy)
│   │   ├── interceptors\          # LoggingInterceptor, TransformInterceptor
│   │   ├── pipes\                 # ValidationPipe (global)
│   │   ├── middleware\            # CorsMiddleware, RequestIdMiddleware
│   │   └── utils\                 # Helpers (date, money, crypto)
│   ├── config\
│   │   ├── configuration.ts       # Type-safe env loader
│   │   ├── validation.schema.ts   # Joi schema
│   │   └── database.config.ts
│   ├── auth\
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies\            # JwtStrategy, Aes256LegacyStrategy
│   │   └── dto\
│   ├── modules\
│   │   ├── customer\              # Phase 5
│   │   ├── public\                # Phase 5
│   │   ├── cashier\               # Phase 6
│   │   ├── branch\                # Phase 6
│   │   ├── kitchen\               # Phase 6 (with WebSocket gateway)
│   │   ├── owner\                 # Phase 7
│   │   ├── manager\               # Phase 7
│   │   ├── admin\                 # Phase 8
│   │   ├── superadmin\            # Phase 8
│   │   ├── payment\               # Phase 9 (stripe, paypal, ccavenue)
│   │   ├── storage\               # Phase 10 (S3, Drive)
│   │   ├── notification\          # Phase 10 (FCM, SMTP)
│   │   └── reports\               # Phase 11 (Excel, PDF)
│   ├── prisma\
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts      # Connection lifecycle
│   └── websocket\
│       └── kitchen.gateway.ts     # KDS real-time
├── test\
│   ├── e2e\                       # End-to-end tests per module
│   └── fixtures\                  # Test data
├── docker\
│   ├── Dockerfile                 # Multi-stage build
│   └── docker-compose.yml         # Local dev
├── .env.example                   # Template
├── .env                           # Real secrets (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

---

## 🚦 PHASES

---

### 📍 PHASE 0 — Pre-Migration Audit & Inventory

**STATUS:** 🔲 NOT_STARTED
**Duration:** 1 week
**Goal:** Catalog all 253 endpoints, classify by complexity, identify quick wins and risk areas.

**DELIVERABLES:**
- `migration-inventory.md` — table of all 253 endpoints grouped by module
- Endpoint columns: `path | method | controller | service | role(s) | DB tables touched | external APIs | complexity (S/M/L/XL) | risk (Low/Med/High)`
- Identify endpoints that:
  - Touch payments (HIGH risk)
  - Generate PDF/Excel (format-sensitive)
  - Have WebSocket / real-time needs (KDS)
  - Are mobile-only consumers (auth dual-mode critical)
  - Are deprecated / unused (skip migration)

**SUB-TASKS:**
- [ ] Grep all `@RestController` classes → list
- [ ] Grep all `@RequestMapping`, `@GetMapping`, `@PostMapping`, etc.
- [ ] For each controller, identify roles by `@PreAuthorize` or guard logic
- [ ] Map controller → service → repository chain
- [ ] Identify Firebase/Stripe/PayPal/S3 touchpoints
- [ ] Classify each endpoint S/M/L/XL by lines of business logic
- [ ] Flag endpoints currently broken or unused (don't waste time porting them)

**VERIFICATION:**
- `migration-inventory.md` exists and lists ≥250 endpoints
- Each endpoint has all required columns filled
- HIGH-risk endpoints clearly marked

**CHECKPOINT FOR NEXT SESSION:** Read `migration-inventory.md` to know exactly what's left.

---

### 📍 PHASE 1 — NestJS Scaffold + DevOps + DB Connect

**STATUS:** 🔲 NOT_STARTED
**Duration:** 1 week
**Goal:** Empty NestJS project that connects to Supabase, runs on port 8092 (separate from Java 8091), passes health check.

**DELIVERABLES:**
- `D:\PHP GITHUB\restaurant-management-system-nestjs\` folder created
- `nest new` scaffolded
- `package.json` with all locked dependencies
- `.env` with Supabase credentials (NOT in git)
- `.env.example` checked into git
- `src/main.ts` bootstraps on port 8092 with `/rms-v2` prefix
- `GET /rms-v2/health` returns 200 OK with `{ status: "up", db: "connected" }`
- Dockerfile builds successfully
- Local `docker compose up` works
- GitHub repo created, initial commit pushed

**SUB-TASKS:**
- [ ] `npm i -g @nestjs/cli`
- [ ] `nest new restaurant-management-system-nestjs --strict`
- [ ] Install dependencies (Prisma, config, jwt, passport, swagger, pino, validation)
- [ ] Configure `tsconfig.json` strict mode
- [ ] Create `src/config/configuration.ts` with Joi validation
- [ ] Create `src/prisma/prisma.service.ts` with lifecycle hooks
- [ ] Wire `PrismaModule` as global
- [ ] Health check endpoint
- [ ] Dockerfile multi-stage build
- [ ] `.gitignore` (node_modules, .env, dist, coverage)
- [ ] GitHub Actions: lint + test + build on PR
- [ ] README.md with setup instructions

**VERIFICATION:**
```bash
cd D:\PHP GITHUB\restaurant-management-system-nestjs
npm install
npm run start:dev
# In another terminal:
curl http://localhost:8092/rms-v2/health
# Expect: {"status":"up","db":"connected"}
```

**CHECKPOINT FOR NEXT SESSION:** If `nestjs/` folder exists and `npm run start:dev` shows DB connected, phase 1 is done.

---

### 📍 PHASE 2 — Prisma Schema Introspection from Supabase

**STATUS:** 🔲 NOT_STARTED
**Duration:** 3 days
**Goal:** Auto-generate Prisma schema from existing 52 Supabase tables. ZERO manual entity writing.

**DELIVERABLES:**
- `prisma/schema.prisma` with 52 models auto-generated
- `npx prisma generate` produces type-safe client
- All foreign key relations present
- Manual review of generated names (snake_case → camelCase if needed)
- All enum types preserved
- `prisma/seed.ts` for test data (optional, only for local)

**SUB-TASKS:**
- [ ] Set `DATABASE_URL` in `.env` to Supabase connection string
- [ ] Run `npx prisma db pull` → auto-creates `schema.prisma`
- [ ] Review every model — fix naming, add `@map` where needed
- [ ] Verify all relations are correct
- [ ] Run `npx prisma generate`
- [ ] Write smoke test: `await prisma.user.findFirst()` returns row
- [ ] Document any quirks (composite keys, custom types)

**VERIFICATION:**
```bash
npx prisma db pull
npx prisma generate
# Should show "✔ Generated Prisma Client"
npm run smoke-test:prisma
# Should fetch 1 row from each major table
```

**CHECKPOINT FOR NEXT SESSION:** Open `prisma/schema.prisma`. If it has ≥52 `model` blocks, phase 2 done.

---

### 📍 PHASE 3 — Auth Dual-Mode Bridge (AES256 ↔ JWT)

**STATUS:** 🔲 NOT_STARTED
**Duration:** 2 weeks
**Goal:** Accept BOTH old AES256 tokens (mobile clients) AND new JWT tokens (web). Issue JWT on new logins. NO breaking change for any client.

**WHY THIS IS CRITICAL:** Mobile apps in production have AES256 tokens. If we break them, customer apps stop working overnight.

**DELIVERABLES:**
- `auth.controller.ts` with `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `JwtStrategy` (Passport) — validates new JWT
- `Aes256LegacyStrategy` — validates old AES256 token using SAME algorithm as Java
- `DualAuthGuard` — tries JWT first, falls back to AES256
- `@CurrentUser()` decorator extracts user from either strategy
- `@Roles('admin','cashier')` decorator + `RolesGuard`
- `@Public()` decorator for public endpoints
- Migration plan: 60 days dual-mode → force mobile upgrade → drop AES256

**SUB-TASKS:**
- [ ] Copy AES256 encryption code from Java → TypeScript (use Node `crypto`)
- [ ] Verify port: encrypt-then-decrypt round-trip matches Java output byte-for-byte
- [ ] Build JwtStrategy with 15-min access token + 7-day refresh token
- [ ] Build Aes256LegacyStrategy
- [ ] Build composite guard that tries JWT → AES256
- [ ] Add token issuance: respond with BOTH new JWT AND legacy AES256 for backward compat
- [ ] Build refresh token rotation
- [ ] Build logout (blacklist refresh token in DB)
- [ ] Add bcrypt for password hashing (migrate from current scheme if needed)
- [ ] E2E test: login → call protected endpoint with JWT → success
- [ ] E2E test: login (old style) → call with AES256 → success

**VERIFICATION:**
```bash
# Test 1: JWT login
curl -X POST http://localhost:8092/rms-v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@x.com","password":"pass"}'
# Should return { access_token, refresh_token, legacy_token }

# Test 2: Use legacy token on new backend
curl http://localhost:8092/rms-v2/customer/profile \
  -H "Authorization: AES256 <legacy_token_from_java>"
# Should return user profile
```

**CHECKPOINT FOR NEXT SESSION:** If both JWT and AES256 tokens work on protected endpoints, phase 3 done.

---

### 📍 PHASE 4 — Shared Infrastructure

**STATUS:** 🔲 NOT_STARTED
**Duration:** 1 week
**Goal:** Common cross-cutting concerns ready before any feature module.

**DELIVERABLES:**
- Global exception filter → standard error JSON `{ statusCode, message, error, timestamp, path }`
- Global validation pipe (whitelist + transform + forbidUnknownValues)
- Global logger (pino) with request ID correlation
- Global response interceptor → standard wrapper `{ success, data, message }` (match existing API contract)
- Health check module with DB + external service pings
- Swagger setup at `/rms-v2/docs`
- CORS configured (whitelist React origin)
- Rate limiter (`@nestjs/throttler`)
- Helmet (security headers)
- Request ID middleware (correlation)

**SUB-TASKS:**
- [ ] Inspect 1-2 existing Java responses → match exact response shape
- [ ] Build `HttpExceptionFilter`
- [ ] Build `ValidationPipe` config
- [ ] Build `LoggingInterceptor` (entry/exit + duration)
- [ ] Build `ResponseTransformInterceptor`
- [ ] Configure Swagger
- [ ] Configure CORS for production + staging origins
- [ ] Throttler: 100 req/min/IP default

**VERIFICATION:**
```bash
# Trigger validation error
curl -X POST http://localhost:8092/rms-v2/auth/login -d '{}'
# Should return { success: false, error: "Validation failed", message: [...] }

# Swagger UI
open http://localhost:8092/rms-v2/docs
```

**CHECKPOINT FOR NEXT SESSION:** If Swagger UI loads and shows global filters working, phase 4 done.

---

### 📍 PHASE 5 — Customer + Public Modules (LOW RISK FIRST)

**STATUS:** 🔲 NOT_STARTED
**Duration:** 2 weeks
**Goal:** Port read-heavy, lowest-risk endpoints first. Build confidence, validate stack.

**WHY FIRST:** Customer browsing menu, viewing restaurant — no payment, no state mutation chaos. If something breaks, no money lost.

**DELIVERABLES:**
- `CustomerModule` with all customer-facing endpoints
- `PublicModule` with unauthenticated endpoints (landing, public menu)
- All response shapes match Java exactly
- Frontend regression tested against new backend

**SUB-TASKS:**
- [ ] Port: customer profile CRUD
- [ ] Port: address book CRUD
- [ ] Port: order history (read)
- [ ] Port: favorites
- [ ] Port: cart (if backend-stored)
- [ ] Port: public menu / restaurant lookup
- [ ] Port: search endpoints
- [ ] Port: feedback / reviews
- [ ] E2E tests for each
- [ ] Side-by-side response diff vs Java (postman / newman script)

**VERIFICATION:**
- All Phase 5 endpoints have E2E tests passing
- Response diff vs Java backend = 0 differences in shape
- Frontend customer screens work pointed at new backend

**CHECKPOINT FOR NEXT SESSION:** Check `src/modules/customer/` and `src/modules/public/` — count controllers ported vs inventory.

---

### 📍 PHASE 6 — Cashier + Branch + Kitchen Modules + KDS WebSocket 🔥

**STATUS:** 🔲 NOT_STARTED
**Duration:** 3 weeks
**Goal:** Core operational flow. KDS real-time architecture goes live here.

**THIS IS THE PRODUCT'S HEART. Test obsessively.**

**DELIVERABLES:**
- `CashierModule` — order creation, billing, payment trigger
- `BranchModule` — branch management, staff, tables
- `KitchenModule` — order queue, status updates (PENDING → COOKING → READY → SERVED)
- `KitchenGateway` — WebSocket gateway for real-time push
- FCM fallback for offline kitchen tablets
- Order state machine enforced at service layer (no invalid transitions)

**KDS ARCHITECTURE (Senior Recommendation):**
```
Cashier creates order
  ↓
OrderService.create()
  ↓
DB write (Prisma transaction)
  ↓
EventEmitter emit('order.created', order)
  ↓
KitchenGateway listens:
  ├─→ Broadcast to kitchen WebSocket room (sub-500ms)
  └─→ FCM push to kitchen tablet (fallback / offline reconnect)
```

**SUB-TASKS:**
- [ ] Port all cashier endpoints
- [ ] Port all branch endpoints
- [ ] Port all kitchen endpoints
- [ ] Build `KitchenGateway` with socket.io
- [ ] Build authentication for WebSocket (JWT in handshake)
- [ ] Build room-per-branch isolation (branch A cannot see branch B orders)
- [ ] Build order state machine (xstate or simple guards)
- [ ] FCM fallback service
- [ ] Load test: 100 orders/sec sustained, kitchen latency <500ms

**VERIFICATION:**
- Open kitchen UI → create order from cashier UI → order appears on kitchen screen in <1s
- Disconnect kitchen WebSocket → create order → FCM push delivered
- Reconnect → missed orders sync

**CHECKPOINT FOR NEXT SESSION:** If `KitchenGateway` exists + WebSocket integration test passes, phase 6 done.

---

### 📍 PHASE 7 — Restaurant Owner + Branch Manager Modules

**STATUS:** 🔲 NOT_STARTED
**Duration:** 2 weeks
**Goal:** Port management dashboards, settings, staff control.

**DELIVERABLES:**
- `OwnerModule` — multi-branch overview, subscription, billing view
- `ManagerModule` — branch-level operations, inventory, staff
- Permission boundary tests (owner sees all branches, manager sees only assigned)

**SUB-TASKS:**
- [ ] Port owner dashboard endpoints
- [ ] Port branch manager endpoints
- [ ] Port inventory / menu management
- [ ] Port staff management
- [ ] Port shift management
- [ ] Role boundary E2E tests

**VERIFICATION:**
- Owner can list 10 branches, manager assigned to branch 3 sees only branch 3
- All settings persist correctly

---

### 📍 PHASE 8 — Superadmin + Admin Modules

**STATUS:** 🔲 NOT_STARTED
**Duration:** 2 weeks
**Goal:** SaaS-level control plane.

**DELIVERABLES:**
- `SuperadminModule` — tenant management, global config, plan management
- `AdminModule` — support tools, audit logs

**SUB-TASKS:**
- [ ] Port tenant CRUD
- [ ] Port subscription plan management
- [ ] Port global feature flags
- [ ] Port audit log viewer
- [ ] Port impersonation (with audit trail)

**VERIFICATION:**
- All superadmin actions logged to audit table
- Impersonation creates audit row, expires in 30 min

---

### 📍 PHASE 9 — Payments (Stripe / PayPal / CCAvenue) + Webhooks 💳

**STATUS:** 🔲 NOT_STARTED
**Duration:** 2 weeks
**Goal:** Money flow. Test obsessively. NO ROOM FOR BUGS.

**THIS PHASE NEEDS PRODUCTION-GRADE CARE. 1 bug = revenue loss.**

**DELIVERABLES:**
- `PaymentModule` with Stripe, PayPal, CCAvenue adapters (strategy pattern)
- Webhook endpoints with signature verification:
  - `POST /webhooks/stripe` — verify with `stripe.webhooks.constructEvent()`
  - `POST /webhooks/paypal` — verify with PayPal webhook ID
  - `POST /webhooks/ccavenue` — verify with shared HMAC secret
- Idempotency keys on all payment intents
- Replay protection on webhooks (store processed event IDs)
- Audit trail in `payment_events` table
- Reconciliation report (cron job daily)

**SUB-TASKS:**
- [ ] Stripe: create payment intent, confirm, refund
- [ ] Stripe webhook signature verification
- [ ] PayPal: create order, capture, refund
- [ ] PayPal webhook signature verification (using `webhook.id`)
- [ ] CCAvenue: redirect-based checkout, response decryption
- [ ] CCAvenue webhook HMAC verification
- [ ] Idempotency middleware on payment endpoints
- [ ] Webhook event store table
- [ ] Reconciliation cron: compare DB orders vs gateway records
- [ ] Test against Stripe test mode, PayPal sandbox

**VERIFICATION:**
- Stripe test card 4242 4242 4242 4242 → payment success → webhook → order marked paid
- Duplicate webhook → ignored (idempotency)
- Wrong signature → 401
- Reconciliation cron flags mismatches

**CHECKPOINT FOR NEXT SESSION:** All 3 gateways tested in sandbox + webhook signature verification PASS.

---

### 📍 PHASE 10 — Storage & Notification Services

**STATUS:** 🔲 NOT_STARTED
**Duration:** 1 week
**Goal:** File and notification infrastructure.

**DELIVERABLES:**
- `StorageModule` with S3 + Google Drive adapters (strategy pattern, env switch)
- `NotificationModule` with FCM + SMTP + (future) SMS providers
- Pre-signed URL generation for direct upload (no proxying via API)
- Image compression pipeline (sharp) on upload

**SUB-TASKS:**
- [ ] S3 upload with `@aws-sdk/client-s3`
- [ ] Pre-signed PUT URL with `@aws-sdk/s3-request-presigner`
- [ ] Google Drive upload with `googleapis`
- [ ] Image resize/compress with sharp
- [ ] Firebase Admin SDK setup (use SAME service account JSON, move to secret manager)
- [ ] FCM single + multicast push
- [ ] SMTP with nodemailer (Gmail app password)
- [ ] Notification templates folder
- [ ] Queue notifications via BullMQ (defer if no Redis)

**VERIFICATION:**
- Upload image → S3 → URL returned → image renders
- Send FCM to test device → received
- Send email to test address → delivered

---

### 📍 PHASE 11 — Reports (Excel / PDF) — Exact Format Match 📄

**STATUS:** 🔲 NOT_STARTED
**Duration:** 2 weeks
**Goal:** Reports must look IDENTICAL to existing Java output. Customers have seen these.

**WHY EXACT MATCH MATTERS:** Restaurant owners screenshot reports for audits, taxes, vendor disputes. Format drift = customer complaints.

**DELIVERABLES:**
- `ReportsModule` with Excel + PDF generators
- Side-by-side visual diff vs Java output
- All fonts, colors, column widths preserved

**SUB-TASKS:**
- [ ] List all existing report types (sales, KOT, invoice, tax, payroll, etc.)
- [ ] For each: open Java template, identify columns/style
- [ ] Port to exceljs with cell styles
- [ ] Port complex PDFs to puppeteer (HTML/CSS template → PDF)
- [ ] Port simple PDFs to pdfkit
- [ ] Generate same report from Java + NestJS → visual diff
- [ ] Fix discrepancies until pixel-close

**VERIFICATION:**
- For each report type, generate from both backends, side-by-side comparison passes review by user

---

### 📍 PHASE 12 — Integration Testing + Shadow Run

**STATUS:** 🔲 NOT_STARTED
**Duration:** 2 weeks
**Goal:** Run NestJS in production alongside Java, write to BOTH, read from Java, compare.

**SHADOW RUN STRATEGY:**
```
Client request
  ↓
API Gateway / nginx
  ├─→ Java (primary, serves response)
  └─→ NestJS (shadow, response compared async, NOT served)
```

**DELIVERABLES:**
- nginx config that mirrors writes to both
- Diff worker that compares responses, logs to file
- Daily diff report
- E2E test suite covering 80%+ critical paths

**SUB-TASKS:**
- [ ] Deploy NestJS to staging next to Java
- [ ] nginx mirror module to copy requests
- [ ] Diff worker (compare JSON ignoring timestamps)
- [ ] Run 1 week shadow on staging
- [ ] Run 1 week shadow on production (READS only initially)
- [ ] Fix all discrepancies
- [ ] Stress test: 500 concurrent users sustained 10 min

**VERIFICATION:**
- Diff rate <0.1% on shadow traffic for 7 consecutive days
- p95 latency NestJS ≤ Java latency
- Zero 5xx errors in shadow window

**CHECKPOINT FOR NEXT SESSION:** If shadow diff log shows clean 7-day window, phase 12 done.

---

### 📍 PHASE 13 — Production Cutover

**STATUS:** 🔲 NOT_STARTED
**Duration:** 1 week (with rollback ready)
**Goal:** Flip traffic from Java to NestJS gradually.

**STRATEGY:** Blue-green with weighted DNS / load balancer.

**DELIVERABLES:**
- 1% → 10% → 50% → 100% traffic ramp over 5 days
- Java backend kept as standby for instant rollback (DNS flip)
- Monitoring dashboards (latency, error rate, business KPIs)

**SUB-TASKS:**
- [ ] Day 1: 1% production traffic to NestJS, monitor 24h
- [ ] Day 2: 10% if metrics green
- [ ] Day 3: 50% if metrics green
- [ ] Day 4: 100%
- [ ] Day 5: Soak, on-call ready
- [ ] Rollback script ready (DNS flip back to Java)

**VERIFICATION:**
- 100% traffic on NestJS for 48h with no incidents
- Business KPIs (orders/hour, payment success rate) unchanged

**ROLLBACK TRIGGERS:** Error rate >1%, p95 latency >2x baseline, payment failure rate >0.5%

---

### 📍 PHASE 14 — Decommission Spring Boot

**STATUS:** 🔲 NOT_STARTED
**Duration:** 3 days
**Goal:** Save the hosting cost. Cost savings begin here.

**SUB-TASKS:**
- [ ] After 14 days clean on NestJS, stop Java traffic
- [ ] Archive Java code (tag, freeze repo)
- [ ] Decommission Java server (cost savings start)
- [ ] Update DNS, remove Java health checks
- [ ] Notify team

**VERIFICATION:**
- Hosting bill next month shows expected drop
- All clients (web + mobile) working

---

### 📍 PHASE 15 — Post-Migration Hardening

**STATUS:** 🔲 NOT_STARTED
**Duration:** Ongoing
**Goal:** Pay down security debt, optimize, scale.

**SUB-TASKS:**
- [ ] Move `.env` secrets to Doppler / AWS Secrets Manager
- [ ] Rotate DB password (was plain text in old `application.properties`)
- [ ] Move Firebase service account JSON out of source tree
- [ ] Enable Sentry / Datadog for production observability
- [ ] After 60 days dual-mode → drop AES256 legacy auth
- [ ] Set up automated daily DB backups (Supabase has this; verify)
- [ ] Penetration test
- [ ] Capacity planning for Year 2 traffic
- [ ] Documentation: runbook, on-call playbook

---

## 🚨 5. ROLLBACK PLAN (At Any Phase)

If any phase fails badly:
1. **Stop migration immediately.**
2. Java backend has been kept running in parallel through Phase 12 — switch traffic back via DNS/load balancer (<5 min).
3. Document root cause in this plan file under a new `## Incident Log` section.
4. Fix → re-run that phase → resume.

---

## 🔐 6. SECURITY DEBT TO PAY DURING MIGRATION

| Issue | Current State | Fix During Migration |
|---|---|---|
| DB password in plain text | `application.properties` | `.env` + secret manager |
| Firebase service account JSON in classpath | Committed to repo | Move to secret manager, load at runtime |
| AES256 custom auth | Non-standard, hard to audit | Migrate to JWT (standard) after 60-day window |
| No rate limiting | Open to abuse | `@nestjs/throttler` global |
| No CORS whitelist (assumed) | Verify | Strict origin whitelist |
| No Helmet | No security headers | Add `helmet` middleware |

---

## 📞 7. EMERGENCY CONTACT POINTS

- **Project owner:** shaikhparvez7863 (webdekhodevelopers@gmail.com)
- **Supabase project ID:** `wcjsezlljrxmnymoowjx` (DB hostname prefix)
- **Firebase project:** `restms-86a5d`
- **Production API base (old):** `/rms` on port 8091
- **Production API base (new):** `/rms-v2` on port 8092 (during parallel run)

---

## 📋 8. CHECKLIST FOR NEXT SESSION RESUMPTION

When a new session starts work on this plan:

1. [ ] Read this file top-to-bottom
2. [ ] Look at **PROGRESS DASHBOARD** — find first non-DONE phase
3. [ ] Open that phase section, read its DELIVERABLES list
4. [ ] Run that phase's VERIFICATION commands — see what's actually done
5. [ ] If phase partially done, find first unchecked sub-task
6. [ ] Continue from there
7. [ ] After completing each phase, update the STATUS line AND the PROGRESS DASHBOARD row
8. [ ] Commit changes to git with phase number in message

---

## 🏁 9. SUCCESS CRITERIA (Overall Migration)

Migration is complete when:
- ✅ All 16 phases marked DONE
- ✅ Java backend decommissioned for ≥14 days with no rollback
- ✅ Hosting cost reduced by ≥30%
- ✅ p95 API latency ≤ Java baseline
- ✅ Error rate ≤ Java baseline
- ✅ No customer-reported incidents traceable to migration
- ✅ Team comfortable with NestJS (verified by code review velocity)

---

**This plan is the single source of truth. Update it as you work. Trust the phase order — do not skip ahead.**
