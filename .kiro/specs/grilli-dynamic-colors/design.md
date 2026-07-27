# Design Document: Grilli Dynamic Colors

## Architecture Overview

This feature migrates the Grilli theme token system from hardcoded dark color values to dynamic CSS variable references sourced from the backend via ThemeService. The change is minimal in scope: only color token VALUES in `grilli-tokens.css` change. The existing 9600-line `HomePage.grilli.css` already consumes tokens via `var(--grilli-gold)`, `var(--grilli-surface-void)`, etc., so updating the token definitions cascades automatically through the entire stylesheet.

The architecture follows a single-direction data flow:

```
Backend API → ThemeService → :root CSS variables → grilli-tokens.css references → Customer page styles
```

Dark mode state, toggle UI, and conditional branching are removed from all customer pages. The site renders in a single light-mode palette driven entirely by brand configuration.

## Components

### 1. grilli-tokens.css (Token Value Migration)

**Location:** `frontend/src/styles/grilli-tokens.css`

**Change scope:** Only the `:root` color token values. All selectors, non-color properties, layout primitives, typography, spacing, radii, motion, and elevation tokens remain untouched.

**Before → After token mapping:**

```css
:root {
  /* ---- Surfaces ---- */
  --grilli-surface-void:   var(--theme-background, #f8fafc);
  --grilli-surface-raised: #ffffff;
  --grilli-surface-elev:   #ffffff;
  --grilli-surface-line:   var(--theme-border, rgba(0, 0, 0, 0.08));
  --grilli-overlay-hush:   rgba(255, 255, 255, 0.85);
  --grilli-overlay-veil:   rgba(255, 255, 255, 0.55);

  /* ---- Accent ---- */
  --grilli-gold:           var(--theme-primary, #667eea);
  --grilli-gold-soft:      var(--theme-primary-light, #99b2ff);
  --grilli-gold-deep:      var(--theme-primary-dark, #4a5fc7);
  --grilli-gold-hairline:  var(--theme-accent-soft, rgba(102, 126, 234, 0.10));
  --grilli-gold-glow:      var(--theme-accent-subtle, rgba(102, 126, 234, 0.06));

  /* ---- Text ---- */
  --grilli-text-ivory:     var(--theme-font-color, #1e293b);
  --grilli-text-mist:      color-mix(in srgb, var(--theme-font-color, #1e293b) 60%, transparent);
  --grilli-text-shadow:    color-mix(in srgb, var(--theme-font-color, #1e293b) 35%, transparent);
  --grilli-text-inverse:   var(--primary-color-contrast, #ffffff);

  /* ---- Elevation (light shadows) ---- */
  --grilli-shadow-card:    0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
  --grilli-shadow-lift:    0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
  --grilli-shadow-glow:    0 0 24px var(--grilli-gold-glow);
}
```

**Unchanged sections:**
- Typography tokens (`--grilli-font-display`, `--grilli-font-body`, letter-spacing, line-height)
- Rhythm & sizing tokens (`--grilli-section-y`, `--grilli-container`, `--grilli-gutter`)
- Radii tokens (`--grilli-radius-0`, `--grilli-radius-input`, `--grilli-radius-pill`)
- Motion tokens (`--grilli-ease-luxe`, `--grilli-dur-fast`, etc.)
- `.grilli-scope` base scaffolding (still uses `var(--grilli-surface-void)` and `var(--grilli-text-ivory)`)
- Layout primitives (`.grilli-section`, `.grilli-container`, `.grilli-container-narrow`)

### 2. ThemeService Enhancement

**Location:** `frontend/src/services/themeService.js`

**Change:** In `applyThemeToCSS()`, when `theme.backgroundColor` is a non-empty string, set `--theme-background` directly to that value instead of computing a tinted blend.

```javascript
// In applyThemeToCSS, replace the computed lightBg logic:
if (theme.backgroundColor && theme.backgroundColor.trim()) {
  // Use admin-configured backgroundColor directly
  root.style.setProperty('--theme-background', theme.backgroundColor);
  root.style.setProperty('--page-bg', theme.backgroundColor);
} else if (primary) {
  // Fallback: compute tinted background from primary (existing logic)
  const _p  = primary.replace('#', '');
  const _pr = parseInt(_p.substring(0, 2), 16);
  const _pg = parseInt(_p.substring(2, 4), 16);
  const _pb = parseInt(_p.substring(4, 6), 16);
  const toHex = (c) => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, '0');
  const lightBg = '#' + [
    248 * 0.92 + _pr * 0.08,
    250 * 0.92 + _pg * 0.08,
    252 * 0.92 + _pb * 0.08,
  ].map(toHex).join('');
  root.style.setProperty('--theme-background', lightBg);
  root.style.setProperty('--page-bg', lightBg);
}
```

All other variable assignments (`--theme-primary`, `--theme-font-color`, `--theme-primary-light`, `--theme-primary-dark`, `--theme-accent-soft`, `--theme-accent-subtle`, `--primary-color-contrast`) remain unchanged.

### 3. Dark Mode Removal from Customer Pages

**Affected files:**
- `frontend/src/pages/modules/Customer/HomePage.jsx`
- `frontend/src/pages/modules/Customer/AboutPage.jsx`
- `frontend/src/pages/modules/Customer/OrdersPage.jsx`
- `frontend/src/pages/modules/Customer/ProfilePage.jsx`
- `frontend/src/pages/modules/Customer/AddressesPage.jsx`

**Changes per file:**

#### HomePage.jsx
- Remove `themeMode` state and `localStorage.getItem('customerThemeMode')` initialization
- Remove dark mode toggle button (`btn-icon-only` with moon/sun icon)
- Replace conditional class `${themeMode === 'light' ? 'light-mode' : 'dark-mode'}` with just `grilli-scope`
- Remove inline `<style>` block (~218 lines) that overrides token values with hardcoded dark colors
- Remove `localStorage.setItem('customerThemeMode', newMode)` call

#### AboutPage.jsx
- Remove `themeMode` state, `isDark` derived variable
- Remove all `isDark ? darkValue : lightValue` ternary expressions for `bgColor`, `cardBg`, `textColor`, `textMuted`, `borderCol`
- Replace inline styles with CSS variable references or remove them (the page should inherit from grilli-tokens via `.grilli-scope`)

#### OrdersPage.jsx
- Remove `themeMode` state, `localStorage.getItem('customerThemeMode')` init
- Remove `isDark` derived variable and all conditional color assignments
- Use grilli-tokens via `.grilli-scope` class

#### ProfilePage.jsx
- Remove `themeMode` state, `localStorage.getItem('customerThemeMode')` init
- Remove `isDark` derived variable and conditional color assignments
- Use grilli-tokens via `.grilli-scope` class

#### AddressesPage.jsx
- Remove `<style>` block that reads `localStorage.getItem('customerThemeMode')` and applies conditional colors via `!important`
- Use grilli-tokens via `.grilli-scope` class

### 4. HomePage.grilli.css Cleanup

**Location:** `frontend/src/styles/HomePage.grilli.css`

The WARM LIGHT MODE section (~500 lines at the bottom) contains hardcoded light values that were a partial light-mode attempt. Since the base tokens in `grilli-tokens.css` now define light-mode values directly, this section becomes redundant and should be removed to avoid specificity conflicts.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Backend API Response                                            │
│  { primarys: "#e63946", backgroundColor: "#fef9f2",             │
│    fontColour: "#2d3436" }                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  ThemeService.applyThemeToCSS()                                  │
│  Sets on :root:                                                  │
│    --theme-primary: #e63946                                      │
│    --theme-background: #fef9f2                                   │
│    --theme-font-color: #2d3436                                   │
│    --theme-primary-light: #f07a83                                │
│    --theme-primary-dark: #c43039                                 │
│    --theme-accent-soft: rgba(230, 57, 70, 0.10)                  │
│    --theme-accent-subtle: rgba(230, 57, 70, 0.06)                │
│    --primary-color-contrast: #ffffff                              │
│    --theme-border: rgba(230, 57, 70, 0.12)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  grilli-tokens.css :root                                         │
│  Token definitions reference :root vars set by ThemeService:     │
│    --grilli-gold: var(--theme-primary, #667eea)                   │
│    --grilli-surface-void: var(--theme-background, #f8fafc)        │
│    --grilli-text-ivory: var(--theme-font-color, #1e293b)          │
│    ... (all tokens resolve via CSS variable cascade)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  HomePage.grilli.css + Customer Page Components                   │
│  All styles use var(--grilli-gold), var(--grilli-surface-void),   │
│  etc. — no code changes needed in this 9600-line file            │
│  Colors cascade automatically from token value changes           │
└─────────────────────────────────────────────────────────────────┘
```

## Interfaces

### ThemeService Public API (unchanged)

```javascript
// Existing exports — no signature changes
export const initializeTheme = async () => Promise<ThemeObject>;
export const applyThemeToCSS = (theme: ThemeObject) => void;
export const getCurrentTheme = () => ThemeObject;
export const refreshTheme = async () => Promise<ThemeObject>;
export const getContrastColor = (hex: string) => string;
```

### ThemeObject Shape (existing, no changes)

```javascript
interface ThemeObject {
  primary: string;          // hex color
  secondary: string;        // hex color
  tertiary: string;         // hex color
  fontColor: string;        // hex color
  backgroundColor: string;  // hex color (used directly when non-empty)
  restaurantName: string;
  logoUrl: string | null;
  // ... other fields unchanged
}
```

### CSS Token Contract

The token names (`--grilli-gold`, `--grilli-surface-void`, etc.) are the stable API between `grilli-tokens.css` and all consuming stylesheets. Their names do not change. Only their VALUES change from hardcoded dark colors to `var()` references.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| ThemeService API fails | Falls back to localStorage cache, then DEFAULT_THEME. Token fallback values (`#667eea`, `#f8fafc`, `#1e293b`) ensure usable appearance. |
| `backgroundColor` empty/null in API | ThemeService falls back to computing tinted background from primary color (existing behavior). |
| CSS `var()` references unresolved | Each token includes a fallback value: `var(--theme-primary, #667eea)`. Browser renders with fallback. |
| `color-mix()` unsupported (old browsers) | Text mist/shadow tokens degrade to transparent text. Mitigation: add `@supports` with hex fallbacks if needed. |
| Customer page loaded before ThemeService | Tokens use CSS fallback values providing a sensible default light appearance. |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: ThemeService backgroundColor passthrough

*For any* non-empty valid hex color string provided as `theme.backgroundColor`, after calling `applyThemeToCSS(theme)`, the CSS variable `--theme-background` on the document root SHALL equal that exact backgroundColor value.

**Validates: Requirements 6.1**

### Property 2: Text opacity derivation consistency

*For any* valid hex fontColor, the `--grilli-text-mist` token SHALL resolve to a color representing that fontColor at 60% opacity, and `--grilli-text-shadow` SHALL resolve to that fontColor at 35% opacity. The opacity relationship between mist and shadow SHALL be constant (mist is always more opaque than shadow).

**Validates: Requirements 3.2, 3.3**

### Property 3: Contrast color correctness

*For any* valid hex primary color, the value of `--grilli-text-inverse` (via `--primary-color-contrast`) SHALL be either `#000000` or `#ffffff`, chosen such that the contrast ratio against the primary color meets or exceeds WCAG AA threshold (4.5:1 for normal text).

**Validates: Requirements 3.4**

### Property 4: Token cascade identity

*For any* set of Brand_Colors (primaryColor, backgroundColor, fontColor) applied by ThemeService, the computed values of `--grilli-gold`, `--grilli-surface-void`, and `--grilli-text-ivory` SHALL equal `--theme-primary`, `--theme-background`, and `--theme-font-color` respectively. The grilli tokens are a transparent passthrough of theme variables.

**Validates: Requirements 1.1, 2.1, 3.1**

### Property 5: Non-color token preservation

*For any* modification to color token values in grilli-tokens.css, all non-color tokens (typography, spacing, radii, motion, elevation timing) SHALL retain their original values unchanged. The set of CSS selectors in the file SHALL remain identical before and after the change.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 6: Dark mode state absence

*For any* customer page component render (HomePage, AboutPage, OrdersPage, ProfilePage, AddressesPage), the rendered output SHALL NOT contain any element with class `dark-mode`, SHALL NOT read `customerThemeMode` from localStorage, and SHALL NOT contain a theme toggle button.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

