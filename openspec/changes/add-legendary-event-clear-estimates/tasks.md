# Tasks

Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-clear-estimates` (apply it first; no calculation endpoint is added, but the catalog route `GET /api/v1/game-catalog/lre-clear-estimate` and its dataset must be served by the Aspire stack before client work starts). Independent of `add-legendary-event-run-inputs`.

## 1. Catalog package

- [ ] 1.1 Add `lreClearEstimateSchema` (`powerRatio`, `calibration { sampleCount, calibratedOn }`, `unitCoefficients[{ unitId, coefficient }]`) and the `lre-clear-estimate` key to `packages/game-catalog` (`schemas/lre.ts`, `dataset-keys.ts`, `dataset-payloads.ts`, `record-types.ts`, storage, mapper, `queries.ts`, `index.ts`); confirm `lre-battles` has a query the web app can use; verify `schemas.test.ts` and `game-catalog-sync.test.ts` cover the new dataset and its absence.

## 2. Entity: calculation and data hooks

- [ ] 2.1 Extend the roster type the entity reads with applied upgrade count and active/passive ability levels, and add `lib/unit-combat-power.ts` mapping a synced character + catalog unit to `CharacterCombatPowerInput`; verify a test reproduces 8,792 for Gold1 / Epic:RedOneStar / 3 / 20 / 15 and 0 for a unit not owned (design D1).
- [ ] 2.2 Add `model/use-legendary-event-battles.ts` (ordered battle powers per lane from `lre-battles`) and `model/use-clear-estimate-config.ts` (`ready | absent | failed | loading`); verify tests for each state (design D6).
- [ ] 2.3 Add `lib/clear-estimate.ts` (`unitEffectivePower`, `teamEffectivePower`, `estimateClearDepth`, `unitClearEstimate`, `teamEffectiveDepth`) returning `ClearEstimate`; verify `clear-estimate.test.ts` covers every scenario in `specs/legendary-event-clear-estimates/spec.md` with the intermediate values (E 45,718.4, thresholds, depth 6, 21% / 32%; partial team 5; locked member 5; unit 6; depth 0; last battle with no shortfall; coefficient default 1.0) (design D3).
- [ ] 2.4 Add `lib/calibrate-power-ratio.ts`; verify the two-sample example returns 0.4641 with count 2, skips d = 0 and locked-member samples, and uses the upper bound at the last battle (design D4).
- [ ] 2.5 Export the new libs, hooks and types from `entities/legendary-event/index.ts`; verify `pnpm lint:fsd`.

## 3. Teams: estimate in the depth stepper

- [ ] 3.1 Extend `buildTeamCardViewModel` with `estimate: ClearEstimate | null`, `displayedDepth` (`manual ?? estimate`), `lockedMemberCount`; verify `teams.view-model.test.ts` covers manual-wins, estimate-only, dataset absent and locked members.
- [ ] 3.2 Update `ClearDepthStepper`, `team-card.tsx` and `team-editor-dialog.tsx`: "estimated" mark with the uncalibrated tooltip, margin line, − / + starting from the estimate and saving `manual`, Use estimate (null write) only with a manual depth, "estimate ~n" hint, "Not enough for battle 1 yet", locked-member note; verify `team-card.test.tsx` and `team-editor-dialog.test.tsx` cover each scenario in `specs/legendary-event-teams/spec.md` (design D5).
- [ ] 3.3 Extend `legendary_event_depth_set` with `estimate` and `fromEstimate` and add `legendary_event_depth_estimate_restored`; verify a test asserts the properties (design D8).

## 4. Leaderboard: estimated clears

- [ ] 4.1 Add the Clears figure to `leaderboard.view-model.ts`, `leaderboard-table.tsx` (column after Objectives, not sortable) and `leaderboard-list.tsx` ("Objectives: N · Clears: ~n"), hidden when the dataset is unavailable and absent from the Overview leaderboard; verify leaderboard tests cover owned, locked, loading, roster unavailable and dataset absent (design D5–D7).

## 5. Tour and i18n

- [ ] 5.1 Update the Teams step copy in `legendary-event.tutorial.tsx` to mention estimates (`tour.event.steps.teams.content`); verify the tutorial test.
- [ ] 5.2 Add to `legendaryEvents.json` (en/de/es/fr): `estimates.*` (estimated, uncalibrated, marginAbove, shortfallNext, notEnough, useEstimate, estimateHint, lockedNotCounted_one/_other, clears, clearsLabel, howItWorks) and the updated tour copy, with real German, Spanish and French copy; verify `legendary-events-translations.test.ts` passes.

## 6. Calibration

- [ ] 6.1 Collect samples from maintainers' own plans (teams with a manual depth and fully owned members, with their synced progression), run `calibratePowerRatio`, and record the ratio, sample count and interquartile range in the companion API raw file PR description and `calibration` fields.

## 7. Platform-independent verification

Data states: a profile with a synced roster and an Uthar plan holding one team with a manual depth and one without; a profile whose roster chunk is missing; a catalog without `lre-clear-estimate` (fixture or local API override).

- [ ] 7.1 With the Aspire stack, confirm a team without a manual depth shows an estimate, a + press stores a manual depth, Use estimate restores the estimate, and a reload keeps the manual value.
- [ ] 7.2 Compare estimates for the maintainer's teams against their real cleared depth on the in-game lane and note the gap in the calibration PR.

## 8. Desktop verification (≥768px)

- [ ] 8.1 Team cards show the estimated mark, margin line and Use estimate; the leaderboard table has the Clears column without horizontal scroll.
- [ ] 8.2 The Teams tour step shows the updated copy.

## 9. Mobile verification (<768px, same-origin iframe per the `tp-manual-ui-verification` skill)

- [ ] 9.1 The margin line wraps under the stepper; Use estimate is reachable; leaderboard cards read "Objectives: N · Clears: ~n".
- [ ] 9.2 The Teams tour step shows the updated copy.

## 10. Gates

- [ ] 10.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.

## Deferred / out-of-session

- Amend `tacticus-planner-docs` when archived: plan Stage 5 (estimates not persisted, per design D2), `product/features/lre-planning.md` Stage 5 requirements and the curation open question, `architecture/data/events.md` (`expected_battle_clears_source = estimate` reserved, unused).
- 6.1 may need samples from users other than the maintainers; if fewer than ten samples exist in-session, ship with the uncalibrated label and track the calibration in an issue.
