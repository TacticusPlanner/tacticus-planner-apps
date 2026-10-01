## MODIFIED Requirements

### Requirement: Dailies primary navigation

The system SHALL present a `/dailies` section with 3 primary tabs — Raids, Shops, Guild Raids — and SHALL land the user on the Raids tab by default. Onslaught, Salvage Run, and Arena SHALL NOT appear in Dailies navigation (section tabs, desktop section menu, or navigation search).

#### Scenario: Opening Dailies lands on Raids

- **WHEN** a signed-in user navigates to `/dailies`
- **THEN** the 3 tabs are visible and the Raids tab's content is shown without further navigation

#### Scenario: Switching to a tab preserves the tab bar

- **WHEN** the user selects any of the 3 primary tabs
- **THEN** the tab bar remains visible and the selected tab is highlighted as active

#### Scenario: Hidden pages are not routes

- **WHEN** the user opens `/dailies/onslaught`, `/dailies/salvage-run`, or `/dailies/arena`
- **THEN** the app treats it as an unknown route, the same as any other path it does not serve

### Requirement: Every Dailies primary tab opens its implemented page

Every Dailies primary tab SHALL render its implemented page. Guild Raids SHALL render its access-aware page shell, which may show shared guild onboarding until access is ready, rather than the shared Under Construction placeholder.

#### Scenario: Opening Guild Raids before guild access is ready

- **WHEN** the user opens `/dailies/guild-raids` while a guild prerequisite is missing
- **THEN** the Guild Raids page shows the shared guild onboarding state and the Guild Raids primary tab remains active

#### Scenario: Opening Guild Raids with ready access

- **WHEN** the user opens `/dailies/guild-raids` with ready guild access
- **THEN** the Guild Raids page shell renders its ready content slot rather than Under Construction

#### Scenario: Opening another implemented primary tab

- **WHEN** the user opens Raids or Shops
- **THEN** that tab's existing implemented page is shown
