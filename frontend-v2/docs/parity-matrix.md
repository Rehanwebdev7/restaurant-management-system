# Parity Matrix (UI-F-3) — Code Loss Prevention

> **Purpose:** Every page in old `frontend/src/pages/` must map to a page in `frontend-v2/src/features/` OR be explicitly marked deleted. **No panel sign-off** until 100% of its rows are ✅ DONE or 🚫 DELETED with reason.

## Status Legend

- 🔲 NOT_STARTED — port not yet begun
- 🔄 IN_PROGRESS — actively being ported
- ✅ DONE — ported + reviewed + smoke tested
- ⏸️ BLOCKED — blocked by backend issue, missing API, or other dependency
- 🚫 DELETED — feature intentionally not ported (reason mandatory)

## Per-Panel Tabs

### Kitchen Panel (4 pages, Phase 4a)

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| `pages/modules/kitchen/dashboard/Dashboard.jsx` | `features/kitchen/dashboard/KitchenDashboard.tsx` | 🔲 | TBD | Active orders count, today stats | — | — |
| `pages/modules/kitchen/display/Display.jsx` | `features/kitchen/display/KitchenDisplay.tsx` | 🔲 | TBD | Real-time order board, status transitions | — | — |
| `pages/modules/kitchen/order-history/OrderHistory.jsx` | `features/kitchen/order-history/OrderHistory.tsx` | 🔲 | TBD | Filter + paginate past orders | — | — |
| `pages/modules/kitchen/reports/Reports.jsx` | `features/kitchen/reports/KitchenReports.tsx` | 🔲 | TBD | Date range + export | — | — |

### Delivery Panel (6 pages, Phase 4b)

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| `pages/modules/delivery/dashboard/Dashboard.jsx` | `features/delivery/dashboard/DeliveryDashboard.tsx` | 🔲 | TBD | — | — | — |
| `pages/modules/delivery/active-orders/ActiveOrders.jsx` | `features/delivery/active-orders/ActiveOrders.tsx` | 🔲 | TBD | Live tracking map (UI-F-94) | — | — |
| `pages/modules/delivery/wallet/Wallet.jsx` | `features/delivery/wallet/Wallet.tsx` | 🔲 | TBD | Balance + transactions | — | — |
| `pages/modules/delivery/bank-accounts/BankAccounts.jsx` | `features/delivery/bank-accounts/BankAccounts.tsx` | 🔲 | TBD | CRUD + verification | — | — |
| `pages/modules/delivery/order-history/OrderHistory.jsx` | `features/delivery/order-history/OrderHistory.tsx` | 🔲 | TBD | — | — | — |
| `pages/modules/delivery/withdrawal-request/WithdrawalRequest.jsx` | `features/delivery/withdrawal-request/WithdrawalRequest.tsx` | 🔲 | TBD | Money form (Zod schema) | — | — |

### Cashier Panel (19 pages, Phase 4c)

> Per Phase 4c (UI-F-1 + UI-F-65 + UI-F-85): payment flows + POS hardware + offline order queue all integrated here.

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| TBD — populate after Phase 0 inventory scan | | 🔲 | | | | |

### Superadmin Panel (11 pages, Phase 4e)

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| TBD — populate after Phase 0 inventory scan | | 🔲 | | | | |

### Admin Panel (78 pages, Phase 4f)

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| TBD — populate after Phase 0 inventory scan | | 🔲 | | | | |

### Branch Manager Panel (39 pages, Phase 4d)

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| TBD — populate after Phase 0 inventory scan | | 🔲 | | | | |

### Restaurant Owner Panel (84 pages, Phase 4g)

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| TBD — populate after Phase 0 inventory scan | | 🔲 | | | | |

### Customer Site (12 pages, Phase 5)

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| `pages/modules/Customer/HomePage.jsx` (5819 LOC) | `features/customer/home/*` (decomposed: HeroSection, MenuShowcase, CategoryGrid, CartDrawer, CheckoutFlow) | 🔲 | TBD | Browse + Cart + Checkout (revenue-critical) | — | — |
| `pages/modules/Customer/Cart.jsx` | `features/customer/cart/Cart.tsx` | 🔲 | TBD | — | — | — |
| `pages/modules/Customer/Checkout.jsx` | `features/customer/checkout/Checkout.tsx` | 🔲 | TBD | Payment (UI-F-1) | — | — |
| TBD — remaining 9 customer pages | | 🔲 | | | | |

### Auth Pages (9 pages, Phase 3)

| Old Path | New Path | Status | Endpoints | Critical Flows | Reviewer | Date |
|---|---|---|---|---|---|---|
| TBD — populate after Phase 0 inventory scan | | 🔲 | | | | |

---

## Overall Progress

- **Total pages:** 263 (to be inventoried in Phase 0)
- **Completed:** 0
- **In progress:** 0
- **Blocked:** 0
- **Deleted (with reason):** 0
- **Percent complete:** 0%

**Phase 0 sub-task:** populate every row above by walking `frontend/src/pages/` tree.
