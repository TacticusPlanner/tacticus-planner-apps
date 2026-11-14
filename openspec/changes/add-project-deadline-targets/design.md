## Context

`project-event-target` stores `{ kind: "legendaryEvent", eventId }` on a project and shows "LE · Uthar". Season fit (`goal-season-fit`) already resolves Battle Pass, Guild Raid and Guild War cycle starts from the catalog's `event-definitions` (all three are `Fixed`, with `seasonNumberAtAnchor`). The LE pages already compute run starts, including estimates for unannounced runs (`legendary-event-run-date-estimate`). This change composes those into a project deadline.

## Goals / Non-Goals

**Goals:** every target kind agreed on 3 Nov, one resolver, and no change to how Season fit or the LE pages behave.

**Non-Goals:** showing which goals fit (`add-project-deadline-fit`); server-side deadlines; more than one target per project.

## Decisions

1. **Owning slices and public APIs.**
   - `entities/game-event` (new): `resolveSeasonWindows` and `SeasonWindows`, moved unchanged from `features/goal-planning/model/season-fit/season-windows.ts`, plus a new `seasonStartMs(definition, occurrences, season)` for pinned seasons. Public API: `@/entities/game-event`. `features/goal-planning` Season fit imports it from there.
   - `entities/legendary-event`: `legendaryEventRunDates` and its types, moved from `pages/legendary-events/lib/run-dates.ts`. The page re-imports them from the entity.
   - `entities/project/model/deadline/`: `resolveProjectDeadline`, `projectTargetLabel` and `nextTarget` (for Move to next season). It reads the two entities through `@x` files (`entities/game-event/@x/project.ts`, `entities/legendary-event/@x/project.ts`). `useProjectDeadline(project)` wraps it with `useCatalogDataset` and the LE catalog.
   - No page-to-page or feature-to-feature import is added. `add-project-deadline-fit` consumes `useProjectDeadline` from `@/entities/project`.
2. **One canonical result.** `ProjectDeadline = { status: "loading" } | { status: "unavailable" } | { status: "ready"; deadlineMs; seasonNumber?; run?; estimated; ended }`. The chip, the tooltip, the ended action and the fit view (next change) all derive from it.
3. **Deadline instants** (pure function, `nowMs` injected):
   - Battle Pass and Guild Raid, season S: the start of season S+1 (= the end of S, as in Season fit). Rolling: the current season's deadline.
   - Guild War, season S: the start of season S. Rolling: the first season start after now.
   - Season starts come from `anchorUtc + (S - seasonNumberAtAnchor) * intervalDays`, with an authored `events-calendar` occurrence replacing the projected start of its slot (Season fit's rule).
   - Legendary Event, run N: run N's `startMs` (the earliest estimate when unannounced, so plans stay safe). `estimated` is true when the run is unannounced. "Next run" is the first run whose start is after now; when run 3 has started, the target is ended.
   - Custom date D: 00:00 UTC on D + 1 day.
4. **Season picker range.** The next 5 seasons whose deadline is after now: for Battle Pass and Guild Raid the current season and the next 4, for Guild War the next 5 season starts. Rolling is listed first.
5. **Ended.** Only a pinned season, a pinned run, a "next run" after run 3 has started, or a past date can be ended. `nextTarget` gives season S+1 or run N+1. It is offered for seasons and runs 1 and 2. A run 3 or a date has no next target, so the user edits the target instead.
6. **Desktop and mobile.** The Related to field is a two-step control in the same Sheet on both forms (kind select, then detail), with no layout split. The Projects tour's step targets the same `data-testid` on both.

7. **Catalog values used in the spec examples** (3 Nov 2026): `battle-pass` season 40 at 2026-08-02T00:00Z, every 35 days; `guild-raid-season` season 112 at 2026-10-21T10:00Z, every 14 days; `guild-war-season` season 28 at 2026-10-23T09:00Z, every 35 days. All three are `Fixed`.

## Risks / Trade-offs

- Moving `resolveSeasonWindows` and `legendaryEventRunDates` touches Season fit and the LE pages. Their existing tests move with the code and keep running against the new import paths, and `pnpm lint:fsd` guards the boundaries.
- A pinned season number can drift if the catalog's `seasonNumberAtAnchor` is corrected later. That is accepted, and the chip always shows the resolved date in its tooltip.
