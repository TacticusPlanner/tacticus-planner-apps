## 1. Prerequisite

- [x] 1.1 Confirm the companion `tacticus-planner-api` change `add-mythic-material-shop-sources` is applied (a Rank goal with `[{ kind: "Shop", ids: ["guild:upgHpM004"] }]` saves and round-trips against the local API).

## 2. Offer resolution (game-catalog)

- [x] 2.1 Extract the slot × weekday × probability walk from `resolveUnitShardShopOffers` into a shared reward-predicate resolver returning `ShopRewardOffer`; make `ShopShardOffer` extend it and keep `resolveUnitShardShopOffers` output identical. Verify existing `shop-resolve.test.ts` passes unchanged.
- [x] 2.2 Add and export `resolveMythicMaterialShopOffers(shops, materialIds, options)`. Verify with a test against the real catalog fixture: Venerable Battle Mark yields Guild (Tue 1, Sat/Sun 0.25, cap 2), Crusade (Tue 1, Sat/Sun 0.25, cap 3) with a blue-star `starsByUnitId`, and Rogue Trader (Sun 1, cap 1); Crusade is absent with no blue-star unit.

## 3. Estimator (features/goal-farming)

- [x] 3.1 Generalize `projectShopSupply` to `ShopRewardOffer` (resourceId = upgrade id for a Mythic material) (shop suppliers are pooled by their offer-id `key`); verify with unit tests that the Venerable offers project 3 / 4.5 / 1 per week.
- [x] 3.2 Extend `computeGoalAcquisition` for Character Rank, Upgrade, and MoW Ability goals: needed Mythic ids ∩ need, roster lock context, default-all when `acquisitionSources` is null, explicit `Shop` ids otherwise, explicit empty → none; keep `acquisitionSources` null for these types. Verify with unit tests for default, explicit, and opt-out, and that Unlock/Ascension output is unchanged.
- [x] 3.3 Add the shared per-offer daily pool (keyed by shop supplier `key`) to `applyFlatSuppliers` / `estimatePlan`, leaving Onslaught suppliers and `estimateGoal` unpooled. Verify with tests reproducing both `goal-farming-estimates` worked examples (Ragnar met Day 6 with Crusade 3.75 / Guild 2.25; Dreadnought met Day 9) and a same-unit Unlock+Ascension shard-offer regression test.
- [x] 3.4 Update every caller that builds goal inputs (`daily-raids-calc.ts`, `plan-insights-calc.ts`, `plan-standalone-estimates.ts`, `per-project-estimate.ts`, the create-goal previews) to pass needed ids, shops, and roster lock context. Verify with `daily-raids-calc.test.ts` / `estimate-plan.test.ts` cases that a Ragnar Adamantine goal with no saved selection is no longer blocked on Venerable Battle Mark on Goals, Today, and Raids Plan, and stays blocked when opted out.

## 4. Raids Plan

- [x] 4.1 Rename `ShopScheduleEntry.expectedShards` → `expectedAmount`, widen `shopOffersById` to `ShopRewardOffer`, and render Mythic-material purchases (material art, name, item count, currency) in `plan-shop-purchases.tsx`. Verify with a `plan-day-cells` test for the Day 2 Ragnar Crusade/Guild entries (3 for 1290, 2 for 1800) and the Day 6 Guild split across two goals.

## 5. Goals UI

- [x] 5.1 Generalize `ShopOfferRow` to `ShopRewardOffer` (material icon/name, "≈ X per day") without changing shard rows; verify `acquisition-source-field.test.tsx` passes.
- [x] 5.2 Add the shared draft hook (`materialShopIds: string[] | null`, first toggle materializes the listed default) and `mythic-material-source-field.tsx` with loading, load-failure, and no-offer states and `data-testid="goal-mythic-material-sources"`. Verify with component tests for each state and for default-checked rendering.
- [x] 5.3 Render the control in the Rank, Upgrade, and MoW Ability create cards when the range/targets need a Mythic material; wire create submission (omit while null). Verify in `create-goal-sheet.test.tsx` that it appears for an Adamantine range, hides below it, and an untouched form submits no `acquisitionSources`.
- [x] 5.4 Render the control in `goal-edit-fields.tsx` for the same kinds, hiding it when an edited target no longer needs a material; send `[{ kind: "Shop", ids }]` only when changed. Verify in `goal-edit-dialog.test.tsx` the round-trip, opt-out (`ids: []`), and hide-on-target-change scenarios.
- [x] 5.5 Add the per-currency spend lines for selected Mythic-material offers to the Rank, Upgrade, and Ability previews; verify the Ragnar preview shows 1720 crusade currency and 2700 Guild Credits.
- [x] 5.6 Below 768px render each material as a collapsible section, expanded at or above 768px; verify with a test using the mobile hook mock that both forms list identical offers.

## 6. Tutorials and i18n

- [x] 6.1 Add a `mythicMaterialSources` step to `create-goal-sheet.tutorial.tsx` and `goal-edit-dialog.tutorial.tsx` (desktop and mobile sets, target `goal-mythic-material-sources`) with `tour.createGoal.steps.mythicMaterialSources.*` / `tour.editGoal.steps.mythicMaterialSources.*` keys; update the tutorial tests.
- [x] 6.2 Add all new UI copy (control title, per-day yield, loading, unavailable, no-offer, preview lines) and the tour step keys to `apps/web/public/locales/{en,de,es,fr}/common.json` with real German, Spanish, and French translations; verify the i18n key-parity test passes.

## 7. Platform-independent verification

- [ ] 7.1 With the Aspire stack running and a signed-in account that has (a) a Ragnar Rank → Adamantine 2 goal with no saved selection, (b) a MoW Ability goal needing Venerable Battle Mark at lower priority, and (c) an opted-out copy of (a): confirm (a) shows a finite date and no Venerable blocker, (c) shows Restricted with Venerable Battle Mark ×6, and Raids Plan Tuesday cards never list more than 2 Guild / 3 Crusade Venerable purchases across goals.

## 8. Desktop verification (viewport ≥ 768px)

- [ ] 8.1 Create a Rank goal to Adamantine 2 for Ragnar: the Mythic materials control lists Venerable Battle Mark's three offers expanded and checked, with costs, caps, weekdays, rotating chance, and ≈ per-day yield; the preview shows the currency spend lines.
- [ ] 8.2 Edit data state (a): uncheck Rogue Trader, save, reopen — only Guild and Crusade are checked; lower the target below Adamantine — the control hides.
- [ ] 8.3 Run the create-goal and Edit goal tours: the Mythic materials step appears when the control is rendered and is skipped otherwise.

## 9. Mobile verification (viewport < 768px, same-origin iframe)

- [ ] 9.1 In a 420px-wide same-origin iframe on the app origin, confirm the mobile layout renders, then create the same Ragnar goal: the control shows collapsible material sections with the same offers, details, and checked state as desktop.
- [ ] 9.2 In the same iframe, edit data state (a) and run the create-goal and Edit goal tours: the Mythic materials step targets the control in the mobile step set; Raids Plan's Shops section shows the Venerable purchases with material art.

## 10. Gates

- [x] 10.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all pass.
