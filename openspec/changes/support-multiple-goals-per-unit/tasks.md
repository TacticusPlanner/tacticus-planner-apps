## 1. Contract

- [ ] 1.1 After the API change merges, `pnpm --filter web api:pull <api sha>` and `pnpm --filter web api:types`; adopt `dependsOnGoalIds` and the repeated-type combined request in `entities/goal` API types.
- [ ] 1.2 Add `goalTargetKey` and `goalTargetLabel` to `entities/goal` (mirroring the server key; Rank delegates to `rankTargetKey`) with unit tests per type.

## 2. Planning

- [ ] 2.1 Extend `UnitCoverage` with `progressionSteps` and `shardPool`; make `ascensionResourceNeed` claim steps and draw pooled shards when coverage is given; tests for the worked Ragnar example (960 shards / 55 orbs) and higher-target-first ordering.
- [ ] 2.2 Seed the shard pool once per unit in every plan builder (`plan-insights-calc`, `daily-raids-calc`, `shop-needs`, LE `farming-days`); verify standalone estimates are unchanged.
- [ ] 2.3 Add tests for two Character Ability goals and for two MoW Ability goals plus an Upgrade goal on one unit sharing transition coverage.

## 3. Creation

- [ ] 3.1 `findGoalSlotConflict`/`useGoalSlotConflict`: compare `goalTargetKey` for every type, one check per spec; tests for distinct and equal Ascension/Ability/Upgrade targets and Unlock.
- [ ] 3.2 `useGoalPrerequisites`: consider in-flight Ascension goals; return an "existing covering goal" result wired into review copy and `dependsOnGoalIds`; tests for covering, too-low and none.
- [ ] 3.3 "Add milestone" on Rank, Ascension and Ability cards; `goal-spec-builder` emits one spec per milestone with chained `dependsOnIndex` and Ascension placement; validation per milestone; tests for Ragnar's four-step ladder and conflict on one step.
- [ ] 3.4 Update the create-sheet Joyride tutorial (`create-goal-sheet.tutorial.tsx`) with an "Add milestone" step for desktop and mobile, with `tour.*` keys.

## 4. Display, blockers, edit

- [ ] 4.1 Goal rows/cards: `goalTargetLabel` for every type; range start from previous same-type milestone; "covered by" note; tests.
- [ ] 4.2 `implicit-prerequisite-blockers`: too-low existing Ascension offers create-covering plus review; tests.
- [ ] 4.3 Edit dialog: sibling collision message for every type; tests.

## 5. i18n

- [ ] 5.1 Add/update keys for milestone controls, dependency review copy, covered note, collision messages and blocker actions in every locale under `apps/web/public/locales` with real de/es/fr translations.

## 6. Verification

- [ ] 6.1 Run `pnpm lint`, `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:run`, `pnpm build`.

## 7. Desktop verification (≥768px)

- [ ] 7.1 On the Aspire stack, create Ragnar's Rank ladder in the dialog, check the four rows, labels and order in Goals, and step through the updated tour.
- [ ] 7.2 Create a second Ascension milestone and a Rank target covered by an existing Ascension goal; confirm no collision and the dependency review copy.

## 8. Mobile verification (<768px)

- [ ] 8.1 In a 420px same-origin iframe, repeat the ladder creation in the sheet, check the stacked milestone list and the mobile tour steps.
- [ ] 8.2 Check milestone rows, the covered note and blocker actions on the mobile Goals list.
