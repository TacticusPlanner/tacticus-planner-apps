## 1. Estimate demand (depends on the API change being applied)

- [x] 1.1 Add the Upgrade range fields to the `entities/goal` types, API client and create/update request types; treat missing fields as `null`
- [x] 1.2 Add an `Upgrade` branch to `calculateGoalResourceNeed` (base upgrades via `aggregateBaseUpgrades`, `upgradeSlotsRemaining: null`); leave `calculateGoalFarmingStages` returning `null`
- [x] 1.3 Add a claiming helper in `features/goal-farming`: collect a target's slots inside the range (Character: `rankUpSlotOccurrences`; MoW: `mowAbilityUpgradeIds` per track), take overlap against the unit's covered sets, cap at the quantity, claim up to the quantity; export through `index.ts` / `@x/daily-raids`
- [x] 1.4 Wire the unit's `coveredRankSlots` / `coveredAbilityTransitions` into the Upgrade branch in `daily-raids-calc.ts`, `plan-insights-calc.ts`, `plan-net-resources.ts`, `plan-standalone-estimates.ts`, `shop-needs.ts`, `use-goals-overview-metrics.ts`
- [x] 1.5 Make the target label and goal chips render for Upgrade goals in Today (`use-daily-raids.ts`, `daily-raids-progress.ts`)

## 2. Forms

- [x] 2.1 Send `rankRange` from `use-upgrade-fields.ts` / `goal-spec-builder.ts` when creating a Character Upgrade goal
- [x] 2.2 Add per-track optional range selectors for a MoW to the Upgrade card; scope `mowRelevantUpgradeQuantities` to the set tracks
- [x] 2.3 Prefill, edit and clear the range in the Edit goal dialog (`goal-target-edit.ts`, `goal-target-fields.tsx`), sent as one replacement with the targets
- [x] 2.4 Add i18n keys for the range selectors and labels to the `goals` namespace with real en/de/es/fr translations (no English left in de/es/fr)
- [x] 2.5 Confirm no Joyride tutorial targets the Upgrade card; if one does, update its desktop and mobile steps and keys

## 3. Tests

- [x] 3.1 `goal-requirements` tests: Upgrade need (base target, owned stock, empty/no-targets → null)
- [x] 3.2 Overlap tests with the real catalog rows: Incisus Rank-first, Upgrade-first (both total 6), cap (total 2), no range (7), applied slots not counted; MoW `astraOrdnanceBattery` per-track (total 3) and one-track-unset
- [x] 3.3 `daily-raids-calc` tests: Upgrade goal appears in Today and the Plan, ordered by priority, absent when stocked, absent when Paused
- [x] 3.4 Form tests: range sent on create, MoW per-track selectors, edit prefill/clear
- [x] 3.5 Confirm a character Upgrade goal and a MoW Upgrade goal both carry a non-empty `entityId` through the estimate loop

## 4. Verification

- [x] 4.1 Run the app tests, lint and typecheck for `apps/web`
- [ ] 4.2 Shared verification (full Aspire stack): create a Rank goal and an overlapping Upgrade goal for one unit and confirm the Schedule shows the de-duplicated total
- [ ] 4.3 Desktop verification (viewport ≥ 768px): create and edit an Upgrade goal with ranges; confirm Today and the Schedule
- [ ] 4.4 Mobile verification (viewport < 768px, same-origin iframe emulation): the same flow in the sheet layout
