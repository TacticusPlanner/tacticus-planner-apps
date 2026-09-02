## ADDED Requirements

### Requirement: Library replaces Lookup in public navigation

The anonymous-available public reference section SHALL be named "Library" and
shall contain these child destinations: "Characters", "Machines of War",
"NPCs", and "Raid Bosses". Their destinations SHALL be the corresponding
Library collection routes. The old "Lookup" section name and singular child
labels SHALL not be shown for this public reference area.

#### Scenario: Desktop navigation presents the Library hierarchy

- **WHEN** a user views the desktop sidebar or opens the public reference
  section's child flyout
- **THEN** it presents Library and the four Library child destinations with
  their Library routes

#### Scenario: Mobile navigation presents the Library hierarchy

- **WHEN** a user opens the mobile menu drawer or views the Library header
  child picker
- **THEN** it presents Library and the four Library child destinations with
  their Library routes

#### Scenario: Navigation search finds Library destinations

- **WHEN** a user searches for "Library", "Characters", "Machines of War",
  "NPCs", or "Raid Bosses"
- **THEN** the matching Library destination appears with its localized
  description and opens its Library route when selected

### Requirement: Library naming is consistent across application context

The application SHALL use localized Library names and descriptions consistently
in page headers, desktop breadcrumbs, browser titles, landing-page links,
Joyride navigation guidance, and applicable in-repository documentation. A
Library child route SHALL show the matching plural child name and description
for its active route.

#### Scenario: Active Library page updates its contextual labels

- **WHEN** a user opens `/library/machines-of-war`
- **THEN** the active navigation context, page header or desktop breadcrumb,
  browser title, and page description identify the section as Library and the
  child page as Machines of War

#### Scenario: Localized navigation has no stale public Lookup label

- **WHEN** the app is displayed in any supported locale
- **THEN** the public reference navigation and its contextual copy use that
  locale's Library terminology rather than the former Lookup terminology
