# app-startup-rendering Specification

## Purpose

Defines what the user sees between the entry document and the first rendered route: a loading indicator in the persisted theme rather than a blank page or a light-mode flash.

## Requirements

### Requirement: Translation loading shows a loading indicator

While the initial translation resources are loading, the app SHALL render the boot screen, the same one used during authentication, not an empty page.

#### Scenario: Slow connection on first visit

- **WHEN** the entry document has loaded but the first translation namespaces are still downloading
- **THEN** the user sees the boot screen until the first route renders

### Requirement: The persisted theme is applied before first paint

When the user has an explicit theme preference stored, or System resolves to dark, the document SHALL already be in that theme when the entry document first paints, so no light-to-dark flash occurs.

#### Scenario: Dark preference on reload

- **GIVEN** the user previously chose the Dark theme
- **WHEN** they reload the app
- **THEN** the first painted frame is dark and stays dark

#### Scenario: No stored preference with a dark system theme

- **GIVEN** no stored preference and a dark operating-system theme
- **WHEN** the app loads
- **THEN** the first painted frame is dark

#### Scenario: Storage blocked

- **GIVEN** a browser that blocks site storage
- **WHEN** the app loads
- **THEN** the first frame follows the system theme and no error is raised

### Requirement: One boot screen covers every wait before content

Every wait before the first real content SHALL show the same boot screen: translations loading, MSAL's startup or an interaction in progress, a silent restore in progress, and the onboarding gate's first account check. The boot screen SHALL use the manifest's `background_color` (`#0B1222`) in both themes, show the app logo centred with a soft pulse beneath it (no pulse under reduced motion), cover the whole viewport wherever it mounts, and be exposed to assistive technology as a status labelled "Loading…". A message shown on it, such as the onboarding gate's slow note, SHALL NOT move the logo.

#### Scenario: Returning user launches the installed app

- **GIVEN** a user who signed in on this device before
- **WHEN** they launch the installed app
- **THEN** the splash is followed by the boot screen and then their page, with no landing page and no other loading indicator in between

### Requirement: The entry document shows the boot screen before scripts run

`index.html` SHALL contain a static copy of the boot screen inside the root element, so it is painted before the application bundle has run and is replaced by the app's first render.

#### Scenario: Slow script download

- **WHEN** the entry document has loaded but the application bundle is still downloading
- **THEN** the boot screen is visible, not a blank page

### Requirement: Home shows a skeleton while its page loads

While the lazy Home page is loading, the shell SHALL show a skeleton of Home's layout in its place: Right now, then Daily raids, Upcoming events and Projects stacked below `lg` (Daily raids, Projects and Upcoming events in three columns from `lg`), then the calendar. Other pages SHALL keep the centred loading spinner.

#### Scenario: Home chunk still downloading

- **WHEN** the shell renders `/home` before the Home page's code has loaded
- **THEN** the content area shows the Home skeleton, exposed as a status labelled "Loading…"

### Requirement: The landing page appears whole

The landing route SHALL show the boot screen until the landing page's translations have loaded, and only then render the public top bar, the page and the footer together. It SHALL NOT show the public chrome around an empty loading area.

#### Scenario: First visit to the landing page

- **WHEN** a visitor opens `/` and the landing translations are still downloading
- **THEN** the boot screen is shown, followed by the complete landing page

### Requirement: The boot screen continues the splash

The boot screen's logo SHALL be the size of the Android splash icon (208 CSS pixels) and sit at the centre of the viewport, with the pulse and any message placed below it so they do not move it. The static copy in `index.html` SHALL match.

#### Scenario: Splash hands over to the boot screen

- **WHEN** the installed app's splash gives way to the boot screen
- **THEN** the logo keeps its size and position
