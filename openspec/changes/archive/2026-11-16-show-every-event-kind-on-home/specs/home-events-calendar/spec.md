## ADDED Requirements

### Requirement: The details popover links to the event's planner page

The details popover SHALL show an "Open planner" link (in-app) when the planner has a page for the event: a Home Screen Event opens `/dailies/hse?event=<key>` and a Hero Release Event `/dailies/hre?event=<key>` (key: the occurrence id, else `definitionId@startUtc`), a Quest `/dailies/quest`, an event shop `/dailies/event-shop/<shop id>` (the served shop of the same definition whose days cover the occurrence's start, else `/dailies/event-shop`), a Legendary Event `/legendary-events/<featured hero>` (else `/legendary-events`), a Campaign Event `/my-game/campaign-events`, an Incursion `/my-game/incursions` and a Guild Raid season `/dailies/guild-raids`. Other events SHALL show no planner link.

#### Scenario: Home Screen Event

- **WHEN** the user opens the details of the Blood Tithe occurrence `occ-2026-11-22-hse-global-blood-tithe`
- **THEN** the popover links "Open planner" to `/dailies/hse?event=occ-2026-11-22-hse-global-blood-tithe`

#### Scenario: Event shop week

- **WHEN** the user opens the details of Skull Harvest week 1 (starts 2026-11-23) and the served `november-2026` shop covers that day
- **THEN** the popover links to `/dailies/event-shop/november-2026`

#### Scenario: No planner page

- **WHEN** the user opens the details of a Battle Pass season
- **THEN** the popover shows no planner link
