## ADDED Requirements

### Requirement: Guild War phases show on Home

Home SHALL split each calendar Guild War season into wars, each a preparation phase then a war phase, by the season definition's `warsPerSeason`, `preparationPhaseHours` and `activeFightingPhaseHours`, as the events calendar does. The first war's preparation SHALL open the definition's `firstWarPreparationBonusHours` earlier (48 hours in the game, so it runs 72 hours), and SHALL show as running even before the season's listed start. The running phase SHALL show in Right now and the next phase in Upcoming events, named "Guild War · War N · Preparation" or "Guild War · War N · War" with the Guild War event icon. Every Guild War phase SHALL open `/guild/war/offense`; a Guild War Defense page takes over preparation once it exists. Among live events that end and start together, a Guild War phase sorts after every other kind.

#### Scenario: War phase running

- **GIVEN** Guild War season 29 starts 2026-11-27T09:00Z with 6 wars of a 24-hour preparation and a 36-hour war phase
- **WHEN** Home renders at 2026-11-29T12:00Z
- **THEN** Right now shows "Guild War · War 1 · War", which opens Guild War Offense
- **AND** Upcoming events lists "Guild War · War 2 · Preparation" starting 2026-11-29T21:00Z, which also opens Guild War Offense

#### Scenario: First war's longer preparation

- **GIVEN** the same season, with a first-war preparation bonus of 48 hours
- **WHEN** Home renders at 2026-11-26T12:00Z, before the season's listed start
- **THEN** Right now shows "Guild War · War 1 · Preparation", running from 2026-11-25T09:00Z to 2026-11-28T09:00Z
- **AND** Upcoming events lists "Guild War · War 1 · War" starting 2026-11-28T09:00Z

## MODIFIED Requirements

### Requirement: Each row opens its own destination

Each event row and tile SHALL contain a link (activatable by click, tap and Enter, and openable in a new tab): a Home Screen Event navigates to `/dailies/hse?event=<instance key>` and a Hero Release Event to `/dailies/hre?event=<instance key>` (the tab's switcher key: the occurrence id, else `definitionId@startUtc`), so the tab opens on that very instance; a Legendary Event navigates to `/legendary-events/:eventId`; a Quest to `/dailies/quest`; an event shop to `/plan/event-shop/<shop id>`; a Guild War phase to `/guild/war/offense`. Neither card SHALL navigate as a whole, and the plan action is a separate control.

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
