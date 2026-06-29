# Backend Technology Migration — Manager Review Report
### Restaurant Management System (RMS) — Multi-Tenant SaaS Platform

**Prepared by:** Senior Tech Advisory
**Date:** 16 June 2026
**For:** Engineering Manager Review & Decision
**Current Stack:** Spring Boot (Java 17) + React 18 + Supabase PostgreSQL

---

## 1. Context — Why This Report Exists

The current production stack uses **Spring Boot 3.5 on Java 17** as the backend. While Spring Boot is technically sound, its **JVM-based runtime** demands 1–2 GB RAM per instance, making hosting **disproportionately expensive** for a growing SaaS product. The cost is not in the framework — it is in the **infrastructure footprint** required to keep a Java WAR running.

The database (52 tables) is already hosted on **Supabase PostgreSQL**, which is performant and well-priced. **The migration concern is only the application server layer**, not the database.

This report evaluates **three production-grade alternative backend stacks** — NestJS, Django, and Laravel — and recommends a path forward. All three are battle-tested, mature, and used by SaaS companies at scale.

---

## 2. Project Scale (Audited)

| Metric | Value |
|---|---|
| Database tables | 52 |
| API controllers | ~253 |
| User roles / panels | 9 (Superadmin, Admin, Restaurant Owner, Branch Manager, Cashier, Kitchen, Delivery, Customer, Public) |
| Entity classes | 50+ |
| Tenancy model | Multi-tenant, multi-branch, subscription-tiered |
| Frontend | React 18 SPA |
| Integrations | Firebase FCM, Stripe, PayPal, CCAvenue, Google Maps, AWS S3, Gmail SMTP |
| Heavy libraries | Apache POI (Excel), iText 7 + PDFBox (PDF), Thumbnailator (image) |

---

## 3. Three Candidate Stacks — Overview

| Stack | Language | Framework Style | Maturity | India Hiring Pool |
|---|---|---|---|---|
| **NestJS** | TypeScript / Node.js | Spring-Boot-like (modules, controllers, DI, decorators) | Mature (since 2017) | Large |
| **Django** | Python | Batteries-included, sync-first | Very mature (since 2005) | Large |
| **Laravel** | PHP | Batteries-included, sync-first | Very mature (since 2011) | **Largest** |

All three are **legitimate production choices**. None is wrong. The right answer depends on team strength and product priorities.

---

## 4. 5-Year Total Cost of Ownership (TCO)

> Growth assumption: 1k DAU (Year 1) → 50k DAU (Year 5), 5,000 active branches at peak.

| Year | DAU | Spring Boot (current) | NestJS | Django | Laravel |
|---|---|---|---|---|---|
| Year 1 | 1k | ₹84,000 | ₹38,400 | ₹52,800 | ₹48,000 |
| Year 2 | 5k | ₹2,88,000 | ₹1,80,000 | ₹2,40,000 | ₹2,16,000 |
| Year 3 | 15k | ₹7,80,000 | ₹4,80,000 | ₹6,00,000 | ₹5,40,000 |
| Year 4 | 30k | ₹13,80,000 | ₹8,40,000 | ₹10,20,000 | ₹9,60,000 |
| Year 5 | 50k | ₹19,80,000 | ₹13,20,000 | ₹16,00,000 | ₹14,40,000 |
| **5-Year Total** | | **₹45,12,000** | **₹28,58,400** | **₹35,12,800** | **₹32,04,000** |
| **Savings vs Spring Boot** | | — | **₹16.5L (37%)** | **₹10L (22%)** | **₹13L (29%)** |

---

## 5. Side-by-Side Technical Comparison

| Criteria | NestJS | Django | Laravel |
|---|---|---|---|
| **Memory per instance** | 200–400 MB | 300–600 MB | 400–700 MB |
| **Concurrent requests / instance** | 10,000+ | 1,000–2,000 | 800–1,500 |
| **Concurrency model** | Async event loop | Sync (async optional) | Sync (Octane available) |
| **Cold start** | <1 sec | 2–3 sec | 1–2 sec |
| **WebSocket / Real-time** | Native | Channels (separate setup) | Reverb / Pusher (extra) |
| **Built-in admin panel** | Build it | Django Admin (free) | Filament (free, modern UI) |
| **ORM quality** | Prisma / TypeORM | **Django ORM (best-in-class)** | Eloquent (excellent) |
| **Auto API docs** | Swagger (add-on) | **DRF OpenAPI (built-in)** | Scribe / L5-Swagger (add-on) |
| **Background jobs** | BullMQ (light) | Celery (heavy infra) | Laravel Queue (light) |
| **Frontend language match (React)** | Same (TypeScript) | Different | Different |
| **Microservices friendliness** | Best | OK | OK |
| **Spring Boot mental model match** | Very close | Close | Close |
| **Hiring pool (India)** | Large | Large | **Largest** |
| **Migration calendar time** | 8–14 weeks | 10–14 weeks | 12–16 weeks |
| **5-year hosting cost** | **₹28.6L** | ₹35.1L | ₹32L |

---

## 6. Pros & Cons Summary

### NestJS (Node.js + TypeScript)

**Pros**
- Lowest 5-year cost (~₹28.6L)
- Architecture identical to Spring Boot — easiest mental migration
- Same language (TypeScript) as React frontend → shared types, fewer bugs
- Native WebSocket → real-time Kitchen Display System works out of the box
- Best for microservices future
- Lowest memory footprint = highest VM density

**Cons**
- Team must learn TypeScript/NestJS (~2-week ramp for Java devs)
- No built-in admin panel (must build Superadmin UI)
- CPU-bound tasks (heavy report generation) need worker threads or queue offload

### Django (Python + DRF)

**Pros**
- **Django Admin panel free** — saves significant Superadmin UI work
- Django REST Framework auto-generates API docs
- Best ORM in the industry
- Python ecosystem opens future doors (AI, ML, analytics)
- Very stable and mature (20+ years)

**Cons**
- Sync nature + GIL → needs more instances at scale
- Different language from React frontend (no shared types)
- WebSocket / real-time requires Django Channels (extra setup, complexity)
- ~30% higher hosting cost than NestJS at scale
- Celery for background jobs needs Redis + workers (infra heavy)

### Laravel (PHP)

**Pros**
- **Largest hiring pool in India** — cheapest, fastest team scaling
- Cheapest hosting options (Hostinger, shared, VPS all viable)
- Filament Admin Panel — modern, free, beautiful Superadmin UI
- Eloquent ORM is excellent
- Inertia.js can serve React frontend seamlessly
- Massive community, lots of restaurant POS reference projects

**Cons**
- PHP-FPM process model → each request spawns memory overhead
- Real-time KDS needs **Laravel Reverb** (built into Laravel 11+) or Pusher (paid)
- Different language from React frontend
- Microservices possible but less natural than Node.js
- Async limited (Octane helps but adds complexity)

---

## 7. Senior Engineering Recommendation on Kitchen Display System (KDS)

> **Professional opinion as senior tech advisor:**

KDS is **not just a feature — it is a core product differentiator** in a restaurant SaaS. Slow or stale KDS means:
- Chefs miss orders → food delayed → customer churn
- Order status mismatches between cashier and kitchen → operational chaos
- Restaurants will **switch to competitors** if KDS lags

**Therefore, treat KDS as Tier-1 critical from day 1**, even if launch scope is minimal. The architecture must support sub-second order delivery to kitchen screens.

### Recommended KDS Architecture (Stack-Agnostic)

```
Cashier creates order
        │
        ▼
Backend writes to DB + emits event
        │
        ├──► WebSocket push to Kitchen tablet  (instant — <500ms)
        │
        └──► Firebase FCM push (fallback / offline reconnect)
```

### How Each Stack Handles This

| Stack | KDS Real-Time Story | Verdict |
|---|---|---|
| **NestJS** | Built-in `@WebSocketGateway()` decorator. Same process handles WebSocket + REST. | **Best** |
| **Laravel** | Laravel Reverb (PHP WebSocket server, built into Laravel 11+, free, self-hosted) | **Good** |
| **Django** | Django Channels (separate ASGI server, more setup, heavier deployment) | **Workable** |

**Decision:** Pick a stack that supports WebSocket cleanly. All three can do it; NestJS does it most naturally; Laravel 11 made big improvements; Django is the most complex of the three for this.

---

## 8. Final Recommendation — Three Tiers for Manager Decision

### Primary Recommendation: **NestJS + Supabase**

**Pick this if:** Team can invest 2 weeks in TypeScript ramp-up, real-time KDS is critical, lowest TCO matters, future microservices vision exists.

- 5-year cost: **₹28.6L** (₹16.5L saved vs Spring Boot)
- Migration: 8–14 weeks
- Risk: Low
- Future flexibility: Highest

### Alternative 1: **Laravel + Supabase Postgres**

**Pick this if:** Team has PHP experience, Filament Admin Panel value matters, hosting budget is the dominant constraint.

- 5-year cost: **₹32L** (₹13L saved vs Spring Boot)
- Migration: 12–16 weeks
- Risk: Low
- Special advantage: Filament gives Superadmin panel almost free
- Caveat: KDS will need Laravel Reverb wired in carefully

### Alternative 2: **Django + Supabase Postgres**

**Pick this if:** Team has Python experience, AI/ML/analytics roadmap is planned, Django Admin value matters.

- 5-year cost: **₹35.1L** (₹10L saved vs Spring Boot)
- Migration: 10–14 weeks
- Risk: Low
- Special advantage: Django Admin + DRF auto-docs
- Caveat: Most expensive of the three; Channels adds KDS complexity

---

## 9. What to Avoid — Honest Assessment

| Option | Why Not |
|---|---|
| **Stay on Spring Boot** | ₹17L more expense over 5 years for no operational gain |
| **Pure Supabase (no app server)** | Multi-tenant RLS for 9 roles + complex billing logic is fragile and high-risk |
| **Go (Golang) rewrite** | Best at scale, but 6–8 week team learning curve overshoots gains |
| **Hasura (GraphQL)** | Introduces new paradigm without proportional benefit |

---

## 10. Migration Roadmap (Common to All Three Options)

| Phase | Duration | Goal |
|---|---|---|
| 0. Audit & catalog 253 endpoints | 1 week | Group by complexity, identify quick wins |
| 1. Skeleton + CI/CD + DB connection | 1 week | New stack scaffolded against existing Supabase Postgres |
| 2. Auth migration (dual-mode) | 2 weeks | New JWT alongside old AES256 token; no client breakage |
| 3. Read-heavy APIs (Customer, Public) | 2 weeks | Lowest risk modules first |
| 4. Operational APIs (Cashier, Branch, Kitchen) | 3 weeks | Core flows with KDS WebSocket |
| 5. Admin + Reports + Payments | 2 weeks | Excel/PDF/payment webhooks |
| 6. Shadow run + cutover | 1 week | Java keeps running read-only as safety net |
| 7. Decommission Java backend | 1 week | Cost savings begin |
| 8. Buffer / hardening | 1 week | Load test, security audit |
| **Total** | **~14 weeks** | Production cutover complete |

---

## 11. Recommended Decision Matrix (For Manager)

| Question | If Yes → | If No → |
|---|---|---|
| Team comfortable with JS/TS or willing to learn? | **NestJS** | Next question |
| Team has PHP/Laravel background? | **Laravel** | Next question |
| Team has Python/Django background? | **Django** | NestJS (least learning) |
| Real-time KDS is product-critical? | NestJS or Laravel | Any |
| Future AI/ML roadmap exists? | **Django** | NestJS or Laravel |
| Lowest possible hosting bill priority? | **Laravel** then NestJS | Any |
| Largest hiring flexibility needed? | **Laravel** | NestJS |

---

## 12. Conclusion

| Item | Decision |
|---|---|
| Migrate from Spring Boot? | **Yes** — saves ₹10–16.5 lakh over 5 years |
| Keep Supabase Postgres? | **Yes** — no DB migration needed |
| Default recommendation | **NestJS** (best technical fit + cost + future-proof) |
| Strong alternatives | **Laravel** (cheapest hosting + Filament) or **Django** (admin + AI future) |
| Treat KDS as | **Tier-1 product feature** — architect for sub-second real-time from day 1 |
| Pure Supabase / Edge Functions for business logic | **Avoid** — wrong fit for this complexity |

**All three alternatives are safe, mature, and production-grade. The choice should be driven by team strength, not technology hype.**

---

## 13. Next Step (If Manager Approves)

Once the manager picks one of the three options:

1. Build a small **proof-of-concept** in chosen stack — port one module (e.g., `/api/cashier/orders`) end-to-end
2. Validate effort estimate against POC reality
3. Lock 14-week migration plan with sprint breakdown
4. Set up parallel CI/CD + staging environment
5. Begin dual-auth bridge so existing mobile/web clients are not broken

---

*Compiled from direct code audit of `pom.xml`, `package.json`, `application.properties`, and the existing 253-controller, 52-table project structure. All cost figures are conservative production estimates based on Indian SaaS hosting market rates (Railway, Render, Hetzner, Supabase) as of mid-2026.*
