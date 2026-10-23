# Spec Delta

## ADDED Requirements

### Requirement: Dailies has a Quest tab

The `/dailies` section SHALL include a Quest tab, labelled with the localized name of Quest Event, at `/dailies/quest`. It SHALL sit directly after HRE, so the primary tabs are Raids, HSE, HRE, Quest, Shops, Guild Raids. The tab SHALL appear in section tabs, the desktop section menu and navigation search, and SHALL be shown whether or not a quest is running. This supersedes any statement of the number or order of Dailies primary tabs elsewhere in this capability.

#### Scenario: Tab order

- **WHEN** a signed-in user opens `/dailies`
- **THEN** the tabs are Raids, HSE, HRE, Quest, Shops, Guild Raids, and Raids is active

#### Scenario: Direct navigation

- **WHEN** a user loads `/dailies/quest` directly
- **THEN** the Dailies tab bar renders with Quest active and its content shown

### Requirement: The Quest tab shows a live indicator while a quest runs

The Quest tab SHALL show the shared live indicator while a quest is running (not in its claim window or preview), in the section tab row on mobile and in the desktop section menu, and none otherwise. It SHALL NOT change the tab's label, route, order or visibility.

#### Scenario: Nubari running

- **GIVEN** the time is 2026-10-23T18:00Z
- **THEN** the Quest tab shows the indicator with the accessible text "event live"

#### Scenario: Claim window

- **GIVEN** the time is 2026-10-24T10:00Z
- **THEN** the Quest tab has no indicator
