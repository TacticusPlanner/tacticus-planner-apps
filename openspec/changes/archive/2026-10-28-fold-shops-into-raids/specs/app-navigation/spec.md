## MODIFIED Requirements

### Requirement: Entering a section navigates to its last-visited child on desktop, defaulting to a fixed default child on first entry

For a top-level section with more than one child page, activating that section's entry point in the desktop sidebar SHALL navigate to the child route the user most recently visited within that section during the current session. Before the user has visited any child of that section in the session, it SHALL navigate to that section's existing default child route. For the Plan section (route prefix `/plan`), that default child route is the fixed Goals route `/plan/goals`; it does not depend on projects. Every other section's default child route remains the fixed route it is today, unaffected.

This applies to the desktop sidebar only. On mobile, sections reachable via the drawer already expose every child page as its own direct link, so there is no hidden default to resolve there, and the Plan section's primary bottom-bar entry resolves to `/plan/goals` every time it is activated — mobile has no last-visited-child memory, so every activation is a "first entry." It also applies only to sections with more than one child route on desktop — a section with a single child route continues to navigate to its existing default/index route unchanged.

#### Scenario: First entry into a multi-child section uses its default child

- **WHEN** a user who has not visited any Library page this session clicks the Library entry in the desktop sidebar
- **THEN** they land on Library's existing default child page (Characters)

#### Scenario: Re-entering a multi-child section returns to its last-visited child

- **WHEN** a user views `/library/machines-of-war` (via the section menu, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Library entry in the desktop sidebar
- **THEN** they land on `/library/machines-of-war`, not Library's default child

#### Scenario: Directly visiting a child route counts as visiting it

- **WHEN** a user opens a child route directly (e.g. via a bookmark, search, the mobile drawer, the mobile header's own tab row, or the desktop section menu) without first clicking the section's desktop sidebar entry
- **THEN** that route is recorded as the section's last-visited child for the remainder of the session, so a later desktop sidebar click into that section honors it

#### Scenario: Last-visited child survives a page reload within the same session

- **WHEN** a user visits `/library/machines-of-war`, reloads the page (staying in the same browser tab), then clicks the Library entry in the desktop sidebar
- **THEN** they land on `/library/machines-of-war`, not Library's default child — the last-visited child is not lost on reload

#### Scenario: Single-child sections keep their existing default on desktop

- **WHEN** a user clicks the Guild entry (single child route) in the desktop sidebar
- **THEN** they land on that section's existing default route, unaffected by last-visited-child behavior

#### Scenario: Dailies follows the same multi-child behavior as any other section

- **WHEN** a user visits `/dailies/guild-raids` (via the section menu, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Dailies entry in the desktop sidebar
- **THEN** they land on `/dailies/guild-raids`, not Dailies' default child (`/dailies/raids`) — Dailies is not special-cased once it has more than one child route

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
