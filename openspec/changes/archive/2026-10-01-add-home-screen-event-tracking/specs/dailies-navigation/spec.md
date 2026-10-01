## ADDED Requirements

### Requirement: Dailies has an HSE tab

The `/dailies` section SHALL include an HSE tab (label: the localized abbreviation of Home Screen Event) at `/dailies/hse`, positioned directly after Raids, so the primary tabs are Raids, HSE, Shops, Guild Raids. The tab SHALL appear in section tabs, the desktop section menu and navigation search, and SHALL be shown whether or not an event is active. This supersedes any statement of the number of Dailies primary tabs in other requirements of this capability.

#### Scenario: Tab order

- **WHEN** a signed-in user opens `/dailies`
- **THEN** the tabs are Raids, HSE, Shops, Guild Raids and the Raids tab is active by default

#### Scenario: Direct navigation

- **WHEN** a user loads `/dailies/hse` directly
- **THEN** the Dailies tab bar renders with the HSE tab active and its content shown

#### Scenario: Tab shown without an active event

- **GIVEN** no HSE is active
- **THEN** the HSE tab is still listed and opens the empty state
