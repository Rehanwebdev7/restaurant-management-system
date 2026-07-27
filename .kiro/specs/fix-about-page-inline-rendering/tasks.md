# Implementation Plan: Fix About Page Inline Rendering

## Overview

Convert the About Us page from a standalone routed component to inline rendering within the CustomerLanding component. This involves updating the route config, extending the navigation handler, adding a hero slider with auto-cycling images, and building four rich content sections (Team, Timeline, Awards, Values) with responsive styling.

## Tasks

- [ ] 1. Update route configuration and navigation handler
  - [ ] 1.1 Update LoginRoutes.js to render CustomerLanding for /about route
    - Change `<Route path="/about" element={<AboutPage />} />` to `<Route path="/about" element={<CustomerLanding />} />`
    - Remove the `AboutPage` import statement since it's no longer used in this file
    - _Requirements: 1.1, 1.2, 6.1, 6.2_

  - [ ] 1.2 Add 'about' case to handleNavClick in HomePage.jsx
    - Add `else if (target === 'about')` block that calls `navigate('/about')` and `window.scrollTo({ top: 0, behavior: 'smooth' })`
    - _Requirements: 2.1, 2.2_

- [ ] 2. Implement About page hero slider
  - [ ] 2.1 Add hero slider state and data array in HomePage.jsx
    - Define `aboutHeroSlides` array with 4 slide objects (image, tagline, title, description)
    - Add `activeAboutHeroSlide` state with `useState(0)`
    - Add `useEffect` timer that cycles slides every 6 seconds, only active when `isAboutPage` is true, with cleanup on unmount
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 2.2 Render hero slider JSX in the About page section of HomePage.jsx
    - Replace existing `{isAboutPage && (...)}` block with new hero slider markup using `about-hero-slider` class
    - Apply `info-hero` class pattern consistent with Location and Contact pages
    - Render tagline, title, and description text overlaid on images with crossfade transition via `.hero-slide.active`
    - _Requirements: 3.4, 3.5_

- [ ] 3. Implement rich content sections
  - [ ] 3.1 Add Welcome/Theme Data section in HomePage.jsx
    - Render `theme.aboutUs`, `theme.ourMission`, `theme.ourVision` from ThemeContext
    - Provide hardcoded fallback text when theme values are null/empty
    - Use `animate-fade-in-up` class for scroll entrance animation
    - _Requirements: 4.5, 4.6, 5.3_

  - [ ] 3.2 Add Team section in HomePage.jsx
    - Create static data array with 3-4 team members (name, role, image URL)
    - Render team grid using `about-team-grid` and `about-team-card` classes
    - Apply `var(--grilli-surface-raised)` background and consistent border/padding
    - _Requirements: 4.1, 5.1, 5.2_

  - [ ] 3.3 Add Timeline section in HomePage.jsx
    - Create static data array with 4 chronological milestones (year + description)
    - Render using `about-timeline-section` and `about-timeline-item` classes
    - Use `var(--grilli-gold)` for year accent color
    - _Requirements: 4.2, 5.1_

  - [ ] 3.4 Add Awards section in HomePage.jsx
    - Create static data array with 3-4 awards (icon, title, description)
    - Render using `about-awards-grid` and `about-award-card` classes
    - Style icons with `var(--grilli-gold-glow)` background and `var(--grilli-gold)` color
    - _Requirements: 4.3, 5.1, 5.2_

  - [ ] 3.5 Add Values section in HomePage.jsx
    - Create static data array with 4 values (icon, title, description)
    - Render using `about-values-grid` and `about-value-card` classes
    - Follow same card pattern as existing "Quality First / Customer Focused" cards
    - _Requirements: 4.4, 5.1, 5.2_

- [ ] 4. Checkpoint - Verify component renders
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Add CSS styling for About page sections
  - [ ] 5.1 Append About page hero slider styles to HomePage.grilli.css
    - Add `.about-hero-slider` with relative positioning, 70vh height, min/max constraints
    - Add `.hero-slide` with absolute positioning, full size, crossfade opacity transition (1.2s)
    - Add `.hero-slide.active` with opacity 1
    - Scope all rules under `.grilli-scope`
    - _Requirements: 3.3, 3.5, 5.1_

  - [ ] 5.2 Append About page Team, Timeline, Awards, Values styles to HomePage.grilli.css
    - Add team grid styles (auto-fit columns, 240px min, card with circular image)
    - Add timeline styles (flex layout, year accent, border separators)
    - Add awards grid styles (auto-fit columns, 250px min, icon box)
    - Add values grid styles (matching awards pattern)
    - Use design tokens: `--grilli-surface-raised`, `--grilli-surface-line`, `--grilli-gold`, `--grilli-gold-glow`, `--grilli-gold-hairline`
    - _Requirements: 5.1, 5.2_

  - [ ] 5.3 Append mobile responsive styles for About page to HomePage.grilli.css
    - Add `@media (max-width: 768px)` rules: hero slider to 50vh/350px min, grids to single column, timeline to vertical stack
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All implementation uses React (JSX) with existing project conventions
- No new dependencies required; all styling uses existing CSS custom properties
- Hero slider images use Unsplash URLs (decorative, no error handling needed)
- The deprecated AboutPage component file is intentionally left in the codebase
- Theme data fallback ensures the page works even without backend data
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "5.2", "5.3"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] }
  ]
}
```
