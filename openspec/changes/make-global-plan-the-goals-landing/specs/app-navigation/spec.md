## MODIFIED Requirements

### Requirement: Entering a section navigates to its last-visited child on desktop, defaulting to that section's default child on first entry

For a top-level section with more than one child page, activating that section's entry point in the desktop sidebar SHALL navigate to the child route the user most recently visited within that section during the current session. Before the user has visited any child of that section in the session, it SHALL navigate to that section's existing default child route. For the Plan section specifically (formerly labelled Goals), once the global ordered plan exists, that default child SHALL be the global ordered plan route; it SHALL NOT select the Current or Default project detail route. Every other section's default child route remains the fixed route it is today, unaffected.

This applies to the desktop sidebar only. On mobile, sections reachable via the drawer still expose every child page as its own direct link, and the Plan section's primary bottom-bar entry SHALL resolve the same global-plan default every time it is activated. Mobile has no last-visited-child memory. A section with a single child route continues to navigate to its existing default/index route unchanged. Bare `/goals` SHALL resolve to the global ordered plan when it is available. All Goals and existing project routes SHALL remain directly reachable.

#### Scenario: First entry into a multi-child section uses its default child

- **WHEN** a user who has not visited any Lookup page this session clicks the Lookup entry in the desktop sidebar
- **THEN** they land on Lookup's existing default child page (Character)

#### Scenario: Re-entering a multi-child section returns to its last-visited child

- **WHEN** a user views `/lookup/mow`, navigates to a different top-level section, then clicks Lookup in the desktop sidebar
- **THEN** they land on `/lookup/mow`, not Lookup's default child

#### Scenario: Directly visiting a child route counts as visiting it

- **WHEN** a user opens a child route via bookmark, search, drawer, tab, or flyout without first clicking the section's desktop entry
- **THEN** that route is recorded as the section's last-visited child for the remainder of the session

#### Scenario: Last-visited child survives a page reload within the same session

- **WHEN** a user visits `/lookup/mow`, reloads in the same browser tab, then clicks Lookup in the desktop sidebar
- **THEN** they land on `/lookup/mow`, not Lookup's default child

#### Scenario: Single-child sections keep their existing default on desktop

- **WHEN** a user clicks the Guild entry in the desktop sidebar
- **THEN** they land on that section's existing default route

#### Scenario: Dailies follows the same multi-child behavior as any other section

- **WHEN** a user visits `/dailies/shops`, leaves Dailies, then clicks its desktop sidebar entry
- **THEN** they land on `/dailies/shops`, not Dailies' default child

#### Scenario: Plan's default resolves to Current plan's project

- **GIVEN** the account has a Current plan project and has not visited a Plan child this session
- **WHEN** the user activates Plan on desktop, or activates the mobile Plan bottom-bar entry
- **THEN** they land on the global ordered plan rather than the Current plan project's detail route

#### Scenario: Plan falls back to the Default project when there is no Current plan

- **GIVEN** the account has projects but none is Current plan, and has not visited a Plan child this session
- **WHEN** the user activates Plan
- **THEN** they land on the global ordered plan rather than the Default project's detail route

#### Scenario: Plan falls back to All Goals when the account has no projects

- **GIVEN** the account has no projects and has not visited a Plan child this session
- **WHEN** the user activates Plan
- **THEN** the global ordered plan opens with its appropriate empty state, not All Goals

#### Scenario: Plan works with no projects

- **WHEN** the account has no projects and the user activates Plan
- **THEN** the global ordered plan opens with its appropriate empty state, not a project route

#### Scenario: Plan's last-visited-child memory still overrides the dynamic default on desktop

- **WHEN** the user visits `/goals/projects`, leaves Plan, then clicks Plan in the desktop sidebar
- **THEN** they land on Projects, not the global-plan default

#### Scenario: Bare and deep routes remain available

- **WHEN** the user opens bare `/goals`, `/goals/overview`, or an existing project detail URL directly
- **THEN** bare `/goals` resolves to the global plan while the other two URLs keep their respective content
