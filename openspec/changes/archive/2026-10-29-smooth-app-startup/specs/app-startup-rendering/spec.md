# Spec Delta

## MODIFIED Requirements

### Requirement: Translation loading shows a loading indicator

While the initial translation resources are loading, the app SHALL render the boot screen, the same one used during authentication, not an empty page.

#### Scenario: Slow connection on first visit

- **WHEN** the entry document has loaded but the first translation namespaces are still downloading
- **THEN** the user sees the boot screen until the first route renders

## ADDED Requirements

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
