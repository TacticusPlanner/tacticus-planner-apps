## MODIFIED Requirements

### Requirement: Dailies primary navigation

The system SHALL present a `/dailies` section with 5 primary tabs, in order Raids, HSE, HRE, Quest, Guild Raids, in section tabs, the desktop section menu and navigation search, and SHALL land the user on the Raids tab by default. Onslaught, Salvage Run, and Arena SHALL NOT appear in Dailies navigation (section tabs, desktop section menu, or navigation search).

#### Scenario: Opening Dailies lands on Raids

- **WHEN** a signed-in user navigates to `/dailies`
- **THEN** the 5 tabs are visible and the Raids tab's content is shown without further navigation

#### Scenario: Switching to a tab preserves the tab bar

- **WHEN** the user selects any of the 5 primary tabs
- **THEN** the tab bar remains visible and the selected tab is highlighted as active

#### Scenario: Hidden pages are not routes

- **WHEN** the user opens `/dailies/onslaught`, `/dailies/salvage-run`, or `/dailies/arena`
- **THEN** the app treats it as an unknown route, the same as any other path it does not serve

### Requirement: Dailies has an HSE tab

The `/dailies` section SHALL include an HSE tab (label: the localized abbreviation of Home Screen Event) at `/dailies/hse`. The tab SHALL appear in section tabs, the desktop section menu and navigation search, and SHALL be shown whether or not an event is active.

#### Scenario: Tab order

- **WHEN** a signed-in user opens `/dailies`
- **THEN** the tabs are Raids, HSE, Shops, Guild Raids and the Raids tab is active by default

#### Scenario: Direct navigation

- **WHEN** a user loads `/dailies/hse` directly
- **THEN** the Dailies tab bar renders with the HSE tab active and its content shown

#### Scenario: Tab shown without an active event

- **GIVEN** no HSE is active
- **THEN** the HSE tab is still listed and opens the empty state

### Requirement: Dailies has an HRE tab

The `/dailies` section SHALL include an HRE tab, labelled with the localized abbreviation of Hero Release Event, at `/dailies/hre`. The tab SHALL appear in section tabs, the desktop section menu and navigation search. It SHALL be shown whether or not an HRE is running.

#### Scenario: Tab order

- **WHEN** a signed-in user opens `/dailies`
- **THEN** the tabs are Raids, HSE, HRE, Shops, Guild Raids, and the Raids tab is active by default

#### Scenario: Direct navigation

- **WHEN** a user loads `/dailies/hre` directly
- **THEN** the Dailies tab bar renders with the HRE tab active and its content shown

#### Scenario: Tab shown without an event

- **GIVEN** no HRE is running or scheduled
- **THEN** the HRE tab is still listed and opens the empty state

### Requirement: Dailies has a Quest tab

The `/dailies` section SHALL include a Quest tab, labelled with the localized name of Quest Event, at `/dailies/quest`. The tab SHALL appear in section tabs, the desktop section menu and navigation search, and SHALL be shown whether or not a quest is running.

#### Scenario: Tab order

- **WHEN** a signed-in user opens `/dailies`
- **THEN** the tabs are Raids, HSE, HRE, Quest, Shops, Guild Raids, and Raids is active

#### Scenario: Direct navigation

- **WHEN** a user loads `/dailies/quest` directly
- **THEN** the Dailies tab bar renders with Quest active and its content shown

### Requirement: Shops is not a Dailies tab

Dailies SHALL NOT have a Shops primary tab: today's shop recommendations are part of the Raids tab (see `daily-shop-recommendations` "Shop recommendations are a section of the Raids tab"). `/dailies/shops` SHALL redirect to `/dailies/raids`, replacing the history entry.

#### Scenario: Tab order

- **WHEN** a signed-in user opens `/dailies`
- **THEN** the tabs are Raids, HSE, HRE, Quest, Guild Raids, and Raids is active

#### Scenario: Old Shops link

- **WHEN** a user opens `/dailies/shops` (for example from a bookmark)
- **THEN** they land on `/dailies/raids`, which shows today's shop recommendations

### Requirement: Every Dailies primary tab opens its implemented page

Every Dailies primary tab SHALL render its implemented page. Guild Raids SHALL render its access-aware page shell, which may show shared guild onboarding until access is ready, rather than the shared Under Construction placeholder.

#### Scenario: Opening Guild Raids before guild access is ready

- **WHEN** the user opens `/dailies/guild-raids` while a guild prerequisite is missing
- **THEN** the Guild Raids page shows the shared guild onboarding state and the Guild Raids primary tab remains active

#### Scenario: Opening Guild Raids with ready access

- **WHEN** the user opens `/dailies/guild-raids` with ready guild access
- **THEN** the Guild Raids page shell renders its ready content slot rather than Under Construction

#### Scenario: Opening another implemented primary tab

- **WHEN** the user opens Raids, HSE, HRE or Quest
- **THEN** that tab's existing implemented page is shown

### Requirement: Each primary tab is its own route

Every primary tab SHALL be addressable by its own URL path, not by client-only tab state. Navigating directly to a tab's URL (fresh load, bookmark, shared link, or browser back/forward) SHALL land on that tab's content with the correct tab highlighted as active.

#### Scenario: Direct navigation to a primary tab's URL

- **WHEN** a user loads a primary tab's URL directly (e.g. `/dailies/hse`) without first visiting `/dailies`
- **THEN** the Dailies tab bar renders with that tab's content shown and highlighted as active

#### Scenario: Browser back/forward navigates between tabs

- **WHEN** a user switches tabs one or more times and then uses the browser's back button
- **THEN** the previously-active tab's URL and content are restored
