## 1. Engine

- [x] 1.1 Add `shopEntries` (goalId, offerId, expectedShards) to `RaidDaySchedule` from the per-day `bySupplier` in `estimate-plan.ts`; keep raid entries and every estimate output unchanged
- [x] 1.2 Engine tests: guaranteed offer on its weekdays, rotating-slot probability, campaign-only goal has none, and an unchanged-estimate regression with/without shop offers

## 2. Plan model

- [x] 2.1 Resolve entries to purchases/currency per shop and unit in `plan-day-cells` (`PlanDayCells.shops`); make `units` the union with shop-entry units so `buildPlanUnitRanges` covers shop days
- [x] 2.2 Model tests: shop-only unit appears in units and ranges; purchases and currency rounding

## 3. Schedule UI

- [x] 3.1 Render the "Shops" section after "Raided" in the day card (desktop and mobile), within the fixed height and scrolling grid
- [x] 3.2 Show shop-only units in the day card's unit icons and the filter bar; dim non-matching shop rows when a unit is selected
- [x] 3.3 i18n keys (all locales); update the Schedule tour step if it describes the day card
- [x] 3.4 UI tests: section order, no section on days without purchases, shop-only goal, filter dimming and jumps

## 4. Remaining column

- [x] 4.1 Compute the shop-currency chip from per-source attribution (still-missing basis) and render it with currency icon and name
- [x] 4.2 Tests: shop-only goal, owned shards excluded, mixed sources, campaign-only shows none

## 5. Onslaught on Schedule

- [x] 5.1 Emit `onslaughtEntries` (goalId, expectedShards, runs) per plan day from the `onslaught:*` supplier attribution in `estimate-plan.ts`; estimates and token totals unchanged
- [x] 5.2 Engine tests: constant supply with runs, no entries without Onslaught, estimate unchanged
- [x] 5.3 `plan-day-cells`: `onslaught` entries per unit, units union and ranges; model tests
- [x] 5.4 Day card "Onslaught" section after "Shops" (desktop and mobile), filter dimming, i18n in all locales, tour text; UI tests

## 6. Verify

- [x] 6.1 Run web tests and lint; verify in the browser with the shop-only Unlock goal on Schedule and Goals (desktop and mobile)
