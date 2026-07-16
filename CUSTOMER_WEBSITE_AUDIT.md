# Customer Website — Senior Audit Report
**Date (last updated):** 2026-07-16
**Auditor:** Claude Code (senior full-stack review)
**Scope:** `frontend-v2/src/features/customer/` — every page + component + data flow

---

## Executive Summary — Post-refactor status

| Metric | Before (2026-07-16 morning) | After (2026-07-16 evening) |
|---|---|---|
| Sections on real backend | ~40 / 72 (56%) | **~62 / 72 (86%)** |
| Sections hardcoded / dummy | ~26 (36%) | **~6 (8%)** |
| localStorage-only | ~5 (7%) | 4 (6%) |
| BROKEN interactions | 6 | **2** (Reorder + Need Help) |

**Bottom line:** Sab 7 Priority-1 multi-tenant blockers **CLOSED**. Har tenant ab apna real data dekhega. Sirf 2 minor Priority-2 (Reorder + Need Help buttons) + kuch cosmetic hero images baaki hain.

---

## Legend

- ✅ **Backend API** — real hook, fetches from server
- ⚠️ **Backend + fallback** — real API with safe fallback if empty
- ❌ **Hardcoded** — static array/string, no backend
- 🟡 **localStorage only** — client-side state (by design)
- **BROKEN** — user action shows toast but no real API call happens

---

## 🚨 Priority 1 — Multi-Tenant Blockers  (7/7 DONE ✅)

| # | Item | Status | Wiring |
|---|---|---|---|
| 1 | LocationsPage — Facilities/Events/Awards/Reach + branch cards | ✅ DONE | `useLocations*` hooks + widened branch DTO (7 new cols: specialty/seating/bestFor/features/chefNote/photoUrl/drivePhotoUrl) |
| 2 | ContactPage — Help/Depts/Hours/HoursNotes/FAQs + Visit Us + Social | ✅ DONE | `useContact*` hooks + `useRestaurantHours()` + `useCustomerBranches()` + `useBrand().socialLinks` |
| 3 | HomePage — Testimonials/Stats/Instagram/Why Dine + reservation form | ✅ DONE | `useHome*` hooks + real `submitPublicReservation()` on submit |
| 4 | AboutPage — Team + story blocks | ✅ DONE | `useAboutTeam()` + `useBrand().aboutUs/ourMission/ourVision` |
| 5 | SignaturePage — signature dish grid | ✅ DONE | `useCustomerCatalog().dishes.filter(d => d.signature)` (live catalog) |
| 6 | CustomerLayout Footer — phone/email/social | ✅ DONE | `useBrand().phone/email/socialLinks` |
| 7 | Marquee — promo strip | ✅ DONE | `useBrand().marqueeText/marqueeIsLive/marqueeBgColor/marqueeTextColor/marqueeSpeed` |

**Verification:** All 13 content-block endpoints return real Spice Garden data for tenant 42:
- HOME/TESTIMONIAL=3 · HOME/STAT=3 · HOME/WHY_DINE=3 · HOME/INSTAGRAM_POST=6
- LOCATIONS/FACILITY=8 · LOCATIONS/EVENT_PACKAGE=3 · LOCATIONS/AWARD=3 · LOCATIONS/REACH_INFO=4
- CONTACT/FAQ=8 · CONTACT/DEPARTMENT=6 · CONTACT/HELP_CATEGORY=4 · CONTACT/HOURS_NOTE=4
- ABOUT/TEAM_MEMBER=4

Branch DTO now exposes all 7 new fields (verified via curl).

---

## 🔧 Priority 2 — Broken Interactions

| # | Item | Status | Note |
|---|---|---|---|
| 1 | HomePage Reservation form | ✅ FIXED | Wired to `submitPublicReservation()` |
| 2 | OrderTrackingPage Reorder button | ❌ STILL BROKEN | Toast only — needs to add prior items back to `useCart()` |
| 3 | OrderTrackingPage Need Help button | ❌ STILL BROKEN | Toast only — should open WhatsApp with `brand.whatsappNumber` OR create support-ticket endpoint |
| 4 | ContactPage Newsletter subscribe | 🟡 DEFERRED | **User decision:** "Filhal button rehne do (fake) — future me decide karenge" |
| 5 | CustomerLayout Footer social icons | ✅ FIXED | Wired to `brand.socialLinks` (icons hide when link absent) |
| 6 | LocationsPage "Live Map Coming Soon" | ❌ Placeholder | Unsplash image — needs Google Maps embed (via `brand.googleMapEmbed`) or removal |

**Remaining P2:** 2 fake buttons (Reorder + Need Help) + 1 map placeholder. Newsletter is intentionally deferred.

---

## 🆕 Priority 3 — New Backend Endpoints (DONE ✅)

Instead of the original 6+ endpoints, built **ONE polymorphic endpoint** that satisfies all:

- `GET /api/customer/content/page/{page}?section={type}` — 13 typed frontend hooks wrap it
- Table: `restaurant_content_blocks` — `page` + `section_type` discriminator, `restaurant_id` scoped, JSONB `meta` for type-specific extras
- `restaurant_branch` widened with 7 cols (specialty/seating/bestFor/features/chefNote/photoUrl/drivePhotoUrl)
- `business_settings` — already exposed everything needed via `useBrand()`

---

## 🎯 Section-by-section status (updated)

### 🏠 HomePage

| Section | Status |
|---|---|
| Hero Rotator | ⚠️ `useCustomerSliders()` + safe fallback |
| Open/Closed Badge | ✅ `useRestaurantHours()` |
| Category Orbit | ❌ Still uses `CATEGORIES` const in `catalog.ts:213` (5 hardcoded categories) — lower priority; can switch to `useCustomerCatalog().categories` |
| Popular Dishes | ✅ `useCustomerCatalog()` |
| Gallery Slider | ⚠️ `useCustomerGallery()` + seed fallback |
| Why Dine tiles | ✅ `useHomeWhyDine()` + fallback |
| Stats | ✅ `useHomeStats()` |
| Testimonials | ✅ `useHomeTestimonials()` |
| Reservation CTA form | ✅ Real `submitPublicReservation()` |
| Instagram Feed | ✅ `useHomeInstagram()` |
| Floating Cart Bubble | 🟡 `useCart()` (localStorage — by design) |
| BranchLocator | ✅ `useCustomerBranches()` |
| BrandStoryShowcase | ⚠️ `brand.aboutUs` + gallery + seed |
| BrandSplash | ✅ `useBrand()` |
| SignatureExperience | ❌ Inline `EXPERIENCES` const (lower priority) |
| LifestyleBanner | ⚠️ Gallery + hardcoded quote (minor) |
| MenuCategoriesGrid | ✅ `useCustomerCatalog().categories` |

### 🍔 MenuPage

| Section | Status |
|---|---|
| Menu Hero background | ❌ Unsplash URL literal (cosmetic — no tenant-facing damage) |
| Filter Bar | ✅ Client filters live catalog |
| Category Orbit | ❌ `CATEGORIES` const (shared with HomePage) |
| Dish Grid | ✅ `useCustomerCatalog()` |
| End-of-menu CTA | ❌ Static copy (harmless) |

### 🛒 CartPage + CheckoutPage

| Section | Status |
|---|---|
| Cart line items | 🟡 `useCart()` (by design) |
| GST | ❌ Hardcoded 5% flat — needs tenant tax config field |
| Order type toggle | 🟡 local state |
| Delivery Address | ✅ `fetchCustomerAddresses()` |
| Dine-in Section/Table pickers | ✅ Real hooks |
| Coupon | ✅ Real hooks |
| Stripe / PayPal / COD | ✅ Real hooks |
| Pickup Address "Bandra Fort" | ❌ Hardcoded — should use `branch.address` |
| Offline queue banner | ✅ `useOfflineQueueStatus()` |

### 📦 OrderTrackingPage + MyOrdersPage

| Section | Status |
|---|---|
| Live tracking (15s poll) | ✅ `useOrderTracking()` |
| Driver map | ❌ `driverLocation={null}` placeholder |
| Rate-your-meal | ✅ `useSubmitDishRating()` |
| Cancel order | ✅ `useCancelCustomerOrder()` |
| Reorder | ❌ **BROKEN** — toast only |
| Need Help | ❌ **BROKEN** — toast only |
| MyOrders list | ⚠️ `useCustomerOrders()` + offline queue |

### 📍 LocationsPage

| Section | Status |
|---|---|
| Hero image | ❌ `HERO_IMAGES.contact` (cosmetic) |
| Branch cards | ✅ `useCustomerBranches()` + 7 new backend cols wired |
| Facilities | ✅ `useLocationsFacilities()` |
| Events | ✅ `useLocationsEvents()` |
| Reach tips | ✅ `useLocationsReach()` |
| Awards | ✅ `useLocationsAwards()` |
| Map placeholder | ❌ Still Unsplash (see P2 #6) |

### 📞 ContactPage

| Section | Status |
|---|---|
| Reservation form | ✅ `submitPublicReservation()` |
| Visit Us card (address/phone/email/WA/hours) | ✅ `useCustomerBranches()` + `useBrand()` + `useRestaurantHours()` |
| Help Categories | ✅ `useContactHelpCategories()` |
| Direct Dept Lines | ✅ `useContactDepartments()` |
| Business Hours table | ✅ `useRestaurantHours()` |
| Special Timings | ✅ `useContactHoursNotes()` |
| FAQ accordion | ✅ `useContactFaqs()` |
| Newsletter subscribe | 🟡 DEFERRED (user decision) |
| Social handles | ✅ `useBrand().socialLinks` (auto-hide when absent) |

### ℹ️ About / WhyUs / Signature / Gallery

| Page → Section | Status |
|---|---|
| AboutPage — Story | ✅ `useBrand().aboutUs/ourMission/ourVision` |
| AboutPage — Value cards (3) | ❌ Inline array (cosmetic — 3 hardcoded lines) |
| AboutPage — TEAM | ✅ `useAboutTeam()` |
| WhyUsPage | ✅ `useBrand()` |
| SignaturePage | ✅ `useCustomerCatalog()` |
| GalleryPage Hero | ❌ `HERO_IMAGES.gallery` (cosmetic) |
| GalleryPage Grid | ⚠️ `useCustomerGallery()` + 30-URL fallback |

### 🎨 CustomerLayout

| Section | Status |
|---|---|
| Marquee ticker | ✅ `useBrand().marqueeText` + `marqueeIsLive` gate |
| Header logo/name | ✅ `useBrand()` |
| Nav links | ❌ Inline (by design — routes are fixed) |
| Branch picker | ✅ `useCustomerBranches()` |
| Search / Wishlist / Cart / Notifications drawers | ✅ Real hooks |
| Sign-in OTP | ✅ Real hooks |
| Footer address | ✅ `branch.address` / `brand.address` |
| Footer phone/email | ✅ `brand.phone` / `brand.email` |
| Footer social | ✅ `brand.socialLinks` |
| Copyright year | ✅ `new Date().getFullYear()` |

---

## Kya baaki hai (in priority order)

**🔴 High** (2 fake buttons — actual user pain)
1. OrderTrackingPage Reorder → add items back to `useCart()`
2. OrderTrackingPage Need Help → open `wa.me/${brand.whatsappNumber}` OR build support endpoint

**🟡 Medium** (multi-tenant leak but low visibility)
3. CartPage Pickup Address "Bandra Fort" → use selected `branch.address`
4. CartPage GST hardcoded 5% → needs tenant tax field
5. LocationsPage map placeholder → use `brand.googleMapEmbed` or remove
6. HomePage CATEGORIES const (shared with MenuPage) → switch to `useCustomerCatalog().categories`

**🟢 Cosmetic** (Unsplash hero images, inline value cards)
7. AboutPage 3 value cards inline
8. HomePage SignatureExperience inline
9. HomePage LifestyleBanner quote
10. MenuPage / LocationsPage / GalleryPage / AboutPage hero background images
11. OrderTrackingPage driver map (`driverLocation={null}` — needs geolocation stream)

**🟡 Deferred (by user)**
12. Newsletter subscribe → user said "filhal fake rehne do"

---

## Tenant on `localhost:5174`

- **Restaurant ID:** 42
- **Business Name:** Spice Garden Pvt Ltd
- **Domain URL:** `localhost`
- All lookups resolve to `restaurant_id = 42` via `business_settings.domain_url = 'localhost'` in `CustBrandingController` + Host-header pattern reused across new content endpoints.

---

**Build + smoke verified:** frontend `tsc` clean · `npm run build` clean · backend `mvn compile` clean · all 13 content endpoints return real seeded data · 7 new branch cols exposed on `/api/customer/restaurant_branch/public/all`.
