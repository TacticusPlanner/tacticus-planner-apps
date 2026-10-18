# Tasks

## 1. Progress-aware points (entities)

- [ ] 1.1 Add `objectiveClearedThrough(progress, objectiveIndex, depth)` to `entities/legendary-event/lib/synced-lane-progress.ts` and export it; unit tests cover depth 0, a fully cleared prefix, a gap at the last battle, and undefined progress (verify: `pnpm --filter web vitest run synced-lane-progress`)
- [ ] 1.2 Add `teamPointsLeft(model, progress, reach)` to `team-points.ts` over `laneReachablePoints`; unit tests reproduce the Lysander Alpha worked examples (880, 170, 675) and the no-progress 274 example using `test/fixtures/legendary-events.json` (verify: `vitest run team-points`)
- [ ] 1.3 In `suggestLaneTeams`, drop a proposal when any subset objective is cleared through its depth; tests: the {Flying, No Resilient} drop at depth 12, the {No Resilient} keep at depth 14, and the existing Uthar worked example unchanged (verify: `vitest run team-suggestions`)

## 2. Team card

- [ ] 2.1 `buildTeamCardViewModel` takes the lane points model and progress, returns `pointsLeft` (null without a displayed depth) and a `clearedThrough` flag per coverage entry that is excluded from points; update `teams.view-model.test.ts` (verify: `vitest run teams.view-model`)
- [ ] 2.2 `team-card.tsx` renders "N points left · battles 1–D" or "—" with "Set depth to see points left", the cleared mark on chips with "Already cleared through battle D" accessible text, and keeps Team power on the same line on mobile; `teamsSection` passes `progressByLane[laneId]`; update `team-card.test.tsx` (verify: `vitest run team-card teams-section`)

## 3. Team editor

- [ ] 3.1 Move the Covered objectives and Clear depth sections above Members in `team-editor-dialog.tsx`; test asserts section order (verify: `vitest run team-editor-dialog`)
- [ ] 3.2 Pass lane progress from `team-editor-host.tsx` into the dialog; coverage chips show the cleared mark when cleared through the draft's depth (manual or estimated) and update when the depth changes; tests for depth 12 → 14 (verify: `vitest run team-editor-dialog`)
- [ ] 3.3 `buildPickerTiles` takes progress and returns `remainingPoints` (via `remainingLanePoints`) and `effectivePower`, plus a sort argument (`pointsLeft` | `power`) honoured together with the objective chips; tests reproduce Dante's 1,800 and the sort scenarios (verify: `vitest run team-picker`)
- [ ] 3.4 `team-unit-picker.tsx`: tile points read "N pts left"; the rarity / rank / "~n" row shows for every owned unit (synced or preview roster) with the preview marker preview-only; add the Points left / Power segmented sort (Power disabled with "Power data unavailable" when power data is missing), reset on close and kept across Save and add another; update `team-unit-picker.test.tsx` (verify: `vitest run team-unit-picker`)

## 4. Suggestions dialog

- [ ] 4.1 `team-suggestions-dialog.tsx`: covered chips show the cleared mark when cleared through the proposal depth, and the reason line lists only objectives not cleared through it ("Clears ~n · +N points…" when none); update the dialog test (verify: `vitest run team-suggestions-dialog`)

## 5. i18n and tour

- [ ] 5.1 Add or change `legendaryEvents` keys (points left, set depth to see points left, already cleared through battle, pts left, sort label and options, power unavailable, reason line without objectives) in en, de, es and fr with real translations; remove keys no longer used (verify: i18n key-parity test and `pnpm typecheck`)
- [ ] 5.2 Re-check `legendary-event.tutorial.tsx` steps that target the team card points or the editor sections against the new order and copy, on desktop and mobile; update step copy keys in all four locales if the wording references "points per battle" (verify: tutorial test)

## 6. Desktop verification (viewport ≥ 768px)

Data state: a signed-in account with a synced Lysander (or current) LE where Alpha has some objectives cleared across a prefix of battles, at least two Alpha teams, and an owned and a locked allowed unit.

- [ ] 6.1 Team cards show points left with the battle range, cleared chips marked, and Team power on the same row; a team with no depth shows the "Set depth" dash
- [ ] 6.2 Editor shows Name, Covered objectives, Clear depth, then the picker; changing the depth past the cleared prefix removes the cleared mark
- [ ] 6.3 Picker tiles show rarity, rank, "~n" and "pts left"; Points left / Power sort reorders the grid and composes with an objective chip
- [ ] 6.4 Suggest teams no longer proposes a pair relying on a spent objective, and the reason line omits cleared objectives

## 7. Mobile verification (viewport < 768px, same-origin iframe per `tp-manual-ui-verification`)

- [ ] 7.1 Team card points left and Team power share one line without overflow at 375px
- [ ] 7.2 Editor sheet order is Name, Covered objectives, Clear depth, Members; the footer stays visible while the grid scrolls
- [ ] 7.3 Four-column tiles show the strength row and "pts left" without truncating the points; the sort control fits the controls row with 44px touch targets
- [ ] 7.4 Suggest teams sheet shows cleared marks and the trimmed reason line

## 8. Gates

- [ ] 8.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` all pass
