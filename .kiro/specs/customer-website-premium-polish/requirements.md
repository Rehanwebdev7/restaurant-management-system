# Requirements Document

## Introduction

Premium visual polish for the customer-facing restaurant website. This spec covers scroll-triggered animations, sticky header behavior, hero section improvements, card hover effects, automatic color contrast correction in ThemeService, a CTA banner component, and general CSS consistency fixes. All changes are scoped exclusively to customer pages (`.grilli-scope`) and do not affect admin, staff, branch, or superadmin interfaces.

## Glossary

- **Customer_Page**: Any page rendered under `frontend/src/pages/modules/Customer/` wrapped in the `.grilli-scope` CSS class.
- **Animation_System**: The JavaScript module using Intersection Observer API to trigger CSS animations on elements as they scroll into the viewport.
- **Sticky_Header**: The page header element that remains fixed at the top of the viewport after the user scrolls past a defined threshold.
- **Hero_Section**: The full-width banner area at the top of the HomePage containing a background image, overlay, heading text, and CTA button.
- **Card_Component**: A UI element displaying content (menu item, feature, testimonial) inside a bordered rectangular container with image, title, and description.
- **ThemeService**: The JavaScript service at `frontend/src/services/themeService.js` responsible for fetching, mapping, and applying theme CSS variables.
- **Contrast_Ratio**: The WCAG-defined luminance ratio between foreground text and background color, where 4.5:1 is the minimum for normal text (AA level).
- **CTA_Banner**: A promotional section positioned before the footer containing a gradient background, dynamic text from theme data, and two action buttons.
- **Intersection_Observer**: A browser API that asynchronously observes changes in the intersection of a target element with a viewport or ancestor element.

## Requirements

### Requirement 1: Scroll-Triggered Animations

**User Story:** As a customer, I want page elements to animate smoothly into view as I scroll, so that the website feels modern and engaging.

#### Acceptance Criteria

1. WHEN a Customer_Page element with a scroll-animation class enters the viewport, THE Animation_System SHALL apply the designated CSS entrance animation to that element.
2. THE Animation_System SHALL use the Intersection_Observer API to detect element visibility.
3. WHEN an element has already been animated once during the current page session, THE Animation_System SHALL not re-trigger the animation on subsequent scrolls.
4. THE Animation_System SHALL observe elements with a threshold of at least 0.1 (10% visible) before triggering the animation.
5. THE Animation_System SHALL apply animations only to elements within `.grilli-scope` containers.
6. WHEN JavaScript is disabled or Intersection_Observer is unavailable, THE Animation_System SHALL render all elements in their final visible state without animation.

### Requirement 2: Sticky Header with Scroll Effect

**User Story:** As a customer, I want the navigation header to stay visible as I scroll down and visually adapt to indicate I have scrolled, so that navigation is always accessible.

#### Acceptance Criteria

1. WHEN the user scrolls past 50 pixels from the top of a Customer_Page, THE Sticky_Header SHALL apply a solid background color derived from the theme.
2. WHEN the user scrolls past 50 pixels from the top of a Customer_Page, THE Sticky_Header SHALL display a box-shadow for visual separation from page content.
3. WHEN the user scrolls past 50 pixels from the top of a Customer_Page, THE Sticky_Header SHALL reduce its vertical padding to create a compact appearance.
4. WHILE the page scroll position is at or below 50 pixels, THE Sticky_Header SHALL display with its default transparent or semi-transparent state.
5. THE Sticky_Header SHALL transition between default and scrolled states using a CSS transition duration between 200ms and 400ms.
6. THE Sticky_Header SHALL remain fixed at the top of the viewport with a z-index sufficient to overlay page content.

### Requirement 3: Hero Section Fix

**User Story:** As a customer, I want the hero banner to have readable text and a clear call-to-action button, so that I can immediately understand the restaurant's value proposition.

#### Acceptance Criteria

1. THE Hero_Section SHALL display a dark overlay on the background image with opacity between 0.5 and 0.7 to ensure text contrast.
2. THE Hero_Section heading text SHALL have a color contrast ratio of at least 4.5:1 against the overlay background.
3. THE Hero_Section CTA button SHALL use a solid, opaque background color derived from `--grilli-gold` (theme primary).
4. THE Hero_Section CTA button text SHALL use `--grilli-text-inverse` to ensure readability against the button background.
5. IF the Hero_Section background image fails to load, THEN THE Hero_Section SHALL display a solid gradient fallback background using theme primary and secondary colors.
6. THE Hero_Section CTA button SHALL have a minimum touch target size of 44x44 pixels.

### Requirement 4: Card Hover Effects

**User Story:** As a customer, I want interactive feedback when hovering over cards, so that I can tell which elements are clickable and the experience feels polished.

#### Acceptance Criteria

1. WHEN the user hovers over a Card_Component, THE Card_Component SHALL translate upward by 4 to 8 pixels (lift effect).
2. WHEN the user hovers over a Card_Component, THE Card_Component SHALL increase its box-shadow depth to indicate elevation.
3. WHEN the user hovers over a Card_Component image, THE Card_Component SHALL scale the image to between 1.03 and 1.08 with overflow hidden.
4. WHEN the user hovers over a Card_Component, THE Card_Component SHALL display an accent-colored border (using `--grilli-gold`) on the top or left edge.
5. WHEN the user hovers over a Card_Component containing an icon, THE Card_Component SHALL scale the icon to between 1.1 and 1.2.
6. THE Card_Component hover transitions SHALL use a duration between 200ms and 400ms with an easing function.
7. THE Card_Component SHALL apply hover effects only on devices that support hover (using `@media (hover: hover)`).

### Requirement 5: Color Contrast Auto-Fix in ThemeService

**User Story:** As a restaurant owner, I want the system to automatically correct low-contrast color combinations, so that my website remains readable regardless of the colors I choose in the admin panel.

#### Acceptance Criteria

1. WHEN ThemeService applies theme CSS variables, THE ThemeService SHALL compute the contrast ratio between the primary color and the page background color.
2. IF the computed contrast ratio between primary color and page background is below 4.5:1, THEN THE ThemeService SHALL progressively darken the primary color until the ratio reaches or exceeds 4.5:1.
3. THE ThemeService SHALL store the adjusted primary color in a CSS variable named `--theme-primary-accessible` for use by text and interactive elements that require AA compliance.
4. THE ThemeService SHALL preserve the original unadjusted primary color in `--theme-primary` for decorative uses (backgrounds, borders, fills).
5. THE ThemeService SHALL apply the contrast auto-fix only to customer pages and not affect admin or staff interfaces.
6. WHEN the primary color already meets the 4.5:1 contrast ratio, THE ThemeService SHALL set `--theme-primary-accessible` equal to `--theme-primary` without modification.

### Requirement 6: CTA Banner Before Footer

**User Story:** As a restaurant owner, I want a promotional banner above the footer encouraging customers to take action, so that conversion rates improve.

#### Acceptance Criteria

1. THE CTA_Banner SHALL be positioned immediately before the footer section on all Customer_Pages that include a footer.
2. THE CTA_Banner SHALL display a gradient background using theme primary and secondary colors.
3. THE CTA_Banner SHALL display a heading populated with the restaurant name from ThemeService.
4. THE CTA_Banner SHALL display a subheading with a configurable promotional message.
5. THE CTA_Banner SHALL contain two action buttons: one primary button linking to the menu or ordering page and one secondary button linking to the reservation or contact page.
6. THE CTA_Banner primary button SHALL use a solid filled style with `--grilli-gold` background and `--grilli-text-inverse` text color.
7. THE CTA_Banner secondary button SHALL use an outlined style with a border color of `--grilli-text-inverse` and transparent background.
8. THE CTA_Banner text elements SHALL have a minimum contrast ratio of 4.5:1 against the gradient background.

### Requirement 7: Overall CSS Polish

**User Story:** As a customer, I want a visually consistent and polished experience across all pages, so that the restaurant appears professional and trustworthy.

#### Acceptance Criteria

1. THE Customer_Page SHALL use consistent box-shadow values across all card and elevated surface elements (matching `--grilli-shadow-card` and `--grilli-shadow-lift` tokens).
2. THE Customer_Page SHALL apply transition properties to all interactive button elements with a duration between 200ms and 300ms.
3. THE Customer_Page SHALL ensure all text elements have a minimum contrast ratio of 4.5:1 against their immediate background.
4. THE Customer_Page SHALL not contain any hardcoded dark-theme color values (such as #0A0908, #14110F, #1A1613, #1F1C18) in customer stylesheets.
5. IF a button changes visual state on hover or focus, THEN THE Customer_Page SHALL transition background-color, transform, and box-shadow properties smoothly.
6. THE Customer_Page SHALL scope all new CSS rules under `.grilli-scope` to prevent style leakage to admin or staff pages.
7. THE Customer_Page focus indicators on interactive elements SHALL be visible with at least a 2px outline using `--grilli-gold` color for keyboard accessibility.
