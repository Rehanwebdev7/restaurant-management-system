# Requirements Document

## Introduction

This feature replaces hardcoded dark color values in the Grilli theme token system with dynamic CSS variable references sourced from the backend via ThemeService. The result is a light-mode customer website whose accent, background, and text colors are driven entirely by restaurant brand configuration. Dark mode is removed. All CSS selectors, animations, layout patterns, and structural properties remain unchanged — only color values are modified.

## Glossary

- **Customer_Website**: The public-facing restaurant website rendered by components in `frontend/src/pages/modules/Customer/` including HomePage, AboutPage, ContactPage, LocationPage, OrdersPage, ProfilePage, AddressesPage, and other customer routes.
- **ThemeService**: The existing service (`frontend/src/services/themeService.js`) that fetches restaurant brand colors from the backend API and applies them as CSS custom properties on the document root element.
- **Grilli_Tokens**: The CSS file (`frontend/src/styles/grilli-tokens.css`) that defines design tokens as CSS custom properties consumed by Customer_Website styling.
- **Brand_Colors**: The set of colors configured by restaurant owners via the admin panel: primaryColor, backgroundColor, and fontColor.
- **Theme_Variables**: CSS custom properties set by ThemeService on `:root` including `--theme-primary`, `--theme-background`, `--theme-font-color`, and derived variants such as `--theme-primary-light` and `--theme-primary-dark`.
- **Dark_Mode_Toggle**: The existing UI button and `themeMode` state in customer pages that allows users to switch between light and dark color schemes.
- **Grilli_Scope**: The CSS class `.grilli-scope` applied to the wrapper element of all customer pages to scope customer-specific styles and prevent leakage into admin pages.

## Requirements

### Requirement 1: Dynamic Surface Colors

**User Story:** As a restaurant owner, I want the customer website background and card surfaces to use my configured brand backgroundColor, so that the site reflects my restaurant's visual identity.

#### Acceptance Criteria

1. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-surface-void` to reference `var(--theme-background, #f8fafc)`.
2. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-surface-raised` to a white or near-white card surface value that contrasts with the background.
3. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-surface-elev` to a light elevated surface value suitable for navigation and tooltips.
4. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-surface-line` to a subtle border color derived from the background at reduced opacity.
5. THE Grilli_Tokens SHALL set `--grilli-overlay-hush` and `--grilli-overlay-veil` to white-based overlays suitable for a light-mode layout.

### Requirement 2: Dynamic Accent Colors

**User Story:** As a restaurant owner, I want the customer website accent colors (buttons, links, highlights) to use my configured primaryColor, so that the brand identity is consistent across all touchpoints.

#### Acceptance Criteria

1. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-gold` to reference `var(--theme-primary, #667eea)`.
2. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-gold-soft` to reference `var(--theme-primary-light)` for hover and highlight states.
3. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-gold-deep` to reference `var(--theme-primary-dark)` for pressed and border states.
4. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-gold-hairline` to a reduced-opacity variant of the primary color for subtle decorative lines.
5. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-gold-glow` to a low-opacity variant of the primary color for glow effects.

### Requirement 3: Dynamic Text Colors

**User Story:** As a restaurant owner, I want the customer website text to use my configured fontColor, so that readability is maintained with my chosen color scheme.

#### Acceptance Criteria

1. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-text-ivory` to reference `var(--theme-font-color, #1e293b)` for primary text.
2. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-text-mist` to a 60% opacity variant derived from the font color for secondary text.
3. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-text-shadow` to a 35% opacity variant derived from the font color for muted/tertiary text.
4. WHEN ThemeService applies Brand_Colors, THE Grilli_Tokens SHALL set `--grilli-text-inverse` to a contrasting color suitable for text displayed on accent-colored backgrounds.

### Requirement 4: Dark Mode Removal

**User Story:** As a developer, I want the dark mode toggle and state removed from all customer pages, so that the site renders consistently in the backend-driven light color scheme without user override.

#### Acceptance Criteria

1. THE Customer_Website SHALL NOT render a Dark_Mode_Toggle button on any customer page.
2. THE Customer_Website SHALL NOT read or write the `customerThemeMode` localStorage key.
3. THE Customer_Website SHALL NOT apply conditional CSS classes based on a dark/light theme mode state (the `dark-mode`/`light-mode` class toggling).
4. THE Customer_Website SHALL NOT use inline style calculations that branch on a `themeMode` or `isDark` variable.
5. WHEN a customer page loads, THE Customer_Website SHALL render using only the Brand_Colors provided by ThemeService without any local theme mode state.

### Requirement 5: Structural Preservation

**User Story:** As a developer, I want all non-color CSS properties preserved exactly, so that the visual layout, animations, and component structure remain intact after the color migration.

#### Acceptance Criteria

1. THE Grilli_Tokens SHALL preserve all existing CSS selectors without addition, removal, or modification.
2. THE Grilli_Tokens SHALL preserve all non-color CSS custom properties (typography, spacing, radii, motion, elevation) with their existing values unchanged.
3. THE Grilli_Tokens SHALL preserve all animation keyframes, transition definitions, and timing functions unchanged.
4. THE Grilli_Tokens SHALL preserve the `.grilli-scope` base scaffolding selector and all layout primitives (`.grilli-section`, `.grilli-container`, `.grilli-container-narrow`).
5. THE Grilli_Tokens SHALL preserve all structural CSS properties (display, position, padding, margin, width, height, flex, grid) unchanged across all rules.

### Requirement 6: ThemeService Enhancement

**User Story:** As a developer, I want ThemeService to use the restaurant's backgroundColor directly when available from the API, so that the page background accurately reflects the admin-configured value.

#### Acceptance Criteria

1. WHEN the backend API response includes a non-empty backgroundColor value, THE ThemeService SHALL set `--theme-background` to that backgroundColor value directly.
2. IF the backend API response does not include a backgroundColor value, THEN THE ThemeService SHALL fall back to the existing light background derivation logic.
3. THE ThemeService SHALL continue to set `--theme-primary`, `--theme-font-color`, `--theme-primary-light`, and `--theme-primary-dark` variables using existing logic.

### Requirement 7: Scope Constraint

**User Story:** As a developer, I want changes scoped exclusively to customer pages, so that admin, staff, branch, and superadmin modules are unaffected.

#### Acceptance Criteria

1. THE Grilli_Tokens SHALL apply only within elements carrying the Grilli_Scope class or within customer page components.
2. THE Grilli_Tokens SHALL NOT modify any CSS used by admin, staff, branch, or superadmin modules.
3. THE Dark_Mode_Toggle removal SHALL apply only to pages within `frontend/src/pages/modules/Customer/`.
