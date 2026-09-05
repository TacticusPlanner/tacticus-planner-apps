# Tasks

Ordered by dependency. Spec refs: `specs/goal-acquisition-source-picker/spec.md` (picker),
`specs/goal-farming-estimates/spec.md` (estimate). Design refs: `design.md` D1–D9.

## 1. Companion API change (cross-repo dependency — D6/D7)

- [x] 1.1 Land `tacticus-planner-api` OpenSpec change
      `add-goal-acquisition-sources-config` (delta on `goal-target-model`): replace
      `ascensionFarming` and the Unlock shard role of `farmingLocationIds` with
      `GoalConfig.acquisitionSources: {kind, ids}[]` (allow-list `Campaign` / `Onslaught` /
      `Shop`; `ids` = battle ids / `<shopId>:<rewardType>` / empty), plus a one-way data
      migration. Coordinated replace — **no** dual-read window. Verify: that change's
      `openspec validate --strict` passes and its `dotnet test` gate is green.
- [x] 1.2 Update the hand-written client goal types in
      `apps/web/src/fsd/entities/goal/model/types.ts` to the new contract: add
      `acquisitionSources` to `GoalConfig` / `CreateGoalConfigRequest` / `UpdateGoalRequest` /
      `CombinedGoalSpec`; remove `AscensionFarmingConfig` and the `ascensionFarming` fields.
      Verify: `pnpm typecheck` passes and no source references the removed types.

## 2. Game-catalog resolver — `resolveUnitShardShopOffers` (D3)

- [x] 2.1 Add `ShopShardOffer` type and `resolveUnitShardShopOffers(shops, unitId, {
powerLevel?, lockContext? })` to `packages/game-catalog/src/shops/shop-resolve.ts`,
      exported from the package index. Verify: `pnpm --filter @workspace/game-catalog typecheck`
      passes and the symbol is re-exported from `packages/game-catalog/src/index.ts`.
- [x] 2.2 Implement per-day grouping + probability: `probabilityByDay[d] = Σ weight(unit
bucket) / Σ weight(all day-matching buckets after PL/lock filter)`, missing `weight` ⇒ 1,
      single day-matching bucket ⇒ 1; merge same-`offerId` entries across slots (days unioned,
      per-day probability summed then clamped to 1). Verify: unit tests in
      `packages/game-catalog/src/shops/shop-resolve.test.ts` cover a guaranteed daily offer
      (p=1 every listed day), the Guild `bloodIntercessor`/`worldExecutions` rotating slot
      (p≈0.5 on TUE/FRI, absent elsewhere), a PL/lock-excluded variant raising the survivor's
      p, and a unit with no matching offer (empty result).
- [x] 2.3 Distinguish `shards_<unit>` vs `mythicShards_<unit>` on the returned `isMythic`
      flag and `rewardType`. Verify: a test with the Rogue Trader `eldarFarseer` regular **and**
      mythic offers returns two `ShopShardOffer`s with distinct `offerId` and `isMythic`.

## 3. Estimate engine — flat suppliers (D5)

- [x] 3.1 Add `flatSuppliers?: Array<{ resourceId: EstimateResourceId; supplyOnDay: (i:
number) => number }>` to `estimateGoal` and `estimatePlan` in
      `features/goal-farming/lib/estimate.ts`; before each `spendDay`, subtract
      `min(supplyOnDay(dayIndex), remaining)` per supplier resource against the shared
      `remaining` map. Leave `spendDay` unchanged. Verify: a new
      `estimate.test.ts` case with a 100-shard need, one campaign node, and a constant
      10/day flat supplier completes in fewer days than campaign-only and the day count matches
      a hand-computed additive simulation.
- [x] 3.2 Track a `flatSupplyTotal` (per resource) alongside `energyTotal` / `raidsTotal`
      in the returned `EstimateOutcome`; derive nothing that a consumer would otherwise
      recompute (D4). Verify: the test from 3.1 asserts `flatSupplyTotal` + campaign-farmed
      shards == the need, and no negative/surplus is reported.
- [x] 3.3 Treat a shard need with **no** farm nodes but a matching `flatSupplier` as
      estimable rather than `blocked("NoFarmLocation")`. Verify: a test with zero campaign nodes
      and a 10/day supplier returns `status: "Estimated"` with `days = ceil(need/10)`.
- [x] 3.4 Map `dayIndex` → weekday via `(referenceDate.getUTCDay() + i) % 7` and the
      package `DOW_MAP`; a supplier returns 0 on non-available weekdays. Verify: a test with a
      TUE/FRI-only supplier and a Wednesday `referenceDate` shows the first contribution on day
      index 1 (Thursday? adjust to the real map) — assert the contribution lands only on TUE/FRI
      offsets.
- [x] 3.5 In `estimatePlan`, consume flat suppliers against the shared per-project
      `remaining` in the same priority order as inventory so a shop offer for a unit shared by
      two goals is not double-counted. Verify: an `estimate-plan.test.ts` case with two goals
      needing the same unit's shards and one shop supplier shows the higher-priority goal
      consuming the supply first.

## 4. Selection model — `useAcquisitionSourceSelection` + `GoalAcquisitionPlan` (D1/D4)

- [x] 4.1 Add the `GoalAcquisitionPlan` type (`campaign { enabled, regularBattleIds,
mythicBattleIds }`, `onslaught { enabled }`, `shops { enabled, offers: ShopShardOffer[]
}`) in `pages/goals/model/goal-creation-form/`. Verify: `pnpm typecheck` passes and the
      type is exported for the control and previews.
- [x] 4.2 Implement `useAcquisitionSourceSelection` replacing `useShardLocationSelection`
      and absorbing `ascensionFarmingSource`: group-checked flags, regular/mythic node sets,
      selected `offerId`s; derived `selected{Regular,Mythic}BattleIds`; default = Campaigns
      enabled with the lowest-energy node per needed type, Onslaught + Shops disabled (spec:
      _Default selection preserves campaign-only estimates_). Verify: unit tests cover the fresh
      default, toggling a group, toggling a node, and that an empty campaign node set with the
      group still enabled reads as "unrestricted".
- [x] 4.3 Add a `fromGoalConfig(config)` seed: map `acquisitionSources` entries to the
      model; `null`/absent ⇒ Campaigns enabled, unrestricted (spec: _Goal created before this
      control existed_). Verify: unit tests seed from a `Campaign`+`Onslaught` set, a
      `Campaign`-only set, and `null`, asserting the resulting plan.
- [x] 4.4 Emit `acquisitionSources` from `goal-spec-builder.ts` `buildCombinedGoalSpecs`
      (replace `ascensionFarming` / Unlock `farmingLocationIds` shard use; keep
      `farmingLocationIds` for Rank/Ability). Verify: `goal-spec-builder.test.ts` asserts an
      Unlock+Ascension submission with campaign nodes + one shop offer + Onslaught produces the
      expected `{kind, ids}` entries per goal.

## 5. Shop + Onslaught supplier projection (D4/D5)

- [x] 5.1 Add `useUnitShopShardSupply(unitId)` in `features/goal-farming` (TanStack query
      for `shops` + `resolveUnitShardShopOffers`), returning the unit's `ShopShardOffer[]`.
      Verify: a hook test with a mocked shops dataset returns the resolved offers and re-renders
      when the query settles.
- [x] 5.2 Add pure `projectShopSupply(offer)` → `supplyOnDay(i)` = `rewardQty * maxPerDay *
(probabilityByDay[weekday(i)] ?? 0)` and `projectOnslaughtSupply({ progress, rarity })` →
      constant `avgShardsPerRun * 1.5`. Verify: unit tests — the Guild rotating slot yields
      `2*5*0.5` on TUE/FRI and 0 elsewhere; Onslaught Epic at a sample sector/tier yields the
      expected constant.
- [x] 5.3 Rewire `use-progression-preview.ts` to build `flatSuppliers` from the selected
      plan and call the unified `estimateGoal`, removing the parallel `onslaughtTokens` /
      `combinedDays = max(campaignDays, onslaughtDays)` path. Onslaught grants no orbs (dataset
      has no orb field), so this touches shard need only — orb need stays entirely untouched.
      Verify: `use-progression-preview` tests updated — a plan with campaign + Onslaught + shop
      shows one additive `combinedDays`, and orb need is unchanged by toggling Onslaught.

## 6. Acquisition-source control UI (D1/D9)

- [x] 6.1 Build `AcquisitionSourceField` in `pages/goals/ui/create-goal/`: Radix
      `Collapsible` groups for Campaigns / Onslaught / Shops, rendered only when the group can
      contribute (spec: _A source group is shown only when it can contribute_); no empty/disabled
      headers. `data-testid="create-goal-acquisition-sources"` on the container. Verify:
      component tests — a MoW Ascension goal renders no Campaigns/Onslaught group; an Unlock
      goal renders no Onslaught group; a unit with no shop offer renders no Shops group.
- [x] 6.2 Campaigns group body: reuse `GoalShardLocationsField` for regular/mythic nodes,
      gated to the goal's needed shard type(s); unselected group ⇒ campaign excluded from the
      plan. Verify: component test — an Ascension range needing only regular shards lists no
      mythic node; unchecking the group drops `campaign.enabled`.
- [x] 6.3 Shops group body: one row per `ShopShardOffer` showing shop, currency, per-purchase
      cost, shards/purchase, daily cap, available weekdays; a rotating-slot offer additionally
      shows the "one of several possible rewards" indicator, its weekdays, and the approximate
      probability (spec: _rotating-slot offer row content_); guaranteed offers show no indicator.
      Verify: component tests for a guaranteed daily offer row and a rotating-slot row.
- [x] 6.4 Onslaught leaf: checkbox row + panel (shown when checked) with estimated
      shards/run from saved progress (Onslaught grants no orbs, so no orb figure) and an inline
      `<Link to="/onslaught">`; when no saved progress, show the set-progress prompt instead of a
      yield figure (spec: _The Onslaught group shows its per-run yield and links to progress_).
      Verify: component tests for the with-progress and no-progress states.
- [x] 6.5 Desktop/mobile split (D9): groups start collapsed and single-column below 768px,
      start expanded and shop rows in a 2-col grid at/above 768px; identical `data-testid`s,
      options, and selection both ways. Verify: a component test rendered under each viewport
      asserts the same rows/testids and selection are present.

## 7. Create-goal sheet wiring

- [x] 7.1 Replace the `<Select>` in `goal-farming-fields.tsx` / `AscensionFarmingFields`
      with `AcquisitionSourceField`; drop `sources`/`ascensionFarmingSource` plumbing from
      `use-ascension-fields.ts` and route through `useAcquisitionSourceSelection` in
      `use-create-goal-form.ts`. Verify: `create-goal-sheet.test.tsx` — creating an Ascension
      goal with campaign + shop + Onslaught selected posts the expected `acquisitionSources`.
- [x] 7.2 Show the selected plan's combined estimate in the existing progression preview
      block (numbers read from the estimate breakdown, D4). Verify: `create-goal-sheet.test.tsx`
      asserts the preview day count drops when a guaranteed daily shop offer is added.
- [x] 7.3 Reset behaviour: "Create another" and entity switch reset the selection to the
      fresh default. Verify: `create-goal-sheet.test.tsx` covers reset after a successful
      create-another.

## 8. Goal detail / edit sheet wiring

- [x] 8.1 Render `AcquisitionSourceField` in `goal-detail-edit-form.tsx` for Unlock/Ascension
      goals; seed via `useAcquisitionSourceSelection.fromGoalConfig` in `goal-detail-draft.ts`;
      write `acquisitionSources` back through the edit mutation. Verify: `goal-detail-sheet.test.tsx`
      — opening an Ascension goal shows its saved groups/nodes/offers selected.
- [x] 8.2 Round-trip + load-race: a saved shop-offer selection survives a reopen while the
      shops query is still loading and is not reset to campaign-only (spec: _selection retained
      during data load_). Verify: `goal-detail-sheet.test.tsx` with a delayed shops query
      asserts the offer stays selected once it resolves.
- [x] 8.3 Legacy goal: a `GoalDetail` with `acquisitionSources == null` opens with Campaigns
      enabled/unrestricted and no data loss on save. Verify: `goal-detail-sheet.test.tsx` case.

## 9. i18n

- [ ] 9.1 Add `goals.*` keys (default namespace) for the group headers, shop-offer row
      labels (currency/cost/cap/weekdays/"possible reward"/probability), and the Onslaught
      yield + no-progress-prompt lines, in `en` and all supported locales (`de`, `es`, `fr`).
      Verify: `pnpm test:run` i18n key-parity tests pass and no `missingKey` warning appears in
      the component tests above.
      **Partial**: keys added to `en` only. The entire `goals.create.*` namespace (not just
      these new keys) has never been translated to `de`/`es`/`fr` — confirmed pre-existing,
      unrelated to this change — so left unchecked rather than silently marked done. Not
      blocking: i18next falls back to `en` for a missing key, and the `tour.*` namespace (task
      10.2, which _is_ parity-tracked) is fully translated in all 4 locales.
- [x] 9.2 Remove the now-unused `goals.create.ascension.source` / `Campaign` / `Onslaught`
      / `Both` / `onslaughtProgressHint` keys where superseded. Verify: `rg` finds no remaining
      reference and i18n parity tests pass.

## 10. Onboarding tour (D8)

- [x] 10.1 Add `create-goal-sheet.tutorial.tsx` (`useCreateGoalSheetTutorial`,
      `useTourPageSteps`, `{ desktop, mobile }` step sets) registered while the sheet is open,
      with one step targeting `[data-testid="create-goal-acquisition-sources"]` explaining that
      campaign, shop, and Onslaught sources combine. Verify: `create-goal-sheet.tutorial.test.tsx`
      asserts the step is registered for both viewports and targets that testid.
- [x] 10.2 Add `tour.createGoal.steps.*` (`acquisitionSources.title` / `.content`) i18n keys
      in `en`, `de`, `es`, `fr`. Verify: tutorial test renders localized content with no
      `missingKey`.

## 11. Regression, boundaries, and cross-consumer parity

- [x] 11.1 Update every existing consumer of `useShardLocationSelection` /
      `ascensionFarmingSource` to the new model; delete the dead hook/fields. Verify:
      `pnpm typecheck` and `pnpm test:run` pass with no reference to the removed symbols.
- [x] 11.2 Build `flatSuppliers` from the persisted `acquisitionSources` in the Today,
      Insights, and Raids Plan estimate paths so a goal with shop/Onslaught sources reduces the
      campaign schedule identically across all of them (spec: _Shared estimate consumers use the
      same derived demand_). Verify: `plan-insights-calc.test.ts` / `daily-raids-calc.test.ts` /
      `per-project-estimate.test.ts` cases with a shop-sourced goal show matching derived demand
      and schedule.
      Implemented via a shared `computeGoalAcquisition` helper in `features/goal-farming/lib/
goal-acquisition.ts` (FSD forbids a page importing another page's internals, so it couldn't
      live under `pages/goals`), consumed by both `plan-insights-calc.ts` (Insights) and
      `daily-raids-calc.ts` (Today + Raids Plan, which share one `runPlanSchedule` engine).
      `use-plan-insights.ts` and `use-daily-raids.ts` now fetch `shops`/`onslaughtRewards`/
      Onslaught progress and thread them through. New tests added to both calc test files;
      `per-project-estimate.ts`'s "what will be created" preview (new, not-yet-persisted goals)
      was intentionally left out of scope — it isn't one of the three consumers the spec names.
- [x] 11.3 Run the FSD boundary validator. Verify: `pnpm lint:fsd` passes (no
      page→page / feature→feature import introduced by the new `features/goal-farming` hook or
      the `pages/goals` model).

## 12. Manual verification (full Aspire stack — `tp-setup-dev-env`)

- [ ] 12.1 Start the workspace Aspire AppHost; wait for `web` and `api` healthy. Verify:
      both resources report healthy in the dashboard.
- [ ] 12.2 Populated project, desktop (≥768px): create an **Ascension** goal for **Eldryon**
      (`eldarFarseer`, guaranteed daily Guild Shop offer). Confirm Campaigns + Onslaught + Shops
      all render, the Guild offer row shows currency/cost/cap/weekdays with no "possible"
      indicator, selecting it lowers the preview day count, and the goal persists and reopens
      with the same selection.
- [ ] 12.3 Populated project, desktop: create an **Ascension** goal for **Mataneo**
      (`bloodIntercessor`, rotating Guild slot vs Tarvakh). Confirm the Shops row shows the
      "one of several possible rewards" indicator, TUE/FRI, ~50%, and the preview reflects the
      expected (not full) contribution.
- [ ] 12.4 Populated project: a unit with **no shop offer** shows no Shops group; a **MoW**
      Ascension goal shows neither Campaigns nor Onslaught (count-only, no estimate); a
      Character Ascension goal with **no saved Onslaught progress** shows the Onslaught
      set-progress prompt and link.
- [ ] 12.5 Mobile (<768px): repeat 12.2 — groups start collapsed, expand on tap, every
      label/cost/weekday/indicator present, selection and persistence work.
- [ ] 12.6 Run the create-goal onboarding tour at one viewport <768px and one ≥768px:
      the acquisition-sources step appears, targets the control, and shows localized content.

## 13. Gates

- [x] 13.1 `pnpm test:run` passes.
- [x] 13.2 `pnpm typecheck` passes.
- [x] 13.3 `pnpm lint` passes.
- [x] 13.4 `pnpm lint:fsd` passes.
- [x] 13.5 `git diff --check` is clean.
