# Requirements Document

## Introduction

Fix the About Us page on the customer-facing website so that it renders inline within the `CustomerLanding` component (consistent with Location, Contact, Gallery, and other pages) instead of being routed to a separate `AboutPage` component. Additionally, enhance the About page with a hero slider featuring rotating images and rich premium content sections (Team, Timeline, Awards, Values), all in light mode consistent with the existing Location/Contact page styling. The page continues to integrate existing theme data (aboutUs, ourMission, ourVision) from the backend.

## Glossary

- **CustomerLanding**: The main React component (`HomePage.jsx`) that renders all customer-facing pages inline based on the current URL path, including Home, Menu, Gallery, Location, Contact, and now About.
- **AboutPage**: The deprecated standalone React component (`AboutPage.jsx`) previously used to render the About Us page as a separate route.
- **LoginRoutes**: The React Router configuration file (`LoginRoutes.js`) defining all public/customer-facing routes and their component mappings.
- **handleNavClick**: A navigation handler function within CustomerLanding that programmatically navigates to different page sections based on a target string parameter.
- **Hero_Slider**: An automatic image slideshow section at the top of a page that cycles through multiple images at timed intervals, consistent with the home page hero slideshow pattern.
- **Theme_Data**: Backend-provided restaurant theming information including `aboutUs`, `ourMission`, and `ourVision` text fields, accessed via the ThemeContext.
- **Info_Hero**: The existing CSS class pattern used for page hero sections on Location and Contact pages within CustomerLanding, providing a consistent dark-overlay hero banner style.

## Requirements

### Requirement 1: Route Configuration

**User Story:** As a customer, I want the About Us page to load within the same layout as Location and Contact pages, so that navigation feels consistent and seamless across the website.

#### Acceptance Criteria

1. WHEN a customer navigates to the `/about` URL path, THE LoginRoutes SHALL render the CustomerLanding component instead of the AboutPage component.
2. THE LoginRoutes SHALL retain the import of AboutPage only if other references depend on it, otherwise THE LoginRoutes SHALL remove the unused import.

### Requirement 2: Navigation Handler

**User Story:** As a customer, I want clicking "About Us" in the navigation bar to route me to the About page correctly, so that the navigation link works as expected.

#### Acceptance Criteria

1. WHEN the handleNavClick function receives the target value 'about', THE CustomerLanding SHALL navigate to the '/about' route and scroll the window to the top with smooth behavior.
2. THE CustomerLanding SHALL highlight the "ABOUT US" navigation link as active when the current path is '/about'.

### Requirement 3: Hero Slider

**User Story:** As a customer, I want to see an engaging rotating image slideshow at the top of the About page, so that the page feels visually premium and dynamic.

#### Acceptance Criteria

1. WHEN the About page is rendered, THE CustomerLanding SHALL display a hero slider section containing exactly 4 rotating background images.
2. THE Hero_Slider SHALL automatically transition between images at a timed interval between 5 and 8 seconds.
3. THE Hero_Slider SHALL use the same crossfade animation pattern as the existing home page hero slideshow.
4. THE Hero_Slider SHALL display a tagline, title, and descriptive text overlaid on the images, with content appropriate to the About Us context (restaurant story, heritage).
5. THE Hero_Slider SHALL use the Info_Hero CSS class pattern consistent with the Location and Contact page hero sections.

### Requirement 4: Rich Content Sections

**User Story:** As a customer, I want to see detailed information about the restaurant's team, history, awards, and values on the About page, so that I feel connected to the brand.

#### Acceptance Criteria

1. WHEN the About page is rendered, THE CustomerLanding SHALL display a Team section showcasing key restaurant personnel with names, roles, and images.
2. WHEN the About page is rendered, THE CustomerLanding SHALL display a Timeline section showing the restaurant's history with at least 3 milestone entries ordered chronologically.
3. WHEN the About page is rendered, THE CustomerLanding SHALL display an Awards section listing recognitions or certifications the restaurant has received.
4. WHEN the About page is rendered, THE CustomerLanding SHALL display a Values section presenting the restaurant's core principles with icon and description for each value.
5. THE CustomerLanding SHALL continue to display the existing Theme_Data fields (aboutUs, ourMission, ourVision) from the backend when available.
6. IF the Theme_Data fields are empty or not provided by the backend, THEN THE CustomerLanding SHALL display appropriate default placeholder content for the About page sections.

### Requirement 5: Light Mode Styling

**User Story:** As a customer, I want the About page to use a consistent visual style with the Location and Contact pages, so that the website feels cohesive.

#### Acceptance Criteria

1. THE CustomerLanding About page sections SHALL use the same CSS class patterns and design tokens (grilli-surface-raised, grilli-text-ivory, grilli-text-mist, grilli-gold) as the existing Location and Contact page sections.
2. THE CustomerLanding About page content cards SHALL use the same border-radius, padding, and border styling as the existing info cards on the Location and Contact pages.
3. THE CustomerLanding About page sections SHALL apply the same motion-reveal scroll animation pattern used by other CustomerLanding page sections.

### Requirement 6: Deprecated Component Handling

**User Story:** As a developer, I want the old AboutPage component to be clearly marked as deprecated, so that the team knows to use the inline rendering approach.

#### Acceptance Criteria

1. WHEN the `/about` route uses CustomerLanding, THE LoginRoutes SHALL no longer reference the AboutPage component for the `/about` path.
2. THE AboutPage component file SHALL remain in the codebase (not deleted) to avoid breaking other potential references, but THE LoginRoutes SHALL not route to the AboutPage component for public customer access.

### Requirement 7: Mobile Responsiveness

**User Story:** As a customer using a mobile device, I want the About page content to display correctly on smaller screens, so that I can read about the restaurant on any device.

#### Acceptance Criteria

1. WHEN the viewport width is 768px or less, THE CustomerLanding About page sections SHALL stack vertically and adjust font sizes for readability.
2. THE Hero_Slider SHALL maintain its full-width display and image aspect ratio on mobile viewports.
3. THE Team, Timeline, Awards, and Values sections SHALL reflow from multi-column to single-column layout on mobile viewports.
