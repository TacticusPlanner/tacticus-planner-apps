# Tasks

## 1. Entity libraries

- [ ] 1.1 Create `entities/legendary-event/lib/damage-profile-exclusions.ts` (`votanChampion` → Psychic / Direct / DirectDamage, `thousSekhetar` → Psychic; `unitDealtDamageTypes`) and `lib/objective-match.ts` (`matchesObjectiveFilter`, `isUnitAllowedOnLane`, `objectivesSatisfied`), and verify `objective-match.test.ts` covers every kind in the spec table with real catalog records (`bloodDante`, `votanChampion`, `astarLysander`), `exclude` inversion, ranged-over-melee hits, the DirectDamage exclusion, and an unknown kind returning `false`.
- [ ] 1.2 Add a catalog-wide guard test that loads the real `lres` fixtures (the three served events) and asserts every `allowedUnitsFilter` and objective kind is supported, every `Trait` / `DamageType` / `Faction` target resolves to at least one catalog character, and `availableUnitIds` equals the client evaluation per lane; verify it passes today and fails when a fixture is given `kind: "NoSummons"`.
- [ ] 1.3 Create `lib/unit-potential.ts` (`unitLanePotential`, `buildLaneLeaderboard` with owned / locked / unknown ownership and default ordering points → slots → name) and verify `unit-potential.test.ts` reproduces Dante on Lysander Alpha = 152 points / 2 slots, the not-allowed case (0 / 0, excluded), the default order C, B, A, and `unknown` ownership when the roster is `undefined`.
- [ ] 1.4 Create `lib/lane-points-model.ts` and `lib/synced-lane-progress.ts` and verify `lane-points-model.test.ts` reproduces 471 for Lysander Alpha battle 1 and 9,000 for the lane, and `synced-lane-progress.test.ts` covers the partially cleared battle (`[0,2,3]`, 238 of 471), the complete battle, battles beyond the encounters, a null lane, and an absent event entry; export the four libraries from the slice index.

## 2. i18n

- [ ] 2.1 Add leaderboard copy (headers, sort options, "Only unlocked", locked marker, "no eligible units", "roster not synced"), progress copy (lane header, "no progress in this lane", "no synced progress for this event yet", cleared / not cleared, high score, the "how points work" paragraph) and `tour.event.leaderboard.*` / `tour.event.progressGrid.*` to `legendaryEvents.json` in all four locales with real de/es/fr translations, and verify `legendary-events-translations.test.ts` key-parity passes.

## 3. Leaderboard section

- [ ] 3.1 Extend the event page orchestrator with the roster read (`getPlayerCharacters`) and the shared sort / "Only unlocked" state, and verify `legendary-event-page.test.tsx` covers state shared across lanes and reset on unmount.
- [ ] 3.2 Build `leaderboard/leaderboard-controls.tsx`, `leaderboard/leaderboard-table.tsx` (desktop) and `leaderboard/leaderboard-list.tsx` (mobile) over `buildLaneLeaderboard`, with the locked marker, `RarityIcon` / `RankBadge`, per-objective indicators with accessible text, and the no-eligible-units and roster-not-synced bodies; verify `leaderboard.test.tsx` covers default order, owned vs locked, Only-unlocked across lanes, roster unavailable (toggle disabled, no locked markers), sortable headers on the table and the compact bar on the list.

## 4. Progress section

- [ ] 4.1 Build `progress/progress-grid.tsx` (desktop 18×6 grid) and `progress/progress-rows.tsx` (mobile compact rows with sticky icon header) over `buildSyncedLaneProgress`, with the lane header "earned / max" + progress bar, per-row points and high score, sr-only cleared text, and the null-lane and absent-event bodies; verify `progress-grid.test.tsx` covers the partially cleared row (238 / 471, high score 31), the complete row, rows beyond the encounters, a null lane, the "3,410 / 9,000" header, and the accessible cleared / not-cleared text.
- [ ] 4.2 Render both sections in the desktop and mobile event sub-pages after Lane overview and verify render tests at 1280px assert three lanes for each section and at 390px assert the selected lane only.

## 5. Tour

- [ ] 5.1 Append the leaderboard and progress-grid steps to `legendary-event.tutorial.tsx` (desktop and mobile) and verify the tutorial test asserts the targets exist on both forms.

## 6. Desktop verification (viewport ≥ 768px)

- [ ] 6.1 On the Aspire stack with a signed-in account whose synced `lre-progress` has partial clears (required data state: at least three battles with some but not all objectives cleared, plus an event with no entry), verify at 1280px that leaderboard sorting and "Only unlocked" work across all three lanes, ownership, rarity and rank match the roster, and objective indicators match the game's eligibility for five spot-checked units. Record browser evidence.
- [ ] 6.2 **Assert design D3**: for at least three partially cleared battles, verify the cleared cells implied by `objectivesCleared` plus kill / high score sum to the synced `encounterPoints`, and the lane header totals match the in-game lane points; record the comparison in the change notes. If any battle disagrees, stop and report rather than adjusting the mapping.
- [ ] 6.3 Run the event page tour and verify the two new steps target visible elements; verify light and dark themes render the grid and badges legibly.

## 7. Mobile verification (viewport < 768px)

- [ ] 7.1 Using a same-origin 420px iframe on the signed-in app origin, verify the lane selector drives the leaderboard and progress rows, the leaderboard renders row cards with the compact bar, the progress rows show the sticky icon header, there is no horizontal page scroll, and scrolling a ~100-row leaderboard stays smooth; run the tour and verify the two new steps. Record evidence.

## 8. Integration and gates

- [ ] 8.1 Run `pnpm lint:fsd` and verify `entities/legendary-event` imports no feature or page and `pages/events` imports it only through its index.
- [ ] 8.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.

## Workflow follow-up

- Open the apps PR, wait for CI and CodeRabbit, triage comments, then `/opsx:sync` and `/opsx:archive` this change inside `tacticus-planner-apps`.
- Bump the `tacticus-planner-apps` submodule pin in `tacticus-planner-dev` after merge.
- Record the D3 verification result in `tacticus-planner-docs` (Legendary Event plan, Stage 1) and whether the API must carry an objective map before Stage 3.
