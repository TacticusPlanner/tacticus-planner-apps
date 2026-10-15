## 1. Engine

- [x] 1.1 Add `remainingBefore` to `RaidBreakdownEntry` and set it in `spendDay`; cover it with a `spendDay` test across two nodes.

## 2. Today and Home rows

- [x] 2.1 Add `plannedRaidNeed` (model) and `PlannedRaidNeedBadge` (ui) in `features/daily-raids`, with unit tests for below-cap, at-cap, rounding, shards, and uncapped nodes.
- [x] 2.2 Use the badge on Today/Bonus resource cards (`resource-card.tsx`) instead of the raid count / "Max raids"; drop the raid count from location chips.
- [x] 2.3 Carry `remainingBefore` through `flattenTodayLocations` (summed for the row's resource) and use the badge in Home's `location-row.tsx`.
- [x] 2.4 Add `schedule.upgradesLeft` / `schedule.shardsLeft` and remove `schedule.maxRaids` / `schedule.node` in en/de/es/fr.
- [x] 2.5 Update `raid-schedule`, `flatten-today-locations`, `plan-day-cells` tests and fixtures.

## 3. Verification

- [x] 3.1 Run `pnpm typecheck`, `pnpm test:run`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format`; verify all pass.
- [ ] 3.2 Desktop and mobile check on Today and Home with a populated plan: below-cap rows show "N upgrades left", capped rows show nothing, Today's Attempts still shows real counts.
