# Design Document: Customer Website Premium Polish

## Architecture Overview

This feature adds visual polish exclusively to the customer-facing pages (`.grilli-scope`). All changes are contained within three areas:

1. **HomePage.jsx** — JavaScript logic for scroll animations and sticky header behavior
2. **themeService.js** — New `ensureContrast()` helper for automatic WCAG AA color correction
3. **HomePage.grilli.css** — CSS-only rules for hero fix, card hover effects, CTA banner, and general polish

No new files are created. No utility modules are added. All implementations go into existing files.

## Components

### 1. Scroll Animation System (HomePage.jsx)

A `useEffect` hook attaches an `IntersectionObserver` to elements matching scroll-animation selectors within `.grilli-scope`. When an element intersects at threshold ≥ 0.15 with rootMargin `"-50px"`, it receives the `.is-visible` class. The observer immediately unobserves the element after triggering (fire-once behavior).

```javascript
// In HomePage.jsx — CustomerLanding component
useEffect(() => {
  if (typeof IntersectionObserver === 'undefined') return;

  const scope = document.querySelector('.grilli-scope');
  if (!scope) return;

  const elements = scope.querySelectorAll('[data-animate]');
  if (elements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '-50px' }
  );

  elements.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}, [currentPath]);
```

Elements start with:
```css
[data-animate] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

[data-animate].is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

Graceful degradation: A `<noscript>` style block or CSS `@supports` fallback ensures elements render visible when JS is disabled.

### 2. Sticky Header (HomePage.jsx)

A scroll event listener in `useEffect` adds/removes `.header-scrolled` class on the header element based on `window.scrollY > 50`.

```javascript
useEffect(() => {
  const header = document.querySelector('.grilli-scope .landing-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check

  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

CSS handles the visual change:
```css
.grilli-scope .landing-header {
  position: fixed;
  top: 0;
  z-index: 1000;
  transition: background-color 0.3s ease, padding 0.3s ease, box-shadow 0.3s ease;
}

.grilli-scope .landing-header.header-scrolled {
  background-color: var(--theme-primary-dark, #1a1a2e);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  padding-top: 8px;
  padding-bottom: 8px;
}
```

### 3. Hero Section Fix (CSS-only)

Stronger overlay gradient and solid CTA button:
```css
.grilli-scope .hero-bg-overlay {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

.grilli-scope .btn-explore-menu {
  background-color: var(--grilli-gold, var(--theme-primary));
  color: var(--grilli-text-inverse, #ffffff);
  border: none;
  min-width: 44px;
  min-height: 44px;
  padding: 14px 32px;
}
```

Gradient fallback on image load failure uses CSS:
```css
.grilli-scope .luxury-hero {
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
}
```

### 4. Card Hover Effects (CSS-only)

All hover effects wrapped in `@media (hover: hover)` to avoid sticky-hover on touch devices:

```css
@media (hover: hover) {
  .grilli-scope .heritage-showcase-card:hover,
  .grilli-scope .service-card-lux:hover,
  .grilli-scope .our-strength-card:hover,
  .grilli-scope .filtered-item-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--grilli-shadow-lift, 0 12px 40px rgba(0, 0, 0, 0.15));
    border-top: 3px solid var(--grilli-gold, var(--theme-primary));
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }

  .grilli-scope .heritage-showcase-card:hover img,
  .grilli-scope .filtered-item-card:hover .filtered-item-img {
    transform: scale(1.05);
  }

  .grilli-scope .our-strength-card:hover .our-strength-icon svg,
  .grilli-scope .service-card-lux:hover .service-icon-wrapper i {
    transform: scale(1.15);
  }
}
```

### 5. ThemeService — ensureContrast() Helper

Added to `themeService.js`. Uses the existing `getLuminance()` function to compute WCAG contrast ratio and progressively darkens the primary color until AA compliance is met.

```javascript
/**
 * Compute WCAG contrast ratio between two hex colors.
 * @returns {number} Contrast ratio (1 to 21)
 */
const getContrastRatio = (hex1, hex2) => {
  const lum1 = getLuminance(normalizeHex(hex1));
  const lum2 = getLuminance(normalizeHex(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Progressively darken a color until it meets 4.5:1 contrast against background.
 * Returns the original color if it already meets the threshold.
 * @param {string} foreground - Hex color of text/interactive element
 * @param {string} background - Hex color of the background
 * @param {number} minRatio - Minimum contrast ratio (default 4.5 for AA)
 * @returns {string} Adjusted hex color meeting contrast requirement
 */
export const ensureContrast = (foreground, background, minRatio = 4.5) => {
  let fg = normalizeHex(foreground);
  const bg = normalizeHex(background);

  let ratio = getContrastRatio(fg, bg);
  if (ratio >= minRatio) return fg;

  // Progressively darken in 5% steps (max 20 iterations to avoid infinite loop)
  for (let i = 0; i < 20 && ratio < minRatio; i++) {
    fg = darkenHex(fg, 8);
    ratio = getContrastRatio(fg, bg);
  }

  return fg;
};
```

Integration in `applyThemeToCSS`:
```javascript
// After setting --theme-primary, compute accessible variant
const pageBg = theme.backgroundColor || '#f8fafc';
const accessiblePrimary = ensureContrast(primary, pageBg, 4.5);
root.style.setProperty('--theme-primary-accessible', accessiblePrimary);
```

### 6. CTA Banner Component (JSX in HomePage.jsx)

Rendered immediately before the footer in the JSX tree:

```jsx
{/* CTA Banner — before footer */}
<section className="grilli-cta-banner">
  <div className="grilli-cta-banner-inner">
    <h2 className="grilli-cta-heading">
      Visit {restaurantName} Today
    </h2>
    <p className="grilli-cta-subheading">
      Experience unforgettable flavors and warm hospitality
    </p>
    <div className="grilli-cta-actions">
      <button className="grilli-cta-primary" onClick={() => navigate('/menu')}>
        Explore Menu
      </button>
      <button className="grilli-cta-secondary" onClick={() => navigate('/contact')}>
        Reserve a Table
      </button>
    </div>
  </div>
</section>
```

CSS:
```css
.grilli-scope .grilli-cta-banner {
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
  padding: 64px 24px;
  text-align: center;
}

.grilli-scope .grilli-cta-primary {
  background-color: var(--grilli-gold, var(--theme-primary-accessible));
  color: var(--grilli-text-inverse, #ffffff);
  border: none;
  padding: 14px 32px;
  border-radius: 6px;
  font-weight: 600;
  min-height: 44px;
}

.grilli-scope .grilli-cta-secondary {
  background: transparent;
  color: var(--grilli-text-inverse, #ffffff);
  border: 2px solid var(--grilli-text-inverse, #ffffff);
  padding: 14px 32px;
  border-radius: 6px;
  font-weight: 600;
  min-height: 44px;
}
```

### 7. Overall CSS Polish (HomePage.grilli.css)

Final rules appended:
- Consistent shadow tokens: `--grilli-shadow-card` and `--grilli-shadow-lift` applied to all elevated surfaces
- Button transitions: `transition: background-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease`
- Focus indicators: `:focus-visible { outline: 2px solid var(--grilli-gold); outline-offset: 2px; }`
- All rules scoped under `.grilli-scope`
- No hardcoded dark-theme hex values

## Interfaces

### ensureContrast(foreground, background, minRatio?)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| foreground | string | — | Hex color to adjust |
| background | string | — | Hex color of the surface behind |
| minRatio | number | 4.5 | Minimum WCAG contrast ratio |
| **Returns** | string | — | Hex color meeting contrast requirement |

### getContrastRatio(hex1, hex2)

| Parameter | Type | Description |
|-----------|------|-------------|
| hex1 | string | First hex color |
| hex2 | string | Second hex color |
| **Returns** | number | WCAG contrast ratio (1–21) |

## Data Model

No new data models are introduced. The feature operates exclusively on existing theme data (`getCurrentTheme()`) and DOM elements.

### New CSS Custom Properties

| Variable | Source | Description |
|----------|--------|-------------|
| `--theme-primary-accessible` | Computed by ensureContrast() | AA-compliant variant of primary color |
| `--grilli-shadow-card` | Static CSS token | Consistent card shadow |
| `--grilli-shadow-lift` | Static CSS token | Elevated hover shadow |
| `--grilli-gold` | Alias for theme primary | Used by CTA and accent elements |
| `--grilli-text-inverse` | Computed or static | Text color for dark backgrounds |

## Error Handling

| Scenario | Handling |
|----------|----------|
| IntersectionObserver unavailable | Elements render in final visible state (CSS fallback) |
| Hero background image fails to load | CSS gradient fallback using theme colors |
| Theme primary color undefined | Falls back to DEFAULT_THEME.primary (`#667eea`) |
| ensureContrast infinite loop risk | Max 20 iterations with 8% darkening steps |
| Scroll listener on unmounted component | Cleanup in useEffect return |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Animation fires exactly once per element

*For any* element within `.grilli-scope` that has a scroll-animation attribute, once the animation has been triggered (`.is-visible` class added), subsequent intersection events on the same element SHALL NOT remove the class or re-trigger the animation.

**Validates: Requirements 1.3**

### Property 2: Animation scoping to grilli-scope

*For any* element that has a scroll-animation attribute but exists outside a `.grilli-scope` container, the Animation System SHALL NOT observe or animate that element.

**Validates: Requirements 1.5**

### Property 3: Sticky header state is determined by scroll position

*For any* scroll position value `scrollY` on a Customer Page, the header element has the `.header-scrolled` class if and only if `scrollY > 50`. Equivalently: `hasScrolledClass === (scrollY > 50)`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: ensureContrast always produces AA-compliant output

*For any* valid hex color pair (foreground, background), the output of `ensureContrast(foreground, background, 4.5)` SHALL have a WCAG contrast ratio of at least 4.5:1 against the given background color.

**Validates: Requirements 5.1, 5.2, 5.6**

### Property 5: Original primary color is preserved

*For any* theme with a primary color, after `applyThemeToCSS` executes, the CSS variable `--theme-primary` SHALL equal the original primary color input (not the contrast-adjusted variant).

**Validates: Requirements 5.4**

### Property 6: CTA banner heading contains restaurant name

*For any* restaurant name value returned by `getCurrentTheme().restaurantName`, the CTA banner heading element SHALL contain that name string as part of its text content.

**Validates: Requirements 6.3**

### Property 7: No hardcoded dark-theme colors in customer stylesheets

*For any* CSS rule within customer-scoped stylesheets (`HomePage.grilli.css`, `grilli-tokens.css`), the rule SHALL NOT contain any of the following hex values: `#0A0908`, `#14110F`, `#1A1613`, `#1F1C18` (case-insensitive).

**Validates: Requirements 7.4**

### Property 8: All new CSS rules are scoped under .grilli-scope

*For any* new CSS rule added as part of this feature, the selector SHALL include `.grilli-scope` as an ancestor or compound selector to prevent style leakage to admin, staff, branch, or superadmin interfaces.

**Validates: Requirements 7.6**
