## 1. Contract

- [x] 1.1 After the API change merges, `pnpm --filter web api:pull <api sha>` and `pnpm --filter web api:types`; adopt `dependsOnGoalIds` and the repeated-type combined request in `entities/goal` API types. (Pinned to the API branch head; refresh `api.ref` to the API merge SHA before merging.)
- [x] 1.2 Add `goalTargetKey` and `goalTargetLabel` to `entities/goal` (mirroring the server key; Rank delegates to `rankTargetKey`) with unit tests per type.

## 2. Planning

- [x] 2.1 Extend `UnitCoverage` with the per-goal Ascension allocation (claimed steps and shard draws, design decision 2); make `ascensionResourceNeed` claim steps and draw owned shards once when coverage is given; tests for the worked Ragnar example (960 shards / 55 orbs) and higher-target-first ordering.
- [x] 2.2 Pass the unit's coverage to Ascension goals in every plan builder (`features/goal-planning` `plan-insights-calc`, `features/daily-raids` `daily-raids-calc`, `features/shop-recommendations` `shop-needs`, `pages/legendary-events` `farming-days`); verify standalone estimates are unchanged.
- [x] 2.3 Add tests for two Character Ability goals and for two MoW Ability goals plus an Upgrade goal on one unit sharing transition coverage. (Character case added in `goal-requirements-milestones.test.ts`; MoW/Upgrade transition sharing is the pre-existing `UnitCoverage` path, covered by `upgrade-goal-need.test.ts` and `plan-insights-arjac-overlap.test.ts`.)

## 3. Creation

- [x] 3.1 `findGoalSlotConflict`/`useGoalSlotConflict`: compare `goalTargetKey` for every type, one check per spec; tests for distinct and equal Ascension/Ability/Upgrade targets and Unlock.
- [x] 3.2 `useGoalPrerequisites`: consider in-flight Ascension goals; return an "existing covering goal" result wired into review copy and `dependsOnGoalIds`; tests for covering, too-low and none.
- [x] 3.3 "Add milestone" on Rank, Ascension and Ability cards; `goal-spec-builder` emits one spec per milestone with chained `dependsOnIndex` and Ascension placement; validation per milestone; tests for Ragnar's four-step ladder and conflict on one step.
- [x] 3.4 Update the create-sheet Joyride tutorial (`features/goal-create/ui/create-goal/create-goal-sheet.tutorial.tsx`) with an "Add milestone" step for desktop and mobile, with `tour.*` keys.

## 4. Display, blockers, edit

- [x] 4.1 Goal rows/cards: `goalTargetLabel` for every type; range start from previous same-type milestone; "covered by" note; tests.
- [x] 4.2 `implicit-prerequisite-blockers`: too-low existing Ascension offers create-covering plus review; tests. (The reason now carries the highest too-low goal for review; `prerequisitePrefill` gives the covering create. No UI renders these remedy actions yet.)
- [x] 4.3 Edit dialog: sibling collision message for every type; tests.
- [x] 4.4 `features/v1-import`: check the outcome copy now that an existing Upgrade goal no longer forces `manual_step_required`, and that each V1 material goal can land as its own Upgrade goal; update tests. (Copy still fits: `manual_step_required` now only means a pre-farm goal with no imported linked goal. `prerequisite_target_insufficient` stays mapped for older stored reports.)

## 5. i18n

- [x] 5.1 Add/update keys for milestone controls, dependency review copy, covered note, collision messages and blocker actions in every locale under `apps/web/public/locales` with real de/es/fr translations.

## 6. Verification

- [x] 6.1 Run `pnpm lint`, `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:run`, `pnpm build`.

## 7. Desktop verification (≥768px)

- [ ] 7.1 On the Aspire stack, create Ragnar's Rank ladder in the dialog, check the four rows, labels and order in Goals, and step through the updated tour.
- [ ] 7.2 Create a second Ascension milestone and a Rank target covered by an existing Ascension goal; confirm no collision and the dependency review copy.

## 8. Mobile verification (<768px)

- [ ] 8.1 In a 420px same-origin iframe, repeat the ladder creation in the sheet, check the stacked milestone list and the mobile tour steps.
- [ ] 8.2 Check milestone rows, the covered note and blocker actions on the mobile Goals list.
