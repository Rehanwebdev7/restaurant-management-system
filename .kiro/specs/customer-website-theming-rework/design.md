# Design Document: Customer Website Theming Rework

## Overview

This design replaces the hardcoded dark "Grilli" theme on the customer-facing restaurant website with a dynamic, light-mode theming system that uses CSS custom properties set by the existing ThemeService. The architecture preserves the existing ThemeService as the single source of truth for brand colors and introduces a rewritten token/override layer that references these variables instead of hardcoded values.

## Architecture

### Current Architecture (Problem)

```
ThemeService → sets CSS variables (--theme-primary, --theme-background, etc.)
     ↓
grilli-tokens.css → OVERRIDES with hardcoded dark values (#0A0908, #D4A857)
     ↓
HomePage.grilli.css → 9600+ lines of dark-theme overrides
     ↓
premium-redesign.css → More dark overrides
     ↓
HomePage.jsx → Inline <style> block with MORE hardcoded dark overrides
```

### Target Architecture (Solution)

```
ThemeService → sets CSS variables (--theme-primary, --theme-background, etc.)
     ↓
grilli-tokens.css → REFERENCES CSS variables, defines layout/typography/motion tokens
     ↓
customer-theme.css → Light-mode styles using only CSS variable references
     ↓
HomePage.jsx → No inline styles, just .grilli-scope class on wrapper
```

## Components

### 1. Rewritten `grilli-tokens.css`

**Purpose**: Define design tokens that bridge ThemeService CSS variables to component-level tokens.

**Changes**:
- Remove all hardcoded dark surface colors (`#0A0908`, `#14110F`, etc.)
- Remove all hardcoded gold accent values (`#D4A857`, `#E8CFA0`, etc.)
- Replace surface tokens with references to `--theme-background` and derived light values
- Replace accent tokens with references to `--theme-primary` and its variants
- Replace text tokens with references to `--theme-font-color`
- Keep typography, spacing, motion, and radius tokens unchanged (they are design-system concerns, not color)

**Token Mapping**:

```css
:root {
  /* Surfaces — light, derived from theme background */
  --grilli-surface-void:      var(--theme-background, #f8fafc);
  --grilli-surface-raised:    #ffffff;
  --grilli-surface-elev:      #ffffff;
  --grilli-surface-line:      var(--theme-border, rgba(0, 0, 0, 0.08));

  /* Accent — from ThemeService primary */
  --grilli-gold:              var(--theme-primary, #667eea);
  --grilli-gold-soft:         var(--theme-primary-light, #8ba3ff);
  --grilli-gold-deep:         var(--theme-primary-dark, #4c5fd5);
  --grilli-gold-hairline:     var(--theme-accent-soft, rgba(102, 126, 234, 0.10));
  --grilli-gold-glow:         var(--theme-accent-subtle, rgba(102, 126, 234, 0.06));

  /* Text — from ThemeService font color */
  --grilli-text-ivory:        var(--theme-font-color, #1e293b);
  --grilli-text-mist:         color-mix(in srgb, var(--theme-font-color, #334155) 60%, transparent);
  --grilli-text-shadow:       color-mix(in srgb, var(--theme-font-color, #334155) 35%, transparent);
  --grilli-text-inverse:      var(--primary-color-contrast, #ffffff);
}
```

### 2. New `customer-theme.css` (replaces `HomePage.grilli.css` and `premium-redesign.css`)

**Purpose**: Single stylesheet for all customer page visual styling, scoped under `.grilli-scope`.

**Design Principles**:
- Every color value must reference a CSS variable (no hardcoded hex colors)
- Light backgrounds with soft shadows for premium feel
- Cards use `--grilli-surface-raised` (white) with subtle shadows
- Sections alternate between `--grilli-surface-void` (light bg from theme) and white
- Accent elements use `--grilli-gold` (which maps to `--theme-primary`)
- Buttons use `--grilli-gold` for background with `--grilli-text-inverse` for text (contrast-safe)

**Key Sections**:

```css
/* Base scaffolding */
.grilli-scope {
  background: var(--grilli-surface-void);
  color: var(--grilli-text-ivory);
  font-family: var(--grilli-font-body);
}

/* Cards — white with soft shadows */
.grilli-scope .food-card,
.grilli-scope .feature-card {
  background: var(--grilli-surface-raised);
  border: 1px solid var(--grilli-surface-line);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: transform var(--grilli-dur-med) var(--grilli-ease-luxe),
              box-shadow var(--grilli-dur-med) var(--grilli-ease-luxe);
}

.grilli-scope .food-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

/* Buttons — filled with primary, contrast-safe text */
.grilli-scope .grilli-btn {
  background: var(--grilli-gold);
  color: var(--grilli-text-inverse);
  border: none;
  border-radius: 8px;
  transition: background var(--grilli-dur-fast) var(--grilli-ease-luxe),
              transform var(--grilli-dur-fast) var(--grilli-ease-luxe);
}

.grilli-scope .grilli-btn:hover {
  background: var(--grilli-gold-deep);
  transform: translateY(-2px);
}

/* Section backgrounds — subtle primary tint */
.grilli-scope .categories-section,
.grilli-scope .features-section {
  background: var(--theme-surface, #f8fafc);
}
```

### 3. HomePage.jsx Cleanup

**Changes**:
- Remove the entire inline `<style>` block (~170 lines of hardcoded dark overrides)
- Remove `themeMode` state variable and all dark/light mode toggling logic
- Remove import of `premium-redesign.css`
- Replace import of `HomePage.grilli.css` with `customer-theme.css`
- Keep `grilli-scope` class on wrapper div
- Remove any reference to DarkModeContext

**Before**:
```jsx
const [themeMode, setThemeMode] = useState('light');
// ...
<style>{`
  .landing-container.light-mode.grilli-scope {
    --grilli-surface-void: #0f1419;
    ...
  }
`}</style>
<div className={`landing-container ${themeMode === 'light' ? 'light-mode' : 'dark-mode'} grilli-scope`}>
```

**After**:
```jsx
// No themeMode state needed
// ...
// No inline <style> block
<div className="landing-container grilli-scope">
```

### 4. Other Customer Pages (AboutPage, ContactPage, LocationPage, etc.)

**Changes**:
- Remove any `light-mode` / `dark-mode` class conditionals
- Ensure the wrapper uses `grilli-scope` class directly
- Remove any DarkModeContext imports/usage
- Styles come from the shared `customer-theme.css`

### 5. ThemeService Enhancements

The existing ThemeService already handles:
- Fetching brand colors from backend API
- Applying CSS variables to document root
- Contrast color calculation
- Color derivation (lighten, darken, blend)

**Minor Enhancement**: Ensure the `--theme-background` variable uses the restaurant's configured backgroundColor directly (instead of the current primary-tinted computation). If backgroundColor is not set, fall back to a neutral light value.

```javascript
// In applyThemeToCSS:
if (theme.backgroundColor) {
  root.style.setProperty('--theme-background', theme.backgroundColor);
  root.style.setProperty('--page-bg', theme.backgroundColor);
} else {
  // Fallback: light neutral with subtle primary tint
  root.style.setProperty('--theme-background', lightBg);
  root.style.setProperty('--page-bg', lightBg);
}
```

### 6. File Deletion

The following files should be deleted or emptied:
- `frontend/src/styles/HomePage.grilli.css` → Replaced by `customer-theme.css`
- `frontend/src/styles/premium-redesign.css` → Merged into `customer-theme.css`

## Data Model

No data model changes. The theme data structure from the backend API remains unchanged. The `mapApiDataToTheme` function in ThemeService already extracts all needed color fields.

## Error Handling

- **API failure**: ThemeService already falls back to `DEFAULT_THEME` with safe light colors
- **Missing backgroundColor**: Falls back to neutral light with primary tint
- **Invalid hex colors**: `normalizeHex` in ThemeService already handles this
- **Extreme color choices**: `getContrastColor` ensures readable text on any primary color

## Interfaces

### CSS Variable Contract (ThemeService → Stylesheets)

| Variable | Source | Usage |
|----------|--------|-------|
| `--theme-primary` | primaryColor from API | Buttons, links, accents |
| `--theme-primary-dark` | Derived (darken 15%) | Hover states |
| `--theme-primary-light` | Derived (lighten 30%) | Highlights |
| `--theme-secondary` | secondaryColor from API | Gradients, secondary elements |
| `--theme-tertiary` | tertiaryColor from API | Tertiary accents |
| `--theme-font-color` | fontColor from API | Body text |
| `--theme-background` | backgroundColor from API | Page background |
| `--primary-color-contrast` | Computed (WCAG contrast) | Text on primary-colored bg |
| `--theme-accent-soft` | Primary at 10% opacity | Subtle backgrounds |
| `--theme-surface` | Primary blended with white at 94% | Section alt backgrounds |
| `--theme-border` | Primary at 12% opacity | Borders |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Contrast color correctness

*For any* valid 6-digit hex color, `getContrastColor` SHALL return `#000000` when the color's WCAG relative luminance is greater than 0.179, and `#ffffff` otherwise.

**Validates: Requirements 5.1, 5.2**

### Property 2: Lighten produces higher luminance

*For any* valid 6-digit hex color and any positive percentage (1-99), `lightenHex(color, percent)` SHALL produce a color with equal or higher WCAG relative luminance than the input color.

**Validates: Requirements 5.3**

### Property 3: Darken produces lower luminance

*For any* valid 6-digit hex color and any positive percentage (1-99), `darkenHex(color, percent)` SHALL produce a color with equal or lower WCAG relative luminance than the input color.

**Validates: Requirements 5.3**

### Property 4: No forbidden dark-theme colors in customer stylesheets

*For any* CSS rule in the customer stylesheet files (`grilli-tokens.css`, `customer-theme.css`), the rule SHALL NOT contain any of the hardcoded dark surface hex values (#0A0908, #14110F, #1A1613, #1F1C18) or hardcoded gold values (#D4A857, #E8CFA0, #A88338).

**Validates: Requirements 1.6, 3.3, 3.4**

### Property 5: Blend with white at high ratio produces near-white

*For any* valid 6-digit hex color, `blendHex(color, '#ffffff', 0.94)` SHALL produce a color with WCAG relative luminance greater than 0.80.

**Validates: Requirements 5.4**

### Property 6: Customer CSS rules are scoped under .grilli-scope

*For any* non-root CSS rule in the customer theme stylesheet, the rule selector SHALL include `.grilli-scope` as a prefix or ancestor selector.

**Validates: Requirements 6.1**
