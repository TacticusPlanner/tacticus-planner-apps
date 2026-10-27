# Proposal

## Why

UserJot "Restore V1 Raid Settings in V2" (Planned) asks for V1's Raids settings: farm order (Goals priority vs Total materials), location strategy (Least energy, Least energy with fewest raid tickets, Custom) and the HSE pick. The comments show every one of these is a temporary switch: "Fewest tickets" when low on raid tickets, "Total materials" now and then to find the Legendary-material bottlenecks and pre-farm them, "Custom" during HREs. The HSE and campaign-event picks are already automatic in V2, and HRE use cases belong on the dedicated HRE page.

A saved setting is the wrong shape for a temporary switch: it is easy to forget it is on. Collection already has a pattern for this, a quick-filter chip row whose state lives in the URL.

Custom locations also expose a gap in Raids Filters: the filter runs after the cheapest node is picked, so excluding the cheapest node reports the material as filtered out instead of falling back to the next-cheapest node that passes.

## What Changes

- Raids Filters apply before the cheapest-node pick: Today and Bonus Raids schedule a material on the cheapest node(s) that pass the filter. A material is reported as filtered out only when none of its nodes pass. Pinned locations are filtered as before.
- Today gets a quick-filter chip row with two chips, which can be on together. Each chip has a tooltip and, while on, a one-line note under the row explaining what it changes. The state lives in the URL (`?quick=`) and resets when the player leaves Today.
  - **Fewer raids**: among nodes tied on least energy per item, keep only those with the highest energy cost per battle (V1 "Least energy, fewest raid tickets"). Same materials for the same energy, in fewer raids.
  - **Bottlenecks**: ignore goal priority and pool the remaining materials of every in-scope goal, all stages included (V1 "By total materials"). Energy goes to the material that takes longest to finish first. Each raid is credited to the highest-priority goal still needing that material.
- The chips change Today's plan and Bonus Raids only. Plan > Schedule, Goals, Insights, the HSE/HRE tabs and the Home raids widget are unaffected.
- The filtered-out reason copy ("Every preferred location…") is reworded in en/de/es/fr.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `daily-raids-filters`: the filter becomes a candidate rule (filter-then-pick) for Today and Bonus Raids.
- `daily-raids-today`: new Today quick filters requirement (Fewer raids, Bottlenecks).

## Impact

- `features/goal-farming`: `pickFarmNodes` filters before the pick and takes a `fewerRaids` tie-break; `EstimatePlanParams` gains `fewerRaids` and `combineGoals`; `runPlanSchedule` gains a pooled day loop.
- `features/daily-raids`: `calculateDailyRaids` / `useDailyRaids` take the quick filters; new quick-filter model and chip row UI.
- `pages/dailies` (Today) renders the chip row and passes the URL state.
- Locales (`dailies`, `common`) in en/de/es/fr. No API change.
