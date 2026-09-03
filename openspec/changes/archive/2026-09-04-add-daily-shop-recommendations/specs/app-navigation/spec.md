## MODIFIED Requirements

### Requirement: Library replaces Lookup in public navigation

The anonymous-available public reference section SHALL be named "Library" and
shall contain these child destinations: "Characters", "Machines of War",
"NPCs", "Raid Bosses", and "Shops". Their destinations SHALL be the
corresponding Library routes (`/library/characters`, `/library/machines-of-war`,
`/library/npcs`, `/library/raid-bosses`, `/library/shops`). The old "Lookup"
section name and singular child labels SHALL not be shown for this public
reference area.

#### Scenario: Desktop navigation presents the Library hierarchy

- **WHEN** a user views the desktop sidebar or opens the public reference
  section's child flyout
- **THEN** it presents Library and the five Library child destinations with
  their Library routes

#### Scenario: Mobile navigation presents the Library hierarchy

- **WHEN** a user opens the mobile menu drawer or views the Library header
  child picker
- **THEN** it presents Library and the five Library child destinations with
  their Library routes

#### Scenario: Navigation search finds Library destinations

- **WHEN** a user searches for "Library", "Characters", "Machines of War",
  "NPCs", "Raid Bosses", or "Shops"
- **THEN** the matching Library destination appears with its localized
  description and opens its Library route when selected
