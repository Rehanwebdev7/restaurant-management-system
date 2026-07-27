# Requirements Document

## Introduction

The customer-facing restaurant website currently uses a hardcoded dark "Grilli" theme with fixed colors (#0A0908 backgrounds, #D4A857 gold accents) that ignores the brand colors configured by restaurant owners in the admin panel. This feature rework removes the dark mode entirely and rebuilds the customer website styling to dynamically use the restaurant's configured colors (primaryColor, secondaryColor, tertiaryColor, fontColor, backgroundColor) while maintaining a premium, modern, light-mode restaurant aesthetic.

## Glossary

- **Customer_Website**: The public-facing restaurant website rendered by components in `frontend/src/pages/modules/Customer/` including HomePage, AboutPage, ContactPage, LocationPage, and other customer routes.
- **ThemeService**: The existing service (`frontend/src/services/themeService.js`) that fetches restaurant brand colors from the backend API and applies them as CSS custom properties on the document root.
- **Grilli_Tokens**: The CSS file (`grilli-tokens.css`) that defines design tokens (CSS custom properties) used by the customer website styling.
- **Grilli_Overrides**: The CSS file (`HomePage.grilli.css`) containing 4000+ lines of dark-theme style overrides for customer pages.
- **Brand_Colors**: The set of colors configured by restaurant owners in the admin panel: primaryColor, secondaryColor, tertiaryColor, fontColor, and backgroundColor.
- **CSS_Variables**: CSS custom properties set by ThemeService including `--theme-primary`, `--theme-secondary`, `--theme-tertiary`, `--theme-font-color`, `--theme-background`, and their derived variants.
- **Grilli_Scope**: The CSS class `.grilli-scope` applied to the wrapper of all customer pages to scope customer-specific styles.

## Requirements

### Requirement 1

**User Story:** As a restaurant owner, I want the customer website to display my configured brand colors, so that the website matches my restaurant's identity.

#### Acceptance Criteria

1. WHEN ThemeService applies Brand_Colors, THE Customer_Website SHALL render all accent elements (buttons, links, CTAs) using the primaryColor CSS variable.
2. WHEN ThemeService applies Brand_Colors, THE Customer_Website SHALL render secondary elements (gradients, secondary buttons) using the secondaryColor CSS variable.
3. WHEN ThemeService applies Brand_Colors, THE Customer_Website SHALL render tertiary accents using the tertiaryColor CSS variable.
4. WHEN ThemeService applies Brand_Colors, THE Customer_Website SHALL render body text using the fontColor CSS variable.
5. WHEN ThemeService applies Brand_Colors, THE Customer_Website SHALL render the page background using the backgroundColor CSS variable.
6. THE Customer_Website SHALL NOT contain any hardcoded color values that override the Brand_Colors CSS variables.

### Requirement 2

**User Story:** As a restaurant owner, I want the customer website to always display in light mode, so that the design looks clean and premium regardless of user device settings.

#### Acceptance Criteria

1. THE Customer_Website SHALL render exclusively in light mode without any dark mode option.
2. THE Customer_Website SHALL NOT include a dark mode toggle control in the navigation or anywhere in the UI.
3. THE Customer_Website SHALL NOT reference or use the DarkModeContext for theme switching within customer pages.
4. WHEN a user visits the Customer_Website, THE Customer_Website SHALL display light backgrounds derived from the backgroundColor CSS variable regardless of the user's operating system color scheme preference.

### Requirement 3

**User Story:** As a restaurant owner, I want the dark Grilli theme removed, so that my brand colors are applied without being overridden by hardcoded dark values.

#### Acceptance Criteria

1. THE Grilli_Tokens file SHALL define design tokens that reference CSS_Variables from ThemeService instead of hardcoded dark color values.
2. THE Grilli_Overrides file SHALL be replaced with a light-mode stylesheet that uses CSS_Variables for all color definitions.
3. THE Customer_Website SHALL NOT apply hardcoded dark surface colors (#0A0908, #14110F, #1A1613, #1F1C18) to any element.
4. THE Customer_Website SHALL NOT apply hardcoded gold color values (#D4A857, #E8CFA0, #A88338) to any element.
5. WHEN the Customer_Website renders, THE Grilli_Scope class SHALL apply light backgrounds and dynamic accent colors from CSS_Variables.

### Requirement 4

**User Story:** As a customer, I want the restaurant website to look premium and modern with smooth interactions, so that I have a pleasant browsing experience.

#### Acceptance Criteria

1. THE Customer_Website SHALL use Cormorant Garamond as the display/heading font and Inter as the body font.
2. THE Customer_Website SHALL apply soft box shadows to card elements using subtle, light-appropriate shadow values.
3. THE Customer_Website SHALL apply smooth hover transitions on interactive elements with duration between 200ms and 400ms.
4. THE Customer_Website SHALL apply fade-in animations on section elements as they enter the viewport.
5. THE Customer_Website SHALL maintain consistent spacing using the existing rhythm tokens (section padding, container max-width, gutter values).

### Requirement 5

**User Story:** As a restaurant owner, I want the website to look great with any color combination I choose, so that my brand is properly represented regardless of my color preferences.

#### Acceptance Criteria

1. WHEN a restaurant owner configures a light primaryColor, THE Customer_Website SHALL render text on primary-colored buttons using a dark contrast color.
2. WHEN a restaurant owner configures a dark primaryColor, THE Customer_Website SHALL render text on primary-colored buttons using a white contrast color.
3. THE Customer_Website SHALL derive hover states from the primaryColor by applying consistent lightening or darkening transformations.
4. THE Customer_Website SHALL derive subtle background tints from the primaryColor at low opacity for section backgrounds.
5. IF Brand_Colors are not available from the backend, THEN THE Customer_Website SHALL render using the ThemeService DEFAULT_THEME fallback colors.

### Requirement 6

**User Story:** As a developer, I want the theming changes scoped only to customer pages, so that the admin panel and other modules remain unaffected.

#### Acceptance Criteria

1. THE Customer_Website styling changes SHALL be scoped under the Grilli_Scope class to prevent style leakage to admin, dashboard, or staff pages.
2. THE Customer_Website theming rework SHALL NOT modify any files outside the Customer module directory and customer style files.
3. THE Customer_Website SHALL preserve all existing functionality (cart, wishlist, menu browsing, reservation, ordering) with only visual appearance changes.

### Requirement 7

**User Story:** As a customer, I want the inline dark-mode styles removed from the HomePage component, so that the page renders with clean, consistent light styling from external stylesheets.

#### Acceptance Criteria

1. THE HomePage component SHALL NOT contain inline `<style>` blocks that override CSS variables with hardcoded dark color values.
2. THE HomePage component SHALL NOT contain a `themeMode` state variable or dark/light mode toggling logic.
3. THE HomePage component SHALL apply the Grilli_Scope class and rely on external stylesheets for all visual styling.
