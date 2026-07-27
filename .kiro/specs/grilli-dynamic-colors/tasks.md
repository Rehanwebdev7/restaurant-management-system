# Implementation Plan: Grilli Dynamic Colors

## Overview

Migrate the Grilli theme token system from hardcoded dark color values to dynamic CSS variable references driven by ThemeService. Remove dark mode state and toggle from all customer pages. The site renders a single light-mode palette controlled entirely by backend brand configuration.

## Tasks

- [x] 1. Update color token values in grilli-tokens.css
  - [x] 1.1 Replace hardcoded dark color values in `:root` with dynamic `var()` references
    - Change `--grilli-surface-void` to `var(--theme-background, #f8fafc)`
    - Change `--grilli-surface-raised` to `#ffffff`
    - Change `--grilli-surface-elev` to `#ffffff`
    - Change `--grilli-surface-line` to `var(--theme-border, rgba(0, 0, 0, 0.08))`
    - Change `--grilli-overlay-hush` to `rgba(255, 255, 255, 0.85)`
    - Change `--grilli-overlay-veil` to `rgba(255, 255, 255, 0.55)`
    - Change `--grilli-gold` to `var(--theme-primary, #667eea)`
    - Change `--grilli-gold-soft` to `var(--theme-primary-light, #99b2ff)`
    - Change `--grilli-gold-deep` to `var(--theme-primary-dark, #4a5fc7)`
    - Change `--grilli-gold-hairline` to `var(--theme-accent-soft, rgba(102, 126, 234, 0.10))`
    - Change `--grilli-gold-glow` to `var(--theme-accent-subtle, rgba(102, 126, 234, 0.06))`
    - Change `--grilli-text-ivory` to `var(--theme-font-color, #1e293b)`
    - Change `--grilli-text-mist` to `color-mix(in srgb, var(--theme-font-color, #1e293b) 60%, transparent)`
    - Change `--grilli-text-shadow` to `color-mix(in srgb, var(--theme-font-color, #1e293b) 35%, transparent)`
    - Change `--grilli-text-inverse` to `var(--primary-color-contrast, #ffffff)`
    - Change `--grilli-shadow-card` and `--grilli-shadow-lift` to light shadow values
    - Change `--grilli-shadow-glow` to `0 0 24px var(--grilli-gold-glow)`
    - Do NOT modify any non-color tokens (typography, spacing, radii, motion, elevation timing)
    - Do NOT add, remove, or rename any CSS selectors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 1.2 Write property test for token cascade identity
    - **Property 4: Token cascade identity**
    - Verify that `--grilli-gold`, `--grilli-surface-void`, and `--grilli-text-ivory` resolve to `--theme-primary`, `--theme-background`, and `--theme-font-color` respectively for any set of Brand_Colors
    - **Validates: Requirements 1.1, 2.1, 3.1**

  - [ ]* 1.3 Write property test for non-color token preservation
    - **Property 5: Non-color token preservation**
    - Verify that all non-color tokens (typography, spacing, radii, motion) retain their original values and that the set of CSS selectors is unchanged
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 2. Update ThemeService to use backgroundColor directly
  - [x] 2.1 Modify `applyThemeToCSS()` in `frontend/src/services/themeService.js`
    - Add condition: when `theme.backgroundColor` is a non-empty string, set `--theme-background` and `--page-bg` directly to that value
    - Preserve existing fallback logic: if backgroundColor is empty/null, compute tinted background from primary color
    - Do NOT change any other variable assignments (`--theme-primary`, `--theme-font-color`, `--theme-primary-light`, `--theme-primary-dark`, etc.)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 2.2 Write property test for ThemeService backgroundColor passthrough
    - **Property 1: ThemeService backgroundColor passthrough**
    - For any non-empty valid hex color string as `theme.backgroundColor`, verify `--theme-background` on document root equals that exact value after `applyThemeToCSS(theme)`
    - **Validates: Requirements 6.1**

- [x] 3. Remove dark mode from HomePage.jsx
  - [x] 3.1 Strip dark mode state and toggle from `frontend/src/pages/modules/Customer/HomePage.jsx`
    - Remove `themeMode` state variable and `localStorage.getItem('customerThemeMode')` initialization
    - Remove the dark mode toggle button (the `btn-icon-only` with moon/sun icon)
    - Remove `localStorage.setItem('customerThemeMode', newMode)` call
    - Remove the inline `<style>` block (~218 lines) that overrides token values with hardcoded dark colors
    - Change className from conditional `${themeMode === 'light' ? 'light-mode' : 'dark-mode'}` to static `landing-container grilli-scope`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Remove dark mode from other customer pages
  - [x] 4.1 Remove dark mode from `frontend/src/pages/modules/Customer/AboutPage.jsx`
    - Remove `themeMode` state, `isDark` derived variable
    - Remove all `isDark ? darkValue : lightValue` ternary expressions for `bgColor`, `cardBg`, `textColor`, `textMuted`, `borderCol`
    - Let the page inherit colors from grilli-tokens via `.grilli-scope`
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [x] 4.2 Remove dark mode from `frontend/src/pages/modules/Customer/OrdersPage.jsx`
    - Remove `themeMode` state, `localStorage.getItem('customerThemeMode')` init
    - Remove `isDark` derived variable and all conditional color assignments
    - Use grilli-tokens via `.grilli-scope` class
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.3 Remove dark mode from `frontend/src/pages/modules/Customer/ProfilePage.jsx`
    - Remove `themeMode` state, `localStorage.getItem('customerThemeMode')` init
    - Remove `isDark` derived variable and conditional color assignments
    - Use grilli-tokens via `.grilli-scope` class
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.4 Remove dark mode from `frontend/src/pages/modules/Customer/AddressesPage.jsx`
    - Remove `<style>` block that reads `localStorage.getItem('customerThemeMode')` and applies conditional colors via `!important`
    - Use grilli-tokens via `.grilli-scope` class
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.5 Write unit tests for dark mode absence across customer pages
    - **Property 6: Dark mode state absence**
    - Verify no customer page renders a `dark-mode` class, reads `customerThemeMode` from localStorage, or renders a theme toggle button
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 5. Remove redundant WARM LIGHT MODE section from HomePage.grilli.css
  - [x] 5.1 Delete the WARM LIGHT MODE section from `frontend/src/styles/HomePage.grilli.css`
    - Remove the entire section (~500 lines) starting with the `/* WARM LIGHT MODE */` comment block through end of file
    - This section is redundant since grilli-tokens.css now defines light-mode values directly
    - Do NOT touch any other section of the file
    - _Requirements: 5.1, 7.1_

- [x] 6. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the customer website renders with dynamic brand colors from the backend
  - Verify no dark mode toggle or dark mode state exists in any customer page
  - Verify admin/staff/branch pages are completely unaffected

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The language is JavaScript/JSX/CSS — all implementation files are in `frontend/src/`
- The 9600-line `HomePage.grilli.css` already uses `var(--grilli-*)` tokens so it requires no changes beyond removing the WARM LIGHT MODE section
- Scope constraint (Requirement 7) is inherently satisfied by limiting changes to customer module files and `.grilli-scope`-scoped tokens

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["4.1", "4.2", "4.3", "4.4", "5.1"] },
    { "id": 2, "tasks": ["1.2", "1.3", "2.2", "4.5"] }
  ]
}
```
