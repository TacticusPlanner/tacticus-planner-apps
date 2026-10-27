# Proposal

## Why

V1's Goals page had a "Color Coding" toggle that tinted each goal by whether its estimated finish lands in the current, next or following Battle Pass or Guild Raid season. Players used it to plan a season: add goals until the first yellow one, and everything above it fits this season. V2 dropped it, and the UserJot request [Restore Color Coding for Event Goal Planning](https://tacticusplanner.userjot.com/board/p/restore-color-coding-for-event-goal-planning) (Planned, 3 votes) asks for it back. The requester's conditions from the comments: spill-over into the next season must be obvious, and badge (ability) goals keep ignoring it.

V1 behaviour, reverse-engineered (`tacticusplanner` `src/routes/goals/goal-service.ts` `getBackgroundColor`, `goal-color-coding-toggle.tsx`): finish date = today + raid `daysLeft` - 1; offset = season index of that date - season index of now; 0 green, 1 yellow, 2 red, 3+ none. Battle Pass = 35-day cycles from a hard-coded 24 May 2026 anchor; Guild Raid = 14-day cycles from a hard-coded 3 Dec 2025 05:00 UTC anchor. Its flaws, which this change does not copy: it ignores XP days (the tint can disagree with Done By), the anchors drift silently, and colour is the only signal.

V2 already has the inputs: the per-goal Done By date from the global plan (`goal-list-estimate-display`) and season definitions in the events catalog (`game-events-calendar`: `battle-pass` and `guild-war-season` are `Fixed` recurrences).

Agreed scope (Severyn, 27 Oct): Phase 1 only; modes Battle Pass, Guild Raid and Guild War; on the all-goals plan and when Goals is scoped to a project. Project season/date targets (Phase 2) go to a separate UserJot request.

## What Changes

- A **Season fit** select in the Goals toolbar: Off (default), Battle Pass, Guild Raid, Guild War. Persisted per browser; the same value applies whether Goals is unscoped or scoped to a project.
- Season windows come from the catalog: cycle starts projected from a `Fixed` definition's anchor and interval for any date, with an authored occurrence's start replacing its projected slot. A mode whose definition yields no current season is disabled in the select with a reason.
- Each estimated, in-flight, non-Ability goal gets a fit label beside its Done By date ("This season", "Next season", "In 2 seasons", "Later") with a tooltip naming the deadline, and a coloured left accent on its row (desktop) or card (mobile). Colour never carries the meaning alone.
- In priority order (Group = None), a divider sits before the first goal that finishes after the current season: "Battle Pass season 42 ends Nov 15. Goals below finish later."
- Ability goals, Reached, Paused, Blocked and unestimated goals get no label or accent and never place the divider.
- i18n in en/de/es/fr, a Goals tour step for the new control, and three new colour tokens in `packages/ui` globals.

## Capabilities

### New Capabilities

- `goal-season-fit`: the Season fit control, season window resolution, per-goal fit label and accent, and the season cut-off divider on the Goals page.

### Modified Capabilities

- none (the Done By cell keeps its content; the fit label is added beside it by `goal-season-fit`).

## Impact

- `apps/web/src/fsd/features/goal-planning/model/season-fit/` (new: pure window + fit logic, hook), exported through the `goal-planning` public API.
- `apps/web/src/fsd/pages/goals/ui/goals-board/` (`goals-page.tsx`, `goals-toolbar` wiring, `goals-list.tsx`, `goal-table-row.tsx`, `goals-mobile-cards.tsx`, `goal-row-shared.tsx`, `goals-page.tutorial.tsx`, new `season-fit-select.tsx`, tests).
- `packages/ui/src/styles/globals.css` (season-fit accent tokens, light and dark).
- `apps/web/public/locales/{en,de,es,fr}/common.json`.
- Companion API change `add-goal-season-fit` in `tacticus-planner-api` (decided 27 Oct): Guild Raid mode needs the `guild-raid-season` definition to become a `Fixed` recurrence (14-day interval) in `tacticus-planner-api`'s curated `event-definitions.json`, which reverses the `guild-raid-current-status` rule "Guild Raid seasons SHALL NOT be projected from a guessed recurrence". Until that lands, Guild Raid mode renders disabled; the web code needs no change when it does. If adopted, the API change carries this change's name and applies first.
- No new dependencies.
