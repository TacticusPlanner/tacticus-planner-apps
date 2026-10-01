# dailies-navigation Specification

## Purpose

Gives players a single `/dailies` entry point for day-to-day play activities (raiding, shops, onslaught, salvage, arena, guild raids), with a working Raids section and clearly-marked placeholders for everything not yet built.

## Requirements

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

### Requirement: The Raids tab is the Today page

The Raids tab SHALL render the Today page directly at `/dailies/raids`, with no sub-tab bar. `/dailies/raids/today` and `/dailies/raids/plan` SHALL NOT be routes. The multi-day plan is not part of Dailies (see `daily-raids-plan` "Schedule is a Plan section page").

#### Scenario: Opening Raids shows Today

- **WHEN** the user opens `/dailies/raids`
- **THEN** the Today page renders, the Raids primary tab is active, and no Today/Plan sub-tab bar is rendered

#### Scenario: Former sub-tab paths are not routes

- **WHEN** the user opens `/dailies/raids/today`
- **THEN** the app treats it as an unknown route, the same as any other path it does not serve

### Requirement: Today's project selector and Planning Settings share one row

On the Today page, the project selector SHALL render right-aligned in its own row with the Planning Settings trigger trailing after it, above the schedule. Below the 768px mobile breakpoint the project selector SHALL render as an icon-only trigger retaining an accessible name for the full label; at or above 768px it SHALL show its label.

#### Scenario: Desktop row

- **WHEN** the user opens `/dailies/raids` at or above 768px
- **THEN** the project selector and the Planning Settings trigger are right-aligned together in one row above the schedule, with nothing leading in that row

#### Scenario: Mobile selector compresses

- **WHEN** the user opens `/dailies/raids` below 768px
- **THEN** the project selector renders its icon only, without a visible text label, while remaining identifiable via its accessible name, and the Planning Settings trigger follows it

### Requirement: Each primary tab is its own route

Every primary tab SHALL be addressable by its own URL path, not by client-only tab state. Navigating directly to a tab's URL (fresh load, bookmark, shared link, or browser back/forward) SHALL land on that tab's content with the correct tab highlighted as active.

#### Scenario: Direct navigation to a primary tab's URL

- **WHEN** a user loads a primary tab's URL directly (e.g. `/dailies/shops`) without first visiting `/dailies`
- **THEN** the Dailies tab bar renders with that tab's content shown and highlighted as active

#### Scenario: Browser back/forward navigates between tabs

- **WHEN** a user switches tabs one or more times and then uses the browser's back button
- **THEN** the previously-active tab's URL and content are restored
