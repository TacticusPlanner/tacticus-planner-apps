# Tasks

Companion API change: `tacticus-planner-api/openspec/changes/clarify-onslaught-progression` (adds `isSet`, nullable PUT alliances). Apply it first.

## 1. Contract

- [x] 1.1 Add `isSet` to `OnslaughtAllianceProgress`; `progressForAlliance` returns `undefined` for an unset alliance (`model/types.test.ts`).
- [x] 1.2 Map the PUT body through `mapOnslaughtProgressToRequestDto`, sending unset alliances as `null` (`onslaught-progress.api.test.ts`).

## 2. Goals

- [x] 2.1 Add `isOnslaughtProgressSaved` and `progressSet` in `onslaught-yield.ts`; use it for `onslaughtProgressSaved` in `use-progression-preview.ts` and `progressSaved` in `use-goal-edit-acquisition.ts` (`onslaught-yield.test.ts`, `goal-edit-dialog.test.tsx` unset-alliance case).
- [x] 2.2 `computeGoalAcquisition` supplies no Onslaught shards or tokens for an unset alliance (`goal-acquisition.test.ts`).
- [x] 2.3 sysadmiral's "Onslaught progress doesn't pull through": traced to the Edit goal dialog's hard-coded `onslaughtProgressSaved={false}`, fixed in `efb31e6` (#195); add `create-goal-sheet.test.tsx` regressions (saved progress → shards/day, no prompt; unset alliance → prompt).
- [x] 2.4 Update fixtures and `progressForAlliance` mocks in goals/insights/create/edit tests to carry `isSet`.

## 3. Onslaught page

- [x] 3.1 Not-set badge, "Not set" placeholders, disabled tier select, hint; editing marks the alliance set; unset alliances excluded from the reference table highlight.
- [x] 3.0 Confirm the sector→tier reset from the UserJot post is already implemented and tested (`tier-after-sector-change.ts` + test: Gold 4 → Diamond = 1, Diamond 1 → Gold = 4).
- [x] 3.2 Replace the tier-4 option with a "Sector complete" checkbox per card (`farmableTiers`, `selectedTier`, `tierAfterCompleteToggle` in `tier-after-sector-change.ts`, tested); help line under the cards; tier options "Tier N"; "<Sector> · Tier <n>" labels with localized sectors; localized alliance names; per-card shards per run.
- [x] 3.3 Split the page into `onslaught-alliance-card.tsx`, `onslaught-emblem.tsx` and `onslaught-position.ts` to stay under `max-lines`; tests in `onslaught-page.test.tsx` and `onslaught-position.test.ts`.
- [x] 3.4 No Joyride tutorial task: `/my-game/onslaught` has no tour and this change keeps the same flow (one added checkbox, copy, labels and a read-only yield); a tour for My Game is out of scope.

## 4. i18n

- [x] 4.1 Add `onslaught.{tierNumber,position,positionComplete,notSet,notSetHint,yieldPerRun,help,sectors.*}`, change `onslaught.tierComplete` and `myGame.tabs.onslaughtDescription` in `common.json` for en, de, es and fr with real translations.

## 5. Gates

- [x] 5.1 Run the changed tests with vitest, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, prettier on changed files, and `git diff --check`.

## Deferred / out-of-session

- [ ] 6.1 Desktop verification (≥768px) against the Aspire stack with a fresh profile (all alliances unset) and a profile with saved progress: not-set state, saving one alliance, Sector complete checkbox, help line, labels, per-card yield, and the goal create/edit Onslaught prompt. Not run: no Aspire stack or .NET SDK was available in this session, and the API half must be deployed first.
- [ ] 6.2 Mobile verification (<768px, same-origin iframe) with the same two data states: single-column cards, badge/selects/yield wrap without clipping in de and fr.
