## MODIFIED Requirements

### Requirement: Each row opens its own destination

Each event row and tile SHALL contain a link (activatable by click, tap and Enter, and openable in a new tab): a Home Screen Event navigates to `/dailies/hse?event=<instance key>` and a Hero Release Event to `/dailies/hre?event=<instance key>` (the tab's switcher key: the occurrence id, else `definitionId@startUtc`), so the tab opens on that very instance; a Legendary Event navigates to `/legendary-events/:eventId`; a Quest to `/dailies/quest`; an event shop to `/plan/event-shop/<shop id>`. Neither card SHALL navigate as a whole, and the plan action is a separate control.

#### Scenario: HSE row opens the HSE tab

- **WHEN** the user activates the Machine Hunt tile
- **THEN** the app navigates to `/dailies/hse?event=<Machine Hunt's instance key>` and the HSE tab shows Machine Hunt

#### Scenario: Legendary Event row opens the event page

- **WHEN** the user activates the Lysander tile
- **THEN** the app navigates to `/legendary-events/astarLysander`

#### Scenario: Event shop row opens its shop

- **WHEN** the user activates the Skull Harvest row
- **THEN** the app navigates to `/plan/event-shop/november-2026`

#### Scenario: Keyboard activation

- **WHEN** a row link has focus and the user presses Enter
- **THEN** that row's navigation occurs
