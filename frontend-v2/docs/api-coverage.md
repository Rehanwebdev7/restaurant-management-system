# API Endpoint Coverage Dashboard (UI-F-3, UI-F-45)

> **Purpose:** Every one of the 315 backend endpoints called by old `frontend/` must be covered by new `frontend-v2/` OR explicitly marked unused. **Cutover blocked** until 100% covered.

## Status Legend

- 🔲 NOT_STARTED — not yet ported
- 🔄 IN_PROGRESS — being ported in current panel
- ✅ DONE — TanStack Query hook exists + smoke tested
- 🚫 UNUSED — old caller removed; endpoint not needed in new UI

## Response Shape Map (UI-F-45)

The Spring Boot backend returns inconsistent response nesting. Per-endpoint shape required for `unwrap()`:

| Shape Variant | Example Path | Notes |
|---|---|---|
| `data` | response body IS the payload | rare |
| `data.records` | `{ data: { records: [...] } }` | common — most list endpoints |
| `data.data` | `{ data: { data: {...} } }` | some entity-fetch endpoints |
| `data.data.records` | `{ data: { data: { records: [...] } } }` | wrapped list — common |

Each row below documents the exact shape variant.

## Per-Prefix Coverage

### /login/

| Endpoint | Method | Shape | Status | Old caller(s) | New caller (TanStack hook) | Notes |
|---|---|---|---|---|---|---|
| `/login/panelLogin` | POST | TBD on success | 🔲 | `AuthServices.login()` | `useLoginMutation` | Smoke 2026-06-23: returns 400 with `{Status:"FAILURE", StatusCode:400, message:"Mobile and password are required", data:null}` on missing creds. Confirmed envelope shape. |
| TBD — full inventory in Phase 0 | | | 🔲 | | | |

### Smoke Test Findings (2026-06-23)

Live backend confirmed envelope shape: **`{ Status, StatusCode, message, data }`**.

Observed `Status` values:
- `"SUCCESS"` on success
- `"FAILURE"` on validation failure (HTTP 400)
- `"Internal Server Error"` on HTTP 500

Auth header confirmed: backend rejects missing `access_token` with HTTP 500 + message `"Required request header 'access_token' for method parameter type String is not present"`. **Conclusion:** old apiClient pattern (custom `access_token` header) is mandatory; preserved 1:1 in `src/api/client.ts`.

**Action item:** smoke a public endpoint (no auth required) to capture SUCCESS-shape JSON and lock the first ShapeVariant. Candidate: `/login/panelLogin` with valid credentials in a separate test pass.

### /api/admin/

| Endpoint | Method | Shape | Status | Old caller(s) | New caller | Notes |
|---|---|---|---|---|---|---|
| TBD — Phase 0 inventory | | | 🔲 | | | |

### /api/branch/

| Endpoint | Method | Shape | Status | Old caller(s) | New caller | Notes |
|---|---|---|---|---|---|---|
| TBD — Phase 0 inventory | | | 🔲 | | | |

### /api/cashier/

| Endpoint | Method | Shape | Status | Old caller(s) | New caller | Notes |
|---|---|---|---|---|---|---|
| `/api/cashier/orders/history` | GET | `data.data.records` | 🔲 | `cashier/operations/Orders.jsx` | `useCashierOrdersQuery` | Pagination, status filter |
| TBD — full Phase 0 inventory | | | 🔲 | | | |

### /api/customer/

| Endpoint | Method | Shape | Status | Old caller(s) | New caller | Notes |
|---|---|---|---|---|---|---|
| TBD — Phase 0 inventory | | | 🔲 | | | |

### /api/delivery/

| Endpoint | Method | Shape | Status | Old caller(s) | New caller | Notes |
|---|---|---|---|---|---|---|
| TBD — Phase 0 inventory | | | 🔲 | | | |

### /api/kitchen/

| Endpoint | Method | Shape | Status | Old caller(s) | New caller | Notes |
|---|---|---|---|---|---|---|
| `/api/kitchen/notifications` | GET | TBD | 🔲 | `contexts/NotificationContext.js` (15s poll) | `useKitchenNotificationsQuery({ refetchInterval: 15000 })` | UI-F-10 audio alert hook |
| TBD — full Phase 0 inventory | | | 🔲 | | | |

### /api/restaurant/

(Largest prefix — 80+ endpoints across users, menu, orders, payment_gateway, customers, etc.)

| Endpoint | Method | Shape | Status | Old caller(s) | New caller | Notes |
|---|---|---|---|---|---|---|
| TBD — Phase 0 inventory | | | 🔲 | | | |

---

## Overall Coverage

- **Total endpoints:** 315 (estimated, to be confirmed in Phase 0)
- **Documented shape variants:** 0
- **Ported (✅):** 0
- **In progress (🔄):** 0
- **Deferred unused (🚫):** 0
- **Percent covered:** 0%

**Cutover gate:** 100% coverage required.

## Newman Collection

Postman/Newman collection at `tests/newman-collection.json` — auto-generated from OpenAPI (Phase 0 deliverable).

## Synthetic Uptime (UI-F-41)

20 critical endpoints monitored via Uptime Robot:
1. `POST /login/panelLogin`
2. `GET /api/customer/menu`
3. `POST /api/customer/orders/create`
4. (TBD remaining 17)
