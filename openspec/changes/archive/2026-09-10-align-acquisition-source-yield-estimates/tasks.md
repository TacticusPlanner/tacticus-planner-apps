## 1. Estimate engine: per-source attribution

- [x] 1.1 Add `key: string` to `FlatSupplier` in `features/goal-farming/model/estimate.domain.ts`; add optional `flatSupplyBySupplier?: ReadonlyMap<string, number>` to `EstimateOutcome`. Verify `pnpm --filter web exec tsc --noEmit` still passes after the type-only change.
- [x] 1.2 Change `applyFlatSuppliers` (`lib/estimate.ts`) to also return per-supplier applied amounts (keyed by `supplier.key`) without changing the per-resource behavior. Verify existing `estimate.test.ts` flat-supplier cases still pass.
- [x] 1.3 Accumulate `flatSupplyBySupplier` across days in `estimateGoal` and include it in the `Estimated` outcome (and the zero-day early return). Verify a new `estimate.test.ts` case: two suppliers on the same resource id report separate totals that sum to the satisfied need.
- [x] 1.4 Mirror the accumulation in `estimate-plan.ts`'s per-goal loop; expose `flatSupplyBySupplier` per goal in its result. Verify `estimate-plan.test.ts` passes and add a case asserting per-goal per-supplier totals.
- [x] 1.5 Set `key` in `projectShopSupply` (`= offer.offerId`) and `projectOnslaughtSupply` (`= isMythic ? "onslaught:mythic" : "onslaught:regular"`); export the `1.5` run cadence as a named constant. Verify `shop-supply.test.ts` passes with an added assertion on `key`.
- [x] 1.6 Update `goal-acquisition.ts` only as needed to satisfy the new `FlatSupplier.key` field (pass through; no behavior change). Verify `goal-acquisition` tests and `pnpm --filter web run lint:fsd` pass.

## 2. Preview model: shards/day and contribution readout

- [x] 2.1 In `use-progression-preview.ts`, compute the Onslaught reward `key` from the character's current progression/rarity only (via `isMythicProgression` on `playerEntity.progressionIndex ?? progressionStart`), and compute `onslaughtShardsPerRun` whenever `onslaughtProgress && rewards?.length` (drop the `plan.onslaught.enabled` and `mythicShards > 0` gates; keep the Character + `ascensionEnabled` gate). Verify a new test: yield unchanged when the target tier is raised across Mythic.
- [x] 2.2 Add `onslaughtShardsPerDay` (= per-run × cadence constant) to the preview return. Verify a unit test on the returned value.
- [x] 2.3 Add `shopShardsPerDayByOffer: Map<offerId, number>` (weekly `projectShopSupply` supply ÷ 7) and a selected-offers sum. Verify a test using the guaranteed-daily fixture (5×2 over 3 days → ≈4.3/day).
- [x] 2.4 Add `campaignShardsPerDay` / `campaignMythicShardsPerDay` derived from `selectFarmNodes` + `dropRate` at `dailyEnergy` over the selected/default nodes, energy-capped across nodes. Verify tests for a single node, an attempt-capped node, and two nodes.
- [x] 2.5 After `estimateGoal`, derive `onslaughtTokens` (`ceil(sum of onslaught keys / onslaughtShardsPerRun)`, only when `> 0` and Onslaught selected) and `shopCurrencySpend: {currency, amount}[]` (`ceil(bySupplier[offerId] / offer.rewardQty) * offer.cost.amount`, grouped by `offer.cost.currency`, only for selected offers). Verify a test covering the two-Guild-offer aggregation and the deselect-clears case.

## 3. i18n

- [x] 3.1 Add `goals.create.acquisitionSources.shardsPerDay`, `.onslaughtTokens`, `.shopCurrencySpend` to `apps/web/public/locales/en/common.json` and adjust/keep `.onslaughtYield`. Verify `pnpm --filter web run lint` (knip/i18n) passes and de/es/fr are left to the existing translation-debt backlog (note it in the change).

## 4. Picker UI: uniform shards/day + always-on Onslaught + link

- [x] 4.1 In `acquisition-source-field.tsx`, render the Onslaught yield/prompt block whenever `showOnslaught` (not only when `onslaughtEnabled`); show it as "≈ X shards/day" using `shardsPerDay`. Verify updated `acquisition-source-field.test.tsx` renders the figure with the group unchecked.
- [x] 4.2 Change the Edit-progress link to `to="/progress/onslaught"` and call a new `onNavigateAway` prop on click. Verify a test asserts the href and that the callback fires.
- [x] 4.3 Add a per-offer "≈ X shards/day" line to `ShopOfferRow` (from `shopShardsPerDayByOffer`) and a shards/day line to the Campaigns group header area (from `campaignShardsPerDay` / mythic). Verify `acquisition-source-field.test.tsx` covers a shop row and the campaigns figure.
- [x] 4.4 Thread `shopShardsPerDayByOffer`, `campaignShardsPerDay`, `campaignMythicShardsPerDay`, and `onNavigateAway` from `goal-type-cards.tsx` into both `AcquisitionSourceField` usages. Verify `tsc --noEmit` passes.

## 5. Sheet wiring: close without reset

- [x] 5.1 In `create-goal-sheet.tsx` pass `onNavigateAway={() => onOpenChange(false)}` into the form/cards path; expose it through `useCreateGoalForm`'s return. Confirm no `resetForm` is called on close (existing behavior). Verify a new `create-goal-sheet.test.tsx` case: fill unit + target, click Edit Onslaught progress, sheet closes, reopen shows the same unit/target/selection.

## 6. Resources-needed preview lines

- [x] 6.1 In `goal-farming-fields.tsx` `ProgressionPreview`, render an Onslaught-tokens line when `preview.onslaughtTokens > 0` and one line per `preview.shopCurrencySpend` entry (icon + `shops:currency.*` label), placed with the shards/orbs/energy lines. Verify a preview test: campaign-only shows no such line; Onslaught+shop selection shows both.

## 7. Full verification

- [x] 7.1 Run `pnpm --filter web exec tsc --noEmit`, `pnpm --filter web run lint`, `pnpm --filter web run lint:fsd`, and `pnpm --filter web exec vitest run src/fsd/features/goal-farming src/fsd/pages/goals` — all green.
- [ ] 7.2 Manual UI check via the Aspire stack (authenticated): open Create Goal → Ascension for a Character, confirm all three groups show "≈ X shards/day", Onslaught figure shows while unchecked and is stable when the target tier changes, "Edit Onslaught progress" lands on `/progress/onslaught` and the reopened sheet keeps state, and selecting Onslaught + a shop offer adds token/currency lines to "Resources needed" that drop when deselected.
