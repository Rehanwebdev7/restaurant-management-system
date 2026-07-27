# Design Document: Fix About Page Inline Rendering

## Overview

This design converts the About Us page from a standalone `AboutPage` component to an inline section within the `CustomerLanding` component, matching the existing pattern used by Location, Contact, Gallery, and other pages. The change involves route configuration, navigation handling, a new hero slider, and four rich content sections (Team, Timeline, Awards, Values).

## Architecture

The implementation follows the established page-rendering pattern in `CustomerLanding`:

1. **Route change**: `LoginRoutes.js` maps `/about` to `<CustomerLanding />` instead of `<AboutPage />`
2. **Path detection**: `isAboutPage` boolean (already exists) drives conditional rendering
3. **Navigation**: `handleNavClick('about')` navigates to `/about` with scroll-to-top
4. **Hero slider**: New `aboutHeroSlides` array + `activeAboutHeroSlide` state + auto-cycling `useEffect` timer
5. **Content sections**: Rendered inside the `{isAboutPage && (...)}` conditional block

## Components & Changes

### 1. `frontend/src/routes/LoginRoutes.js`

```jsx
// Change the /about route from:
<Route path="/about" element={<AboutPage />} />

// To:
<Route path="/about" element={<CustomerLanding />} />
```

Remove the `AboutPage` import since it's no longer used in routing.

### 2. `frontend/src/pages/modules/Customer/HomePage.jsx`

#### Navigation Handler Addition

Add `'about'` case to `handleNavClick`:

```jsx
} else if (target === 'about') {
  navigate('/about');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

#### About Hero Slider State & Data

```jsx
// About page hero slides — 4 images, auto-cycle 6s
const [activeAboutHeroSlide, setActiveAboutHeroSlide] = useState(0);
const aboutHeroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1600&q=80',
    tagline: 'OUR STORY',
    title: 'WHERE TRADITION MEETS CRAFT',
    description: 'A DECADE OF CULINARY EXCELLENCE AND WARM HOSPITALITY.',
  },
  {
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80',
    tagline: 'OUR PEOPLE',
    title: 'THE HEART BEHIND EVERY DISH',
    description: 'PASSIONATE CHEFS. DEDICATED TEAM. GENUINE CARE.',
  },
  {
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
    tagline: 'OUR VALUES',
    title: 'ROOTED IN QUALITY AND COMMUNITY',
    description: 'FRESH INGREDIENTS. HONEST COOKING. WELCOMING SPIRIT.',
  },
  {
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
    tagline: 'OUR JOURNEY',
    title: 'FROM HUMBLE BEGINNINGS TO YOUR TABLE',
    description: 'EVERY PLATE CARRIES A STORY WORTH SAVORING.',
  },
];
```

#### useEffect Timer

```jsx
useEffect(() => {
  if (!isAboutPage) return;
  const timer = setInterval(() => {
    setActiveAboutHeroSlide((prev) => (prev + 1) % aboutHeroSlides.length);
  }, 6000);
  return () => clearInterval(timer);
}, [isAboutPage]);
```

#### About Page Section Structure (JSX)

Replace the existing `{isAboutPage && (...)}` block with:

1. **Hero Slider** — uses `info-hero` pattern with rotating images (crossfade via `.hero-slide.active`)
2. **Welcome / Theme Data** — renders `theme.aboutUs`, `theme.ourMission`, `theme.ourVision` with fallback defaults
3. **Team Section** — 3-4 team member cards in a grid with image, name, role
4. **Timeline Section** — 4 chronological milestone entries (year + description)
5. **Awards Section** — 3-4 award cards with icon and text
6. **Values Section** — 4 value cards using same pattern as existing "Quality First / Customer Focused / Made With Love / Years of Experience" cards

All sections use:
- `animate-fade-in-up` for scroll entrance
- `var(--grilli-surface-raised)` background for cards
- `var(--grilli-gold)` accent color
- `var(--grilli-text-ivory)` / `var(--grilli-text-mist)` for text hierarchy

### 3. `frontend/src/styles/HomePage.grilli.css`

New CSS rules appended (scoped under `.grilli-scope`):

```css
/* =============================================================
   ABOUT PAGE — Hero Slider
   ============================================================= */
.grilli-scope .about-hero-slider {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 450px;
  max-height: 700px;
  overflow: hidden;
}

.grilli-scope .about-hero-slider .hero-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1.2s ease;
}

.grilli-scope .about-hero-slider .hero-slide.active {
  opacity: 1;
}

/* =============================================================
   ABOUT PAGE — Team Grid
   ============================================================= */
.grilli-scope .about-team-section {
  padding: 4rem clamp(20px, 5vw, 80px);
  max-width: 1100px;
  margin: 0 auto;
}

.grilli-scope .about-team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.grilli-scope .about-team-card {
  background: var(--grilli-surface-raised);
  border: 1px solid var(--grilli-surface-line);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.grilli-scope .about-team-card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 2px solid var(--grilli-gold-hairline);
}

/* =============================================================
   ABOUT PAGE — Timeline
   ============================================================= */
.grilli-scope .about-timeline-section {
  padding: 4rem clamp(20px, 5vw, 80px);
  max-width: 900px;
  margin: 0 auto;
}

.grilli-scope .about-timeline-item {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--grilli-surface-line);
}

.grilli-scope .about-timeline-item:last-child {
  border-bottom: none;
}

.grilli-scope .about-timeline-year {
  font-family: var(--grilli-font-display);
  font-size: 1.5rem;
  color: var(--grilli-gold);
  min-width: 80px;
  flex-shrink: 0;
}

/* =============================================================
   ABOUT PAGE — Awards
   ============================================================= */
.grilli-scope .about-awards-section {
  padding: 4rem clamp(20px, 5vw, 80px);
  max-width: 1100px;
  margin: 0 auto;
}

.grilli-scope .about-awards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.grilli-scope .about-award-card {
  background: var(--grilli-surface-raised);
  border: 1px solid var(--grilli-surface-line);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.grilli-scope .about-award-card .award-icon {
  width: 56px;
  height: 56px;
  background: var(--grilli-gold-glow);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: var(--grilli-gold);
  font-size: 1.5rem;
}

/* =============================================================
   ABOUT PAGE — Values
   ============================================================= */
.grilli-scope .about-values-section {
  padding: 4rem clamp(20px, 5vw, 80px);
  max-width: 1100px;
  margin: 0 auto;
}

.grilli-scope .about-values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.grilli-scope .about-value-card {
  background: var(--grilli-surface-raised);
  border: 1px solid var(--grilli-surface-line);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.grilli-scope .about-value-card .value-icon {
  width: 56px;
  height: 56px;
  background: var(--grilli-gold-glow);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: var(--grilli-gold);
  font-size: 1.5rem;
}

/* =============================================================
   ABOUT PAGE — Mobile Responsive (768px)
   ============================================================= */
@media (max-width: 768px) {
  .grilli-scope .about-hero-slider {
    height: 50vh;
    min-height: 350px;
  }

  .grilli-scope .about-team-grid,
  .grilli-scope .about-awards-grid,
  .grilli-scope .about-values-grid {
    grid-template-columns: 1fr;
  }

  .grilli-scope .about-timeline-item {
    flex-direction: column;
    gap: 0.5rem;
  }

  .grilli-scope .about-timeline-year {
    min-width: unset;
  }
}
```

## Data Flow

```
ThemeContext (restaurantName, aboutUs, ourMission, ourVision)
        │
        ▼
CustomerLanding (isAboutPage === true)
        │
        ├──▶ About Hero Slider (aboutHeroSlides + activeAboutHeroSlide)
        ├──▶ Welcome Section (theme.aboutUs fallback text)
        ├──▶ Mission/Vision Cards (theme.ourMission, theme.ourVision)
        ├──▶ Team Section (static data array)
        ├──▶ Timeline Section (static data array, chronological)
        ├──▶ Awards Section (static data array)
        └──▶ Values Section (static data array)
```

## Error Handling

- If `theme.aboutUs` / `theme.ourMission` / `theme.ourVision` are null/empty, render hardcoded default text
- Hero slider images use external Unsplash URLs; no `onError` handler needed (decorative backgrounds)
- Timer cleanup via `useEffect` return prevents memory leaks on route change

## Interfaces

No new API endpoints required. All data comes from existing `ThemeContext` or is statically defined within the component.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme data rendering fidelity

*For any* non-empty string provided as `theme.aboutUs`, `theme.ourMission`, or `theme.ourVision` by the ThemeContext, when the About page is rendered, the page content SHALL contain that exact string in the DOM output.

**Validates: Requirements 4.5**
