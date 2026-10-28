# shell-landmarks-and-focus Specification

## Purpose

Defines the landmark structure, skip link, heading hierarchy, focus management on navigation and live-region roles that every routed page inherits from the desktop and mobile app shells, so keyboard and screen-reader users can reach and orient in page content without walking the whole shell.

## Requirements

### Requirement: Routed page content is a main landmark

Both the desktop and the mobile shell SHALL render the routed page inside exactly one `main` landmark, and the global navigation SHALL be outside it. The account-setup shell keeps its existing `main`.

#### Scenario: Desktop landmark

- **WHEN** any page renders in the desktop shell
- **THEN** the page content is inside one `main` landmark and the primary navigation rail and section menu are outside it

#### Scenario: Mobile landmark

- **WHEN** any page renders in the mobile shell
- **THEN** the page content is inside one `main` landmark and the header and bottom navigation are outside it

### Requirement: The header logo links home when signed in

For a signed-in user, the app logo in the desktop top bar (with the app name beside it) and in the mobile header SHALL be a link to `/home` with the accessible name "Home" (localized). For a signed-out visitor it SHALL NOT be a link.

#### Scenario: Signed-in logo click

- **GIVEN** a signed-in user on `/plan`
- **WHEN** they activate the header logo
- **THEN** the app navigates to `/home`

#### Scenario: Signed-out logo

- **WHEN** a signed-out visitor views the shell
- **THEN** the logo is not a link

### Requirement: A skip link is the first focusable element

Each shell SHALL render a localized "Skip to content" link as the first element in tab order. It SHALL be visually hidden until focused and, when activated, SHALL move focus into the `main` landmark.

#### Scenario: Keyboard user skips the shell

- **WHEN** a keyboard user presses Tab once on a freshly loaded page and activates the focused link
- **THEN** the link was visible while focused and focus is now inside the `main` landmark, before any navigation item

#### Scenario: Pointer users do not see it

- **WHEN** the page renders and nothing is focused
- **THEN** the skip link is not visible and takes no layout space

### Requirement: Focus moves to the page heading after navigation

After a client-side route change the shell SHALL move focus to the page's heading (the shell-rendered `h1`), without scrolling the page away from the top. Initial document load SHALL NOT move focus.

#### Scenario: Sidebar navigation

- **WHEN** a user activates a navigation link and the new route renders
- **THEN** focus is on the new page's `h1`, the heading is announced by a screen reader, and the viewport is at the top of the new page

#### Scenario: Initial load

- **WHEN** the document first loads on any route
- **THEN** focus stays on the document body

#### Scenario: Query-only change

- **WHEN** only the search parameters of the current route change (filters, tabs within a page)
- **THEN** focus is not moved

### Requirement: Each page has exactly one h1 owned by the shell

The shell header SHALL render the page title as the only `h1`. Page content SHALL start its heading hierarchy at `h2` and SHALL NOT skip levels within a section.

#### Scenario: Dailies tabs

- **WHEN** the Today, HRE, HSE or Shops tab renders
- **THEN** the document contains one `h1` (the shell title) and the tab's own sections are `h2`, with subsections at `h3`

### Requirement: Loading and error states are announced

Loading indicators rendered through the shared loading components SHALL expose `role="status"` with a localized accessible name; page-level error blocks SHALL expose `role="alert"`.

#### Scenario: Route chunk loading

- **WHEN** a lazy page chunk is loading in either shell
- **THEN** the fallback is exposed as a status region with a localized name

#### Scenario: Route error

- **WHEN** the route error boundary renders
- **THEN** its container is exposed as an alert so the message is announced once
