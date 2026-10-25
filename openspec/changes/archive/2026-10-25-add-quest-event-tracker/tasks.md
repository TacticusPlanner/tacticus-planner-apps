# Tasks

Companion API change: `add-quest-event-tracker` in `tacticus-planner-api` (serves `quest-events` and `quest-crates`). It applies first.

## 1. Catalog client (`packages/game-catalog`)

- [x] 1.1 Add zod schemas and sync for `quest-events` and `quest-crates`, and verify parsing with fixtures for Cyrus battle 1 and the crate track
- [x] 1.2 Convert and copy V1's 83 `quest_maps` to `apps/web/public/game_catalog/quest_maps/`, add `battleBoardImage(boardId)` with a quest-then-LE lookup (keeping `legendaryEventMap`), and verify with unit tests for a quest board, an LE board and a missing board

## 2. Shared battle preview (`widgets/battle-preview`)

- [x] 2.1 Move the map, enemy tile, enemy detail and enemy list from the LE Battles section into the widget behind props, point LE at it, and verify the LE Battles tests pass unchanged

## 3. Quest feature (`features/quest-event`)

- [x] 3.1 Implement `selectQuestInstance` (running, claim, preview, none, tie-breaks) and verify with unit tests for the Nubari, claim-window and Kîmm preview scenarios
- [x] 3.2 Implement `scoreQuest` (battle, tier and total points, crates opened, next crate, points left) and verify with unit tests for Nubari battle 1, 0 medals, the next-crate and all-perfect scenarios
- [x] 3.3 Implement guarded storage (`tp.dailies.quest.progress.v1`, clamping, padding, failure notice) and verify with tests for reload, a new quest and throwing storage
- [x] 3.4 Build the header, quest picker, tier-grouped battle list with score inputs, and summary, and verify with component tests for the Nubari not-owned, browse-Cyrus and older-quest no-data scenarios
- [x] 3.5 Build the battle detail (header with cap line, board, enemies and pickups, objective chips, drop with odds and goal need), and verify with component tests for Nubari battles 4 and 17 and the NPC-failure state

## 4. Page, navigation and tour

- [x] 4.1 Add `pages/dailies/ui/quest-page.tsx` per design D6, the `quest` route and the nav item after HRE, and verify with page tests that `/dailies/quest` loads directly and the tab order is Raids, HSE, HRE, Quest, Shops, Guild Raids
- [x] 4.2 Add `useIsQuestLive` and the `quest` live indicator on the Quest entry and Dailies, and verify with nav tests for quest-only, claim window and none
- [x] 4.3 Add `quest-page.tutorial.tsx` with desktop and mobile steps and its `tour.quest.steps.*` keys, and verify with a tutorial test at both viewports
- [x] 4.4 Add the `quest` namespace in en, de, es and fr with real translations, register its resource type, and verify with the i18n key-parity test

## 5. Verification

- [ ] 5.1 Desktop (1280px, Aspire stack, synced account): with Nubari running, enter scores on battles 1 and 4 and check the summary, crates, points-left order and the detail of battles 4 and 17; run the desktop tour
- [ ] 5.2 Mobile (420px): the tier disclosures, the bottom-sheet score entry and the collapsed board; no horizontal scroll; run the mobile tour

## 6. Gates

- [ ] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, all clean

## Workflow follow-up

- Archive this change in the PR before merge.

## Implementation notes

- 3.5: the battle detail is composed in `pages/dailies/ui/quest/quest-battle-detail.tsx`, not in the feature, because it uses `widgets/battle-preview` and the goal need from `features/daily-raids`, which a feature cannot import (design D6 deviation). The goal need comes from `useDailyRaids` totals, an approximation of the goal plan.
- 5.1 and 5.2 were not run: they need the Aspire stack and a synced account. Component and page tests cover both viewports.
- 6.1: `pnpm lint:fsd` fails steiger's `excessive-slicing` (21 feature slices with `quest-event`); the fix is waiting on a decision. The other gates are clean.
