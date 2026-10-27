## Why

Following the Shops fold-in (`fold-shops-into-raids`), the next daily action to bring onto Dailies > Raids is Onslaught (UserJot "One 'What should I do today' page"). The plan already spends the account's Onslaught tokens across goals in priority order (#326) and Plan > Schedule lists them per day, but the Raids tab, where the player decides what to do today, does not.

## What Changes

- Add an "Onslaught" section to the Raids tab, after the raid lanes and before Shop recommendations, listing today's Onslaught runs per unit (expected runs and shards) in goal-priority order, from the same run Today's raids come from.
- Its header badge shows today's whole tokens to spend (the expected runs, rounded up).
- The section is left out when no goal needs an Onslaught run today.
- The Schedule day card's Onslaught row list is extracted as `OnslaughtRunList` and reused, so both surfaces render runs the same way.
- Add a Today tour step for the section.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-raids-today`: Today lists today's Onslaught runs.

## Impact

`pages/dailies/ui/today-page.tsx`, `today.tutorial.tsx`, `features/daily-raids/ui/plan/plan-onslaught-runs.tsx`, `features/daily-raids/model/plan-day-cells.ts` (exports `buildOnslaughtRuns`), the `dailies` locale files (new `today.onslaughtSummary` and `tour.today.steps.onslaught` keys in en/de/es/fr) and tests. No API or data change.
