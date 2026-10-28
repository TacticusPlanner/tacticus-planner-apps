# Design

## Context

See proposal.md, Why. Home is `pages/home`: `home-page.tsx` composes five cards; the events card read the Home Screen Event calendar (`features/daily-raids`) and the Legendary Event catalog plus progress (`entities/legendary-event`) itself. Event colours come from `shared/lib/event-colors.ts`; event icons were Lucide glyphs (`EventTypeIcon`). Datamine sprites are listed in `apps/web/datamine/sprites.txt`, copied by `pnpm datamine:sprites` and addressed with `datamineAssetUrl()`.

## Goals / Non-Goals

**Goals:** the live state of the account (tokens, live events) is the first thing on Home; event rows and calendar bars use the game's art; the calendar legend fits on one line; Daily Raids can't push the page; a Legendary Event on Home always links to planning it.

**Non-Goals:** see proposal.md.

## Decisions

### One read of Home's events, two cards

`model/use-home-events.ts` reads both sources once and `selectHomeEvents()` (`model/select-home-events.ts`, pure) splits rows into `live` and `upcoming`. `HomePage` passes the state to `RightNow` (live) and `UpcomingEvents` (upcoming). One instant (`nowMs`) selects and labels both lists. A source failure is reported once, in Upcoming events; Right now shows "Nothing live" for it.

Alternative: each card reads the sources. Rejected: two reads, and the cards could disagree for a minute around a boundary.

### Legendary Event pin

`selectHomeEvents` takes the first three upcoming rows by start. When no Legendary Event is live and the next upcoming one is not among them, it replaces the third row. The pin is a selection rule, so it lives in the model and is unit-tested there.

### Plan action reuses `useEventProjects`

`features/project-management` already exports `useEventProjects(eventId)` (projects whose target is `legendaryEvent` with that `eventId`). The page-level `LegendaryEventPlanButton` renders it: one project, a link to `/plan/goals?project=<id>`; several, a dropdown of those links; none, hidden or failed reads, a link to `/legendary-events/:eventId/plan`. It is a sibling of the row link, never nested inside it.

### Event art lives in `@workspace/game-catalog`

`icons/event.ts` maps definition id first (HSE themes, Double XP/Gold), then Faction Boost by its `targetFactionId` parameter, then definition type. The HSE id to theme mapping follows `tacticus-planner-api` `EventDatamineReader.cs`. Ids with no art return `undefined`, and `EventIcon` (`shared/ui`) falls back to the existing `EventTypeIcon`, so a new event type never renders blank. A Faction Boost for a faction without its own medallion uses that faction's icon.

### Five families instead of eleven colours

`resolveEventFamily(definitionType)` in `shared/lib/event-colors.ts` groups types: Campaigns (Campaign Event, Incursion, Quest), Hero events (Legendary Event, New Character Event, Home Screen Event), PvP (Tournament Arena), Guild (Guild Raid, Guild War, Crusade), Passes & boosts (Battle Pass, Shop Event, Game Version Release, Standing Modifier), Other. Colours are `--event-family-*` tokens in `packages/ui` globals, with dark-mode values. `eventBarClass` and `EventColorKey` stay for the other pages that still use them.

### Desktop and mobile split

|                  | Desktop (≥768px)                                                    | Mobile (<768px)                                                    |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Right now        | tokens and live events side by side (`lg`)                          | stacked                                                            |
| Raids / Upcoming | one row, 3/5 and 2/5 columns                                        | stacked: Raids, then Upcoming                                      |
| Projects         | 2 or 3 column grid, uncapped                                        | 1 column, capped at 3 with "+N more" (unchanged)                   |
| Calendar         | week grid; bars with family stripe and icon, one-day bars icon-only | agenda: Ongoing strip, then per-day starts/ends and one-day events |
| Details          | popover from a bar                                                  | popover from an agenda row or Ongoing tile                         |

Tour targets are the same `data-testid`s on both forms (`home-right-now`, `home-raids-widget`, `home-events-widget`, `home-projects-widget`, `events-calendar-navigation`, `events-calendar`), so desktop and mobile share one step list.

### Mobile agenda

`buildEventsAgenda(days, rangeStart)` (`model/events-calendar-calc.ts`, pure) derives the agenda from the same `EventsCalendarDay[]` the grid uses, so both forms read one result. `ongoing` is every multi-day entry that started before `rangeStart`, once, ordered by end; each day keeps one-day entries and entries that start or end on it, and empty days are dropped.

### FSD

All new UI is page-local under `pages/home`. `EventIcon` is in `shared/ui` and event families in `shared/lib` because the HSE tab and LE hub are expected to adopt them. No page-to-page or feature-to-feature import is added; `lint:fsd` passes.

## Risks / Trade-offs

- Banner art exists for most HSE themes but not warp surge, psyker, the AdMech and Space Wolves Faction Boosts, or Against the Tide; those tiles render without a backdrop. Acceptable: the tile is complete without it.
- Grouping Home Screen Events with Legendary Events as "Hero events" loses the per-type colour; the icon now carries the type.
