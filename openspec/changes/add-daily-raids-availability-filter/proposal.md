## Why

A tester explicitly asked for a "Show only available" style control on
Dailies (`DAILY-06`). The filtering mechanism already exists —
`RaidSchedule`'s `emphasis="location"` prop gates `isLocationVisible`
(hides a node once its real synced attempts today reach zero) — but Today
applies it unconditionally with no user control, while Raids Plan never
applies it at all and exposes no toggle either. Raids Plan is the actual
gap: a user reviewing their multi-day plan has no way to hide today's
already-exhausted nodes from that view.

## What Changes

- Add a "Show only available" toggle to Raids Plan's whole-plan summary
  row, alongside the existing density and "Show all days" controls,
  defaulting to off (preserving Raids Plan's current "show everything"
  behavior for users who never touch it).
- When enabled, the toggle hides exhausted nodes (real attempts-left today
  reached zero) from the Today/Day-1 column only. Day 2 onward have no
  real synced attempts-left data to filter on — the simulated plan's
  per-day attempt caps are a projection, not a record of what's actually
  been used — so they are unaffected by this toggle, matching how
  `daily-raids-today` already scopes this exclusion to "today only (not a
  multi-day plan)".
- Today's page keeps its current, already-specified unconditional hiding
  of exhausted nodes unchanged — this proposal does not touch or weaken
  that existing `daily-raids-today` requirement, since DAILY-06's own
  acceptance criteria call for preserving existing workflow.

## Capabilities

### Modified Capabilities

- `daily-raids-plan`: gains a new requirement — a user-controlled toggle
  that hides Day 1's exhausted nodes, off by default, with no effect on
  Day 2 onward.

## Impact

- `apps/web/src/fsd/pages/dailies/ui/raids-plan-page.tsx` — new toggle
  state, passed as `emphasis`/`attemptsLeftByBattle` to only the Day 1
  `RaidSchedule` call.
- Translation addition (`dailies.json`, all four locales) for the new
  toggle's label.
- No changes to `today-page.tsx`, `raid-schedule.tsx`,
  `location-visibility.ts`, or the `daily-raids-today` capability — the
  existing predicate and prop are reused as-is.
- No backend/API changes — apps-only, no companion
  `tacticus-planner-api` change.
