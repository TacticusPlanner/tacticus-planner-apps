## Why

The V2 Today raid schedule presents recommended resources in unstable
calculation/insertion order, so resources that take longest to farm can be
buried below faster work. Its Today's Attempts section also replaces the
synced number of raids with "Max raids" once a node is exhausted, losing the
actual activity the player performed. These are regressions from the useful
V1 planning behavior reported in issue #91.

## What Changes

- Order each Today's and Bonus Raids goal group deterministically by farming
  urgency: the resource with the longest estimated completion time first, then
  the greatest estimated energy cost; retain the configured goal-priority
  grouping as the primary ordering boundary.
- Make the shared raid calculation expose the per-resource urgency data used
  for that presentation, rather than reproducing estimate logic in the page.
- Render every resolved standing-campaign location with a positive synced
  `attemptsUsed` value in Today's Attempts, including exhausted nodes.
- Always show the actual synced `attemptsUsed` count in Today's Attempts;
  reserve "Max raids" for the simulated schedule/Bonus Raids location state.
- Add regression coverage for deterministic resource ordering and for
  exhausted attempted nodes retaining their actual count.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-raids-today`: order Today and Bonus Raids resources by the V1
  time-investment priority and show actual attempt counts for all real
  standing-campaign attempts.

## Impact

- Affects the shared goal-farming schedule/view-model mapping and the Dailies
  Today page under `apps/web/src/fsd/pages/dailies`.
- Adds/updates unit and UI tests in the same Dailies and goal-farming slices.
- Changes no API, persistence format, routes, or project-selection behavior.
