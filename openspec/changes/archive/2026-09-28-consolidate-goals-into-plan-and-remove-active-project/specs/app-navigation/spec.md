## REMOVED Requirements

### Requirement: Entering a section navigates to its last-visited child on desktop, defaulting to that section's default child on first entry

**Reason**: Plan's default child no longer depends on Current plan or projects; it is the fixed Goals route.

**Migration**: See the replacement requirement in this delta.

## ADDED Requirements

### Requirement: Legacy Goals URLs redirect to Plan

The app SHALL redirect the former Goals-section URLs to their Plan equivalents, replacing the history entry: `/goals` and `/goals/plan` to `/plan/goals`, `/goals/overview` to `/plan/goals`, `/goals/projects` to `/plan/projects`, `/goals/projects/{id}` to `/plan/projects/{id}` and `/goals/insights` to `/plan/insights`. Bare `/plan` SHALL redirect (replace) to `/plan/goals`. The same mapping SHALL apply to a stored post-login `next` path. Query strings and hashes SHALL be preserved. These redirects are temporary and are removed by a later change once shared links have aged out.

#### Scenario: Old bookmark opens the Goals page

- **WHEN** the user opens `/goals/overview`
- **THEN** the app replaces the URL with `/plan/goals` and shows Goals, and Back does not return to the old URL

#### Scenario: Old project detail link keeps its project

- **WHEN** the user opens `/goals/projects/{id}`
- **THEN** the app shows that project at `/plan/projects/{id}`

#### Scenario: Bare Plan redirects to Goals

- **WHEN** the user opens `/plan`
- **THEN** the app replaces the URL with `/plan/goals`

#### Scenario: Login next path is mapped

- **GIVEN** a signed-out user opens `/goals/projects`
- **WHEN** they sign in and the app resumes the stored `next` path
- **THEN** they land on `/plan/projects`

### Requirement: Entering a section navigates to its last-visited child on desktop, defaulting to a fixed default child on first entry

For a top-level section with more than one child page, activating that section's entry point in the desktop sidebar SHALL navigate to the child route the user most recently visited within that section during the current session. Before the user has visited any child of that section in the session, it SHALL navigate to that section's existing default child route. For the Plan section (route prefix `/plan`), that default child route is the fixed Goals route `/plan/goals`; it does not depend on projects. Every other section's default child route remains the fixed route it is today, unaffected.

This applies to the desktop sidebar only. On mobile, sections reachable via the drawer already expose every child page as its own direct link, so there is no hidden default to resolve there, and the Plan section's primary bottom-bar entry resolves to `/plan/goals` every time it is activated — mobile has no last-visited-child memory, so every activation is a "first entry." It also applies only to sections with more than one child route on desktop — a section with a single child route continues to navigate to its existing default/index route unchanged.

#### Scenario: First entry into a multi-child section uses its default child

- **WHEN** a user who has not visited any Lookup page this session clicks the Lookup entry in the desktop sidebar
- **THEN** they land on Lookup's existing default child page (Character)

#### Scenario: Re-entering a multi-child section returns to its last-visited child

- **WHEN** a user views `/lookup/mow` (via the sidebar flyout, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Lookup entry in the desktop sidebar
- **THEN** they land on `/lookup/mow`, not Lookup's default child

#### Scenario: Directly visiting a child route counts as visiting it

- **WHEN** a user opens a child route directly (e.g. via a bookmark, search, the mobile drawer, the mobile header's own tab row, or the desktop sidebar's flyout) without first clicking the section's desktop sidebar entry
- **THEN** that route is recorded as the section's last-visited child for the remainder of the session, so a later desktop sidebar click into that section honors it

#### Scenario: Last-visited child survives a page reload within the same session

- **WHEN** a user visits `/lookup/mow`, reloads the page (staying in the same browser tab), then clicks the Lookup entry in the desktop sidebar
- **THEN** they land on `/lookup/mow`, not Lookup's default child — the last-visited child is not lost on reload

#### Scenario: Single-child sections keep their existing default on desktop

- **WHEN** a user clicks the Guild entry (single child route) in the desktop sidebar
- **THEN** they land on that section's existing default route, unaffected by last-visited-child behavior

#### Scenario: Dailies follows the same multi-child behavior as any other section

- **WHEN** a user visits `/dailies/shops` (via the sidebar flyout, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Dailies entry in the desktop sidebar
- **THEN** they land on `/dailies/shops`, not Dailies' default child (`/dailies/raids`) — Dailies is not special-cased once it has more than one child route

#### Scenario: Plan's default is Goals

- **GIVEN** the user has not visited any Plan child page this session
- **WHEN** the user activates the Plan entry (desktop sidebar first entry, or the mobile bottom-bar entry)
- **THEN** they land on Goals (`/plan/goals`) regardless of the account's projects

#### Scenario: Plan's default does not wait for projects

- **GIVEN** the account's projects are still loading, failed to load, or do not exist
- **WHEN** the user activates the Plan entry
- **THEN** they land on `/plan/goals` immediately, with no project-dependent redirect or loading route

#### Scenario: Plan's last-visited-child memory still overrides the default on desktop

- **GIVEN** the user has visited Projects (`/plan/projects`) earlier this session
- **WHEN** the user clicks the Plan entry in the desktop sidebar
- **THEN** they land on Projects, not Goals — last-visited-child memory takes precedence over the default, the same as it would for any other section's fixed default
