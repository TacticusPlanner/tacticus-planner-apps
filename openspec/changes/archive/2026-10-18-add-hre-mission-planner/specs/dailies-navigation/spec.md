# Spec Delta

## ADDED Requirements

### Requirement: Dailies has an HRE tab

The `/dailies` section SHALL include an HRE tab, labelled with the localized abbreviation of Hero Release Event, at `/dailies/hre`. It SHALL sit directly after HSE, so the primary tabs are Raids, HSE, HRE, Shops, Guild Raids. The tab SHALL appear in section tabs, the desktop section menu and navigation search. It SHALL be shown whether or not an HRE is running. This supersedes any statement of the number or order of Dailies primary tabs elsewhere in this capability.

#### Scenario: Tab order

- **WHEN** a signed-in user opens `/dailies`
- **THEN** the tabs are Raids, HSE, HRE, Shops, Guild Raids, and the Raids tab is active by default

#### Scenario: Direct navigation

- **WHEN** a user loads `/dailies/hre` directly
- **THEN** the Dailies tab bar renders with the HRE tab active and its content shown

#### Scenario: Tab shown without an event

- **GIVEN** no HRE is running or scheduled
- **THEN** the HRE tab is still listed and opens the empty state

### Requirement: The HRE tab shows a live indicator while an HRE runs

The HRE tab SHALL show the shared live indicator while an HRE is running, in the section tab row on mobile and in the desktop section menu, and none otherwise. It SHALL NOT change the tab's label, route, order or visibility.

#### Scenario: Indicator while Zapspitta's HRE runs

- **GIVEN** the time is 2026-10-18T20:00Z
- **THEN** the HRE tab shows the indicator with the accessible text "event live"

#### Scenario: No indicator in a preview

- **GIVEN** no HRE is running, and one is upcoming
- **THEN** the HRE tab has no indicator
