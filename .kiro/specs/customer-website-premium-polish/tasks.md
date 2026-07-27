# Implementation Plan: Customer Website Premium Polish

## Overview

Practical visual polish for customer-facing pages. Each task is one focused change — no tests, just ship it. All modifications go into three existing files: `themeService.js`, `HomePage.jsx`, and `HomePage.grilli.css`.

## Tasks

- [ ] 1. Add ensureContrast helper and integrate in themeService.js
  - [ ] 1.1 Add `getContrastRatio()` and `ensureContrast()` functions to `frontend/src/services/themeService.js`
    - Add `getContrastRatio(hex1, hex2)` using existing `getLuminance()` and `normalizeHex()`
    - Add `ensureContrast(foreground, background, minRatio = 4.5)` that darkens in 8% steps (max 20 iterations)
    - In `applyThemeToCSS`, compute `--theme-primary-accessible` using `ensureContrast(primary, pageBg, 4.5)` and set it on root
    - Preserve original `--theme-primary` unchanged for decorative use
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 2. Hero section CSS fix
  - [ ] 2.1 Add stronger overlay gradient and solid CTA button styles to `HomePage.grilli.css`
    - Set `.grilli-scope .hero-bg-overlay` background to `linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)`
    - Style `.grilli-scope .btn-explore-menu` with solid `var(--grilli-gold, var(--theme-primary))` background, `var(--grilli-text-inverse, #ffffff)` text, no border, min 44x44px touch target
    - Add gradient fallback for `.grilli-scope .luxury-hero` using theme primary/secondary
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Card hover effects CSS
  - [ ] 3.1 Add card hover rules wrapped in `@media (hover: hover)` to `HomePage.grilli.css`
    - Target `.grilli-scope .heritage-showcase-card`, `.service-card-lux`, `.our-strength-card`, `.filtered-item-card`
    - On hover: `translateY(-6px)`, elevated box-shadow (`--grilli-shadow-lift`), 3px top border with `--grilli-gold`
    - Image hover: `scale(1.05)` with overflow hidden
    - Icon hover: `scale(1.15)`
    - Transitions: 0.3s ease on transform, box-shadow, border-color
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 4. Overall CSS polish
  - [ ] 4.1 Add shadow tokens, button transitions, and focus indicators to `HomePage.grilli.css`
    - Define `--grilli-shadow-card` and `--grilli-shadow-lift` custom properties at `.grilli-scope` level
    - Add `transition: background-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease` to all `.grilli-scope` buttons
    - Add `:focus-visible` rule with `outline: 2px solid var(--grilli-gold); outline-offset: 2px` for interactive elements
    - Ensure no hardcoded dark-theme hex values (`#0A0908`, `#14110F`, `#1A1613`, `#1F1C18`)
    - All rules scoped under `.grilli-scope`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 5. Scroll-triggered animations
  - [ ] 5.1 Add IntersectionObserver logic in `HomePage.jsx` and animation CSS in `HomePage.grilli.css`
    - Add `useEffect` with IntersectionObserver (threshold 0.15, rootMargin "-50px") targeting `[data-animate]` elements inside `.grilli-scope`
    - On intersection: add `.is-visible` class and unobserve (fire-once)
    - Cleanup observer on unmount
    - Add `data-animate` attributes to key sections in JSX (heritage cards, service cards, strength cards)
    - CSS: `[data-animate]` starts at `opacity: 0; transform: translateY(30px)` with 0.6s transition
    - CSS: `[data-animate].is-visible` goes to `opacity: 1; transform: translateY(0)`
    - Graceful fallback: `noscript` style or `@supports` to show elements when JS is disabled
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 6. Sticky header
  - [ ] 6.1 Add scroll listener in `HomePage.jsx` and sticky header CSS in `HomePage.grilli.css`
    - Add `useEffect` with passive scroll listener checking `window.scrollY > 50`
    - Toggle `.header-scrolled` class on `.grilli-scope .landing-header`
    - Cleanup listener on unmount, run initial check
    - CSS: `.landing-header` gets `position: fixed; top: 0; z-index: 1000; transition: background-color 0.3s ease, padding 0.3s ease, box-shadow 0.3s ease`
    - CSS: `.landing-header.header-scrolled` gets solid dark background, box-shadow, reduced padding
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 7. CTA banner
  - [ ] 7.1 Add CTA banner JSX to `HomePage.jsx` and styles to `HomePage.grilli.css`
    - Render `<section className="grilli-cta-banner">` immediately before the footer in CustomerLanding JSX
    - Heading: "Visit {restaurantName} Today" using theme data
    - Subheading: promotional message
    - Two buttons: primary "Explore Menu" → `/menu`, secondary "Reserve a Table" → `/contact`
    - CSS: gradient background using `var(--theme-primary)` to `var(--theme-secondary)`
    - CSS: primary button solid fill with `--grilli-gold`, secondary button outlined with `--grilli-text-inverse` border
    - Both buttons min-height 44px, border-radius 6px, font-weight 600
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 8. Build verification checkpoint
  - Ensure the application builds without errors, ask the user if questions arise.

## Notes

- No tests — focus is on shipping the visual polish quickly
- All CSS changes are scoped under `.grilli-scope` to prevent leaking into admin/staff pages
- No new files created; all changes go into existing `themeService.js`, `HomePage.jsx`, and `HomePage.grilli.css`
- Tasks 1–4 are independent (can be done in parallel), tasks 5–7 depend on the CSS tokens from task 4
- `ensureContrast()` uses existing `getLuminance()` and `normalizeHex()` already in themeService

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1"] },
    { "id": 1, "tasks": ["5.1", "6.1", "7.1"] }
  ]
}
```
