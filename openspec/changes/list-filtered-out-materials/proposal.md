## Why

Players asked for V1's blocked upgrades list on the raids page ("Blocked upgrades: respect raid filters and show them with the raid plan" on UserJot). V1's Daily Raids page listed every material with no usable node after the raid filters, with its progress and the units waiting on it. V2's Today already knows exactly which materials the Raids Filters left without an allowed node, but its filtered-out notice only gives a count ("3 materials have no allowed location with these filters"), so the player can't tell what the plan is skipping.

Plan, Goals and Insights stay unfiltered, as V1's Goals page was and as `daily-raids-filters` already requires, so "Can't be farmed" in Insights does not change.

No companion API change: everything the notice lists is already in the daily-raids view model.

## What Changes

- Today's filtered-out notice lists each filtered-out material once, in plan priority order: its icon and name, the player's have/need over the run's goals, a **Pinned** badge when a goal pinned it to an excluded location, and the icons of the goals waiting on it.
- It shows five materials, then a **Show all N** / **Show less** toggle.
- Beside **Reset filters**, a link to Plan > Insights for what no node drops at all.
- The count sentences and the pinned wording stay as they are.

## Capabilities

### Modified Capabilities

- `daily-raids-filters`: the filtered-out notice lists the materials and the goals waiting on them.

## Impact

- `features/daily-raids`: `groupFilteredOutByMaterial` (`model/raids-filters/filtered-out-materials.ts`), `FilteredOutNotice` now takes the ready view model.
- `pages/dailies/ui/today`: `today-dashboard.tsx`, `today-plan-card.tsx` pass the view model.
- `public/locales/{en,de,es,fr}/dailies.json`: `raidsFilters.filteredOut.listLabel`, `pinnedBadge`, `showAll`, `showLess`, `insights`.
