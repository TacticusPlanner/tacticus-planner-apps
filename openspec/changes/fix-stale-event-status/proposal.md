## Why

UserJot feedback "Incorrect event times and stale HSE status":

> The calendar is not set up right for the start and end time of events. Machine Hunt finished almost 8h ago but is showing as still active in HSE tab/page. There should be no HSE right now (2026-10-06T06:59+00:00).

The served catalog ends that Machine Hunt occurrence at 2026-10-06T08:00Z, while the report puts the in-game end about 8 hours earlier (around 2026-10-05T23:00Z–2026-10-06T00:00Z), so the primary cause is event data; that correction is the companion `tacticus-planner-api` change of the same name, `fix-stale-event-status` (see Companion change). Independently, the client reads "now" once and never again in several places while a tab stays open, which keeps an ended event looking active even after the data is right, and an open tab never receives corrected data. Code review found:

- The Home events calendar computes its week window from `new Date()` once per week offset, so it never rolls past local midnight, and its `isActiveNow` flag (the card highlight) is only recomputed when catalog data changes — an HSE that ended keeps showing as active.
- Today's campaign-event status reads the active calendar window and its instant once on mount, so an event that ends (or starts) while Today is open is not reflected.
- The HSE status line and preview banner format "ends in / starts in" against the wall clock at render instead of the hook's ticking instant.
- The game catalog syncs once on mount; a tab left open for hours never sees corrected event data (such as a fixed schedule) until reload.

## What Changes

- Move `useMinuteNow` from `entities/legendary-event` to `shared/lib/format-time` (exported from `@/shared/lib`) so pages and features can share one minute tick; Legendary Event hooks import it from there.
- Home events calendar: derive the week window from the ticking instant's local day and recompute `isActiveNow` on every tick.
- Today campaign-event status: re-read the active calendar window on every minute tick.
- `useActiveHomeScreenEvent` uses the shared tick; `formatRelativeTime` accepts an optional `nowMs`, which the HSE status line and preview banner pass from the hook's state.
- `GameCatalogProvider`: when the tab becomes visible and the last usable sync is over an hour old, re-check the catalog in the background without changing the init gate's status/progress; a failed re-check keeps the cached catalog.

## Companion change

`tacticus-planner-api` change `fix-stale-event-status` corrects the served event data in `src/TacticusPlanner.GameCatalog/Data/events/event-occurrences.json`; this repo does not edit it. Data issues found there, to verify against the in-game schedule:

- HSE occurrences start at `T00:00Z` before 2026-09-12 and at `T08:00Z` after it (the reported Machine Hunt end is 8 hours late).
- `hse-against-the-tide` runs 7 days (2026-10-10 to 2026-10-17), longer than other HSEs.
- Two HSE occurrences overlap on 2026-10-26.

Clients pick up the corrected data through the catalog re-check below without a reload.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-events-calendar`: active indication and the current week stay correct while the page stays open.
- `daily-raids-home-screen-event`: HSE status and preview countdowns follow the selection's ticking instant.
- `daily-raids-today`: the campaign-event status re-evaluates while Today stays open.
- `game-events-calendar`: an open client re-checks the catalog when it returns to view after an hour.

## Impact

`shared/lib/format-time/use-minute-now.ts` (moved), `shared/lib/format-time/format-relative-time.ts`, `entities/legendary-event/model/use-legendary-event(s).ts`, `pages/home/model/use-events-calendar.ts`, `pages/dailies/ui/use-campaign-event-status.ts`, `pages/dailies/ui/hse-page.tsx`, `features/daily-raids/model/use-active-home-screen-event.ts`, `features/daily-raids/ui/home-screen-event/event-{status-line,preview-banner}.tsx`, `app/providers/game-catalog-provider.tsx`, and tests. No UI copy change; event data is corrected by the companion API change `fix-stale-event-status`.
