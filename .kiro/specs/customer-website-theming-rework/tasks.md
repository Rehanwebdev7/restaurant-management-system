# Implementation Plan: Customer Website Theming Rework

## Overview

Replace the hardcoded dark "Grilli" theme with a dynamic, light-mode theming system that uses CSS variables from ThemeService. Work proceeds in layers: tokens first, then the main stylesheet, then component cleanup, then verification.

## Tasks

- [x] 1. Rewrite design tokens for light mode
  - [x] 1.1 Rewrite `frontend/src/styles/grilli-tokens.css` to replace all hardcoded dark surface colors and gold accents with CSS variable references from ThemeService
    - Replace `--grilli-surface-void` with `var(--theme-background, #f8fafc)`
    - Replace `--grilli-surface-raised` with `#ffffff`
    - Replace `--grilli-surface-elev` with `#ffffff`
    - Replace `--grilli-surface-line` with `var(--theme-border, rgba(0, 0, 0, 0.08))`
    - Replace `--grilli-gold` with `var(--theme-primary, #667eea)`
    - Replace `--grilli-gold-soft` with `var(--theme-primary-light)`
    - Replace `--grilli-gold-deep` with `var(--theme-primary-dark)`
    - Replace `--grilli-text-ivory` with `var(--theme-font-color, #1e293b)`
    - Replace `--grilli-text-mist` and `--grilli-text-shadow` with derived lighter variants
    - Replace `--grilli-text-inverse` with `var(--primary-color-contrast, #ffffff)`
    - Update shadow tokens to use light-appropriate soft shadows
    - Keep typography, spacing, motion, and radius tokens unchanged
    - _Requirements: 1.6, 3.1, 3.3, 3.4_

- [x] 2. Create new customer theme stylesheet
  - [x] 2.1 Create `frontend/src/styles/customer-theme.css` as the replacement for `HomePage.grilli.css` and `premium-redesign.css`
    - All rules scoped under `.grilli-scope`
    - Base scaffolding: light background, body font color from variables
    - Header: white/light background with subtle shadow, no dark glass effect
    - Hero section: keep image overlay gradient but with lighter fallback
    - Cards: white background, rounded corners (12px), soft box-shadows (`0 4px 20px rgba(0,0,0,0.06)`), hover lift effect
    - Buttons: filled with `--grilli-gold` background, `--grilli-text-inverse` text, rounded (8px), hover darkens
    - Section alternation: primary sections use `--grilli-surface-void`, alternating sections use `--theme-surface`
    - Eyebrows/ornaments: use `--grilli-gold` for accent color
    - Typography: headings use `--grilli-font-display`, body uses `--grilli-font-body`, colors from variables
    - Form inputs: white background, light border, primary-colored focus ring
    - Footer: slightly darker surface using `--theme-surface-alt`, accent links
    - Animations: keep fade-in keyframes, hover transitions 200ms-400ms
    - Category chips, food cards, feature cards, testimonials, gallery, reservation form
    - Scrollbar styling for light mode
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.2, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Delete `frontend/src/styles/HomePage.grilli.css` and `frontend/src/styles/premium-redesign.css`
    - These are fully replaced by `customer-theme.css`
    - _Requirements: 3.2_

- [x] 3. Update HomePage.jsx component
  - [x] 3.1 Remove inline `<style>` block from HomePage.jsx that overrides CSS variables with hardcoded dark values
    - Remove the entire template literal style block (~170 lines) that sets `--grilli-surface-void: #0f1419` and hardcoded `#d4a853` overrides
    - _Requirements: 7.1_

  - [x] 3.2 Remove themeMode state and dark/light mode logic from HomePage.jsx
    - Remove `const [themeMode, setThemeMode] = useState(...)` and any localStorage references to `customerThemeMode`
    - Remove `light-mode`/`dark-mode` class conditionals from the wrapper div
    - Change wrapper to simply: `<div className="landing-container grilli-scope">`
    - _Requirements: 7.2, 7.3, 2.1, 2.2_

  - [x] 3.3 Update imports in HomePage.jsx
    - Remove `import '../../../styles/HomePage.grilli.css'`
    - Remove `import '../../../styles/premium-redesign.css'`
    - Add `import '../../../styles/customer-theme.css'`
    - Keep `import '../../../styles/grilli-tokens.css'` and `import '../../../styles/HomePage.css'`
    - _Requirements: 3.2_

- [x] 4. Update other customer pages
  - [x] 4.1 Update AboutPage.jsx, ContactPage.jsx, LocationPage.jsx, and other customer pages to remove dark mode references
    - Remove any `light-mode`/`dark-mode` class conditionals on wrapper elements
    - Remove any DarkModeContext imports/usage
    - Ensure wrapper div uses `grilli-scope` class
    - Verify imports reference the new `customer-theme.css` if they imported `HomePage.grilli.css`
    - _Requirements: 2.3, 2.4, 6.1_

- [x] 5. Update ThemeService for backgroundColor handling
  - [x] 5.1 Modify `applyThemeToCSS` in `frontend/src/services/themeService.js` to use restaurant's backgroundColor directly when available
    - If `theme.backgroundColor` is set, use it directly for `--theme-background` and `--page-bg`
    - If not set, keep the current primary-tinted light background as fallback
    - Remove the dark-mode tinted bg computation (`--theme-background-dark`) since dark mode is removed from customer pages
    - _Requirements: 1.5, 5.5_

- [x] 6. Update HomePage.css root variables
  - [x] 6.1 Remove hardcoded dark color values from `frontend/src/styles/HomePage.css` root variables
    - Change `--light-bg: #0A0A0A` to use `var(--theme-background, #f8fafc)`
    - Change `--card-bg: #1A1A1A` to `#ffffff`
    - Change `--text-primary: #FFFFFF` to `var(--theme-font-color, #1e293b)`
    - Change `--page-bg: #0A0A0A` to `var(--theme-background, #f8fafc)`
    - Update shadow values to light-appropriate soft shadows
    - _Requirements: 1.6, 3.3_

- [x] 7. Checkpoint - Verify visual rendering
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Write property tests for color utility functions
  - [ ]* 8.1 Write property test for getContrastColor
    - **Property 1: Contrast color correctness**
    - For any valid 6-digit hex color, verify getContrastColor returns #000000 when luminance > 0.179 and #ffffff otherwise
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 8.2 Write property test for lightenHex and darkenHex
    - **Property 2: Lighten produces higher luminance**
    - **Property 3: Darken produces lower luminance**
    - For any valid hex color and percentage (1-99), lightenHex produces equal or higher luminance, darkenHex produces equal or lower
    - **Validates: Requirements 5.3**

  - [ ]* 8.3 Write property test for blendHex with white at high ratio
    - **Property 5: Blend with white at high ratio produces near-white**
    - For any valid hex color, blendHex(color, '#ffffff', 0.94) produces luminance > 0.80
    - **Validates: Requirements 5.4**

  - [ ]* 8.4 Write static analysis test for forbidden hardcoded colors
    - **Property 4: No forbidden dark-theme colors in customer stylesheets**
    - Parse grilli-tokens.css and customer-theme.css, verify no occurrence of #0A0908, #14110F, #1A1613, #1F1C18, #D4A857, #E8CFA0, #A88338
    - **Validates: Requirements 1.6, 3.3, 3.4**

- [x] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties of color utility functions
- The dominant implementation language is JavaScript (React/CSS) for all tasks
- The themeService.js color utility functions (getContrastColor, lightenHex, darkenHex, blendHex) are tested with property-based tests using fast-check
- Static analysis test (8.4) reads CSS files and asserts absence of forbidden color values

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "5.1", "6.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["2.2", "4.1"] },
    { "id": 3, "tasks": ["8.1", "8.2", "8.3", "8.4"] }
  ]
}
```
