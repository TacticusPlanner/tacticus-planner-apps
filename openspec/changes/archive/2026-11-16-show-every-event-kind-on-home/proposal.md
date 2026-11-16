## Why

Home's Right now and Upcoming events miss Hero Release Events and event shops entirely, show only one Home Screen Event when two overlap (Blood Tithe beside a Faction Boost from 2026-11-22), and cap Upcoming at three rows, so a run of Home Screen Events pushes the next Quest off Home. Blood Tithe also has no game icon. The events calendar's details popover links to the Wiki but not to the planner's own page for the event.

## What Changes

- Blood Tithe (`hse-global-blood-tithe`) gets its datamined medallion, banner and points icon.
- Right now lists every running Home Screen Event, plus the running Quest, Hero Release Event and dated event shop.
- Upcoming events lists the next occurrence of each kind (Home Screen Events starting first, Legendary Event, Campaign Event, Incursion, Quest, Hero Release Event, event shop) sorted by start; the first three show (the next Legendary Event pinned among them unless one is live) and a "Show N more" toggle reveals the rest. A shop with no start date shows last as "Start date TBA" when no dated shop is coming, and is never live.
- The calendar's details popover gains an "Open planner" link to the occurrence's planner page.

## Capabilities

### Modified Capabilities

- `home-events-widget`: live and upcoming selection, HRE and event shop rows, their destinations and art.
- `home-events-calendar`: planner link in the details popover.

## Impact

- `packages/game-catalog`: Blood Tithe art.
- `apps/web` Home page: `selectHomeEvents`, `useHomeEvents`, row name/visual, Upcoming TBA row, calendar popover; `common` and `events` copy in four locales.
