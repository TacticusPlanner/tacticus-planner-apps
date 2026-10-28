# Proposal

## Why

Home is the page players open most, and it reads as a stack of unrelated cards. Research for this change (published to the project thread, 2026-10-28) found:

- What matters at a glance (capped tokens, the live Home Screen Event, the live Legendary Event) is split across two cards and below nothing in particular; a live event and an upcoming one look the same apart from a small LIVE badge.
- Event rows use generic Lucide glyphs, while the datamine already ships the game's own medallions (`liveevents/ui_gamemodeicon_*`), HSE banners (`ui_interstitial_*`), the Legendary Event and new-character icons, the timer and the menu icons for every other event type.
- The calendar's eleven per-type colours are unreadable as a legend, every bar repeats its full name and a Wiki button, and the mobile agenda repeats a week-long event on every day it spans, so it reads as a wall of text.
- Daily Raids can list dozens of locations and push everything below it off screen, and the whole card is one button, so its rows can't carry their own actions.
- There is no route from a Legendary Event on Home to planning it, even when a project already targets that event.

## What Changes

- **Right now band.** Token Availability and the live events merge into one first card, "Right now". Tokens become compact ring meters, capped ones first, marked by colour and a "Capped" label (no pulse). A live Home Screen Event shows its game banner as a backdrop when the datamine has one; a live Legendary Event shows the featured hero's portrait, its run and synced points.
- **Upcoming events.** A separate card lists the next three events by start, counting the Legendary Event: when no Legendary Event is live and the next one would not make the top three, it takes the third row. Every Legendary Event row (live or upcoming) carries a plan action: "Open project" when one project targets the event, a menu when several do, else "Plan this event", which opens the event's plan wizard (`/legendary-events/:eventId/plan`).
- **Layout.** Right now; then Daily Raids (wider, 3/5) beside Upcoming events (2/5) on desktop; then Your Projects full width in a responsive grid; then the calendar. Mobile stacks in that source order.
- **Daily Raids** shows its first 10 locations with a "Show N more" / "Show less" toggle. The card no longer navigates as a whole; an "Open Today" header link replaces it.
- **Your Projects** gains an "All projects" header link and lays cards out in a 1/2/3-column grid.
- **Game icons.** A new `eventIcon()` / `homeScreenEventBanner()` / `countdownIcon()` API in `@workspace/game-catalog` maps event definitions to datamined art (51 new sprites), with the existing Lucide icon as fallback; `EventIcon` in `@/shared/ui` renders it.
- **Calendar.** Eleven type colours collapse to five families (Campaigns, Hero events, PvP, Guild, Passes & boosts) shown as a left stripe on a neutral bar, with a game icon on every bar; one-day bars are icon-only. Clicking a bar opens a details popover with the full name, local date range, live/projected state and the Wiki link, which leaves the bar. The mobile agenda lists events already running when the range starts once under "Ongoing" with "ends in …", then each day lists only what starts or ends on it plus its one-day events.
- **Tour** steps follow the new layout: Right now, Daily Raids, Upcoming events, Your Projects, calendar navigation, calendar.

Non-goals:

- HSE points or progress in Right now: that needs the HSE projection inputs, which Home does not load.
- Project progress bars: `home-projects-widget` already descopes the attainment summary; unchanged.
- Swapping `EventTypeIcon` for `EventIcon` on other pages (HSE tab, LE hub). Follow-up.
- Illustrated empty states.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-events-widget`: becomes "Upcoming events" plus the live half of Right now; Legendary Event pin and plan action; game icons and HSE banner.
- `home-token-availability`: renders inside Right now; ring meters, capped first, no pulse.
- `home-raids-widget`: position beside Upcoming events; 10-location cap with show more; header link instead of whole-card navigation.
- `home-projects-widget`: position after the Raids row, full width; header link.
- `home-events-calendar`: five colour families with game icons; Wiki moves into a details popover; mobile agenda with Ongoing.

## Impact

- `apps/web/src/fsd/pages/home/**` (model and UI), `apps/web/src/fsd/shared/lib/event-colors.ts`, `apps/web/src/fsd/shared/ui/event-icon.tsx`.
- `packages/game-catalog/src/game-entities/icons/event.ts` (new public API), `packages/ui/src/styles/globals.css` (five `--event-family-*` tokens).
- `apps/web/datamine/sprites.txt` and `apps/web/public/game_catalog/datamines/**` (51 sprites, pin unchanged at `v1.43.157.2989`).
- Locales en/de/es/fr: `common.json` (`home.rightNow`, `home.events`, `home.raids`, `home.projects`) and `events.json` (`families`, `agenda`, `details`, tour steps).
- No API change; no companion `tacticus-planner-api` change.
