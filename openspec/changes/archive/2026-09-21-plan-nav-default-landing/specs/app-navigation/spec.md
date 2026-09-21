## MODIFIED Requirements

### Requirement: Entering a section navigates to its last-visited child on desktop, defaulting to that section's default child on first entry

For a top-level section with more than one child page, activating that section's entry point in the desktop sidebar SHALL navigate to the child route the user most recently visited within that section during the current session. Before the user has visited any child of that section in the session, it SHALL navigate to that section's existing default child route. For the Plan section specifically (formerly labelled Goals), that default child route is not a fixed route: it resolves to the account's Current plan project's detail route, falling back to the account's Default project when there is no Current plan, and to All Goals (formerly labelled Overview) when the account has no projects at all yet. Every other section's default child route remains the fixed route it is today, unaffected.

This applies to the desktop sidebar only. On mobile, sections reachable via the drawer already expose every child page as its own direct link, so there is no hidden default to resolve there, and the Plan section's primary bottom-bar entry resolves the same default described above every time it is activated — mobile has no last-visited-child memory, so every activation is a "first entry." It also applies only to sections with more than one child route on desktop — a section with a single child route continues to navigate to its existing default/index route unchanged.

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

#### Scenario: Plan's default resolves to Current plan's project

- **GIVEN** the account has a Current plan project and has not visited any Plan child page this session
- **WHEN** the user activates the Plan entry (desktop sidebar first entry, or the mobile bottom-bar entry)
- **THEN** they land on that project's detail route (`/goals/projects/{id}`), not All Goals

#### Scenario: Plan falls back to the Default project when there is no Current plan

- **GIVEN** the account has projects but none is marked Current plan, and has not visited any Plan child page this session
- **WHEN** the user activates the Plan entry
- **THEN** they land on the account's Default project's detail route

#### Scenario: Plan falls back to All Goals when the account has no projects

- **GIVEN** the account has no projects at all, and has not visited any Plan child page this session
- **WHEN** the user activates the Plan entry
- **THEN** they land on All Goals (`/goals/overview`)

#### Scenario: Plan's last-visited-child memory still overrides the dynamic default on desktop

- **GIVEN** the account has a Current plan project, and the user has visited Projects (`/goals/projects`) earlier this session
- **WHEN** the user clicks the Plan entry in the desktop sidebar
- **THEN** they land on Projects, not the Current plan project's detail route — last-visited-child memory takes precedence over the dynamic default, the same as it would for any other section's fixed default
