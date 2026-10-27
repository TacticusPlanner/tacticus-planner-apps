# Tasks

All paths are under `apps/web/src/fsd` unless stated. Commands run from the repository root (`pnpm --filter web exec vitest run <file>` for one file).

## 1. Filter, then pick

- [x] 1.1 In `features/goal-farming/lib/select-farm-nodes.ts`, filter candidates before the least-energy pick; `classifyNeed` reports `FilteredOut` only when no candidate passes. Update doc comments in `estimate.domain.ts`, `estimate-plan.ts` and `home-screen-event-farm.ts`. Verify: `estimate-node-filter.test.ts` covers fallback to the cheapest passing node, filtered out when none pass, and pinned nodes.
- [x] 1.2 Reword the `FilteredOut` blocker reason in `public/locales/{en,de,es,fr}/common.json`. Verify: no "preferred" wording left.

## 2. Engine options

- [x] 2.1 Add `fewerRaids` to `EstimatePlanParams`, passed through `classifyNeed` to `pickFarmNodes` as a highest-`energyCost` tie-break. Verify: unit tests for two tied nodes at different costs, and pinned nodes unaffected.
- [x] 2.2 Add `combineGoals` to `EstimatePlanParams`: a pooled day loop in `runPlanSchedule` over all stages of all pending goals, credited to the highest-priority goal needing each resource. Verify: unit tests show a lower-priority goal's longer material is raided first, entries keep goal ids, and stage needs are consumed.

## 3. Today quick filters

- [x] 3.1 Quick-filter model in `features/daily-raids` (values, URL parse/serialize hook); `useDailyRaids` and `calculateDailyRaids` take `{ fewerRaids, combineGoals }`, Today and Bonus Raids only. Verify: hook test for parsing and toggling.
- [x] 3.2 Chip row UI next to the Raids Filters trigger on Today, multi-select, with tooltips and one note line per active chip; strings in `public/locales/{en,de,es,fr}/dailies.json`. Verify: `today-page` test toggles each chip and sees the note and URL change.

## 4. Verification

- [x] 4.1 Run targeted tests, `pnpm typecheck`, ESLint on changed files, `pnpm lint:fsd` and `git diff --check`.

## 5. Manual verification and tour

- [x] 5.1 Chip row at 1280px and 420px (iframe emulation) in en, de and fr: caption and chips under the controls row, tooltips, one note per active chip, both on together, `?quick=` updates and survives reload, plain Raids link shows both off, no horizontal scroll or clipped labels, Space/Enter/arrow keys toggle and move between chips.
- [x] 5.2 Two toggles less than the URL commit time apart (about 1.2 s on a large account) both stick. Verify: `today-quick-filter-chips.test.tsx`.
- [x] 5.3 Bottlenecks puts lower-priority goals' Legendary materials on Today and Bonus Raids under their goal groups; Home raids widget unchanged.
- [x] 5.4 Raids Filters excluding Elite move a material to its cheapest passing node (Plasma Cell: Saim-Hann Elite 1 to Mirror nodes); the filtered-out notice, its pinned-goal line and Reset still work.
- [ ] 5.5 Fewer raids changes a pick. Blocked: no material in the current catalog has tied cheapest nodes at different energy costs, so the chip has no visible effect today (same as V1's setting). Covered by `estimate-quick-filters.test.ts`.
- [ ] 5.6 HSE tab farm list. Not applicable this week: the live event (Faction Focus) earns no points from campaign raids.
- [x] 5.7 Today tour step for the chip row (`today-quick-filters`), strings in `tour.today.steps.quickFilters`. Verify: `dailies-tutorial.test.tsx`.

## Notes (as built)

- Engine tests: `features/goal-farming/lib/estimate-node-filter.test.ts` (filter-then-pick, Bonus Raids) and the new `estimate-quick-filters.test.ts` (Fewer raids, Bottlenecks, shared materials, stages).
- Page test: `pages/dailies/ui/today-page.quick-filters.test.tsx` (chips, notes, URL, restore). `today-page.raids-filters.test.tsx` now expects Today to pass `quickFilters` to `useDailyRaids`.
- In Bottlenecks mode a row's "N upgrades left" (`remainingBefore`) is the pooled remaining across goals, since the raid serves all of them.
- The Today tour has a step for the chip row, right after Raids Filters.
- Manual check 2026-10-27 on a synced account (several projects and goals, Legendary rank goals): see section 5. The `FilteredOut` reason string is not shown on Today (the notice has its own copy); its wording was checked in the four `common.json` files.
