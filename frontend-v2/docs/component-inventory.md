# Component Inventory (UI-F-3)

> **Purpose:** Every reusable component, context, hook, util in old `frontend/src/` must map to `frontend-v2/src/` OR be explicitly marked deleted with reason. Tracks code-loss prevention beyond pages.

## Status Legend

- 🔲 NOT_STARTED
- 🔄 IN_PROGRESS
- ✅ DONE
- 🚫 DELETED (with reason)

## Shared Components (`frontend/src/components/`)

| Old File | New File | Status | Reason / Notes |
|---|---|---|---|
| `components/Header.js` (965 LOC monolith) | `components/layout/TopBar.tsx` + `topbarConfig.ts` | 🔲 | Decomposed: role-specific slot config |
| `components/Footer.jsx` | `components/layout/Footer.tsx` | 🔲 | |
| `components/AdminSidebar.js` (437 LOC) | `components/layout/Sidebar.tsx` + `sidebarConfig.admin.ts` | 🔲 | Config-driven |
| `components/RestaurantSidebar.js` | `sidebarConfig.restaurant.ts` (config only) | 🔲 | |
| `components/BranchSidebar.js` | `sidebarConfig.branch.ts` | 🔲 | |
| `components/CashierSidebar.js` | `sidebarConfig.cashier.ts` | 🔲 | |
| `components/KitchenSidebar.js` | `sidebarConfig.kitchen.ts` | 🔲 | |
| `components/DeliverySidebar.js` | `sidebarConfig.delivery.ts` | 🔲 | |
| `components/SuperAdminSidebar.js` | `sidebarConfig.superadmin.ts` | 🔲 | |
| `components/Sidebar.js` | merged into `<Sidebar>` primitive | 🔲 | |
| `components/AuthLayout.jsx` | `components/layout/AuthLayout.tsx` | 🔲 | |
| `components/PublicRoute.jsx` | `lib/router/PublicRoute.tsx` | 🔲 | |
| `components/common/TableSkeletonLoader.jsx` + .css | 🚫 DELETED | 🔲 | Replaced by `<DataTable.Skeleton>` per UI-F-39 |
| `components/common/ImageCropperModal.jsx` | `components/ui/image-cropper.tsx` (UI-F-4) | 🔲 | Wraps `react-easy-crop` |
| `components/common/LocationPickerMap.jsx` | `components/ui/map-picker.tsx` (UI-F-5) | 🔲 | `@react-google-maps/api` |
| `components/common/OTPVerification.jsx` | `components/ui/otp-input.tsx` | 🔲 | Used by signup + login |
| `components/common/OrderAlertOverlay.jsx` | `components/ui/order-alert-toast.tsx` (UI-F-10) | 🔲 | sonner + audio unlock |
| `components/modals/UserFormModal.jsx` | inline form via `<Dialog>` + `<Form>` | 🔲 | Generic via primitives |
| `components/modals/FOSFormModal.jsx` | inline form | 🔲 | |
| `components/modals/OrderFormModal.jsx` | inline form | 🔲 | |
| `components/modals/ChangePasswordModal.jsx` | reusable `<ChangePasswordDialog>` | 🔲 | |
| `components/modals/CollectPaymentModal.jsx` | reusable `<CollectPaymentDialog>` (UI-F-1) | 🔲 | Payment flow |
| `components/payment/StripeButton.jsx` | `components/ui/stripe-payment-element.tsx` (UI-F-1) | 🔲 | Use Stripe Elements |
| `components/payment/PayPalButton.jsx` | `components/ui/paypal-checkout-button.tsx` (UI-F-1) | 🔲 | |

## Contexts (`frontend/src/contexts/`)

| Old File | New File | Status | Reason / Notes |
|---|---|---|---|
| `contexts/AuthContext.js` | `lib/auth/useAuth.ts` + Zustand store | 🔲 | Plus multi-tab sync (UI-F-19) + impersonation banner (UI-F-20) |
| `contexts/ThemeContext.js` | `components/providers/BrandProvider.tsx` | 🔲 | Restaurant primary color from API |
| `contexts/DarkModeContext.js` | `components/providers/ThemeProvider.tsx` (next-themes) | 🔲 | |
| `contexts/NotificationContext.js` | `api/queries/notifications.ts` (TanStack refetchInterval) | 🔲 | 15s poll → useQuery |
| `contexts/OrderAlertContext.js` | `api/queries/order-alerts.ts` + `<OrderAlertToast>` | 🔲 | UI-F-10 audio unlock |
| `contexts/SignupContext.js` | `features/auth/signup/useSignupStore.ts` (Zustand) | 🔲 | Wizard state per UI-F-8 |
| `contexts/AuthGuard.jsx` | `lib/router/AuthGuard.tsx` | 🔲 | |

## Services (`frontend/src/services/`, `frontend/src/ApiServices/`)

| Old File | New File | Status | Reason / Notes |
|---|---|---|---|
| `api/apiClient.js` | `api/client.ts` | 🔲 | 1:1 TS port; preserve dual-token + access_token header |
| `ApiServices/ApiServices.js` | `api/services/*.ts` per domain | 🔲 | Decompose into per-domain services |
| `ApiServices/CustomerApiServices.js` | `api/services/customer.ts` | 🔲 | |
| `services/AuthServices.js` | `api/services/auth.ts` + `lib/auth/tokens.ts` | 🔲 | |
| `services/themeService.js` | `lib/theme/brand-css-vars.ts` | 🔲 | |

## Hooks (`frontend/src/hooks/`)

> Old codebase has NO `src/hooks/` directory — every component re-implements fetch logic. This is a known gap that the rewrite resolves via TanStack Query.

## Utils (`frontend/src/utils/`)

| Old File | New File | Status | Reason / Notes |
|---|---|---|---|
| `utils/constants.js` | `config/env.ts` (typed + Zod validated) | 🔲 | UI-F-74 |
| `utils/toast.js` | `lib/toast.ts` (sonner wrapper, same API shape) | 🔲 | |

## Mock Server (`frontend/src/mocks/`)

| Old File | New File | Status | Reason / Notes |
|---|---|---|---|
| `mocks/mockServer.js` | `api/mocks/server.ts` (optional MSW migration) | 🔲 | Decision deferred |

---

## Coverage Summary

- **Components to port:** ~24
- **Contexts to port:** 7 (mostly transformed, not 1:1)
- **API services to port:** 3 files (deeply structured)
- **Hooks to port:** 0 (none existed; many new ones built fresh)
- **Utils to port:** ~5

**Status:** 0% — Phase 0 inventory expansion needed.
