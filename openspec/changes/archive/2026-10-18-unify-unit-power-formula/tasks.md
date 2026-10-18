# Tasks

Apply after the `tacticus-planner-api` companion `unify-unit-power-formula` (the `unit-power` dataset) is merged. Groups 1–5 shipped together in one PR; group 6 browser checks are done by hand before merge.

## 1. Catalog dataset and domain formula

- [x] 1.1 Add the `unit-power` schema, payload type and IndexedDB sync to `packages/game-catalog` (`schemas/unit-power.ts`, `dataset-payloads.ts`, queries `getUnitPower`), and verify with a schema test against the API's served sample (Tigurius row, MoW step 19).
- [x] 1.2 Port V1's formula to `packages/game-domain/src/unit-power.ts` (`characterStats`, `characterPower`, `mowPower`, `npcPower`, `UnitPowerTables`, `UnitPowerDataError`), and verify by porting V1's `character-power.test.ts` cases (fixture 3,514, worldKharn 936,827, orksWarboss 1,037,811, tyranBiovore 1,040,687, mythic bonus, unknown unit throws) plus the spec worked examples (Tigurius 16,672 and 16,809, stats 7,955/3,671/1,713, Infiltrator 45).
- [x] 1.3 Add a parity test that sums `npcPower` over every LE wave in the bundled test catalog and asserts at least 655 of 1,296 waves match the catalog wave power within the enemy count, and verify it passes. It pins today's coverage.
- [x] 1.4 Remove `combat-power.ts` (`characterCombatPower`, `abilityCoeff`, …) and its tests from `game-domain`, and keep `statAtRank` only for the comparison radar. Verify with `pnpm typecheck` that no caller remains outside the ones migrated below.

## 2. Shared loader

- [x] 2.1 Add `apps/web/src/fsd/shared/unit-power` (`useUnitPowerContext`, `rosterCharacterPower`, `characterPowerAt`, `characterStatsAt`, `mowPowerAt`, `npcPowerAt`, null for unavailable), exported through its index only, and verify with unit tests for loading, dataset absent, unknown unit, unknown item, and a synced record with `appliedUpgradeSlots` and `equippedItems`.

## 3. Legendary Events and Dailies migration

- [x] 3.1 Replace `unit-combat-power.ts` with the shared adapter. Add `equippedItems` to `LegendaryEventRosterUnit`. Pass the power context through `ClearEstimateConfig`, treat a null member as no estimate, and keep `laneBattlePowers` on catalog power. Verify by updating `clear-estimate.test.ts`, `calibrate-power-ratio.test.ts`, `clear-estimates.view-model.test.ts` and `clear-estimate.fixtures.ts` to the spec worked examples (E 102,229.4, depth 6, 12% / 37%; partial 68,311; locked 80,346.4; unit 100,032; equipment 16,809) and the unavailable state.
- [x] 3.2 Update Goals Preview, Upgrade impact, Team suggestions and master-table tests to the new figures (preview 28,224 → clears 7; Certus 45 → 0; Four 90,579.4 → +191 rows; Melee 70,791; Five 88,362.4), and verify the suites pass.
- [x] 3.3 Move Dailies `combatPowerOf` to `rosterCharacterPower` with `equippedItems` on `TeamRosterCharacter`. Verify with `team-recommendations` / `team-eligibility` tests that ordering follows the new power and that an unavailable unit sorts as 0 without crashing.

## 4. LE team card total power

- [x] 4.1 Add `teamPower` to `teams.view-model.ts` (non-reserve owned members, no multiplier, null when any owned member is unavailable) and render "Team power" on the card (desktop header row; mobile on the points-per-battle line; "—" with the screen-reader reason when unavailable). Verify with `teams.view-model.test.ts` (98,895; 77,012 with Titus locked and a reserve) and `team-card.test.tsx` (placeholder, value, unavailable).
- [x] 4.2 Add the `legendaryEvents` i18n keys for "Team power" and "Power data unavailable" with real de/es/fr translations, and verify the locale key-parity test passes.

## 5. Library pages

- [x] 5.1 Character unit page: add a `useCharacterPowerView` hook (stats and power from one `characterStats` call, inputs per spec D6), switch At a glance and Stats by rank to its stats, and show Power with its "Includes your equipped items" / "Without equipment" line in the header. Verify with `character-unit.view-model.test.ts` (7,955; 16,809; Custom Gold II drops slots; not owned) and `character-unit-page.test.tsx` (stepper updates power, unavailable state).
- [x] 5.2 MoW unit page: show Power in the header from `mowPowerAt` at the shown values and panel levels, and verify with `mow-unit.view-model.test.ts` (1,040,687; Custom index 16 → 873,548) and `mow-unit-page.test.tsx` (unavailable).
- [x] 5.3 NPC library: add the Power stat card with its "estimated" note (popover on hover, focus or tap), and verify with an `npcs-page.test.tsx` case (Infiltrator row 3 → 45, level change updates, no-attack unit, unavailable).
- [x] 5.4 Update the tour copy for `characterUnit.tour.steps.header`, `mowUnit.tour.steps.header` and `npcs.tour.steps.stats` to mention power, add the `characterUnit`/`mowUnit`/`npcs` keys for "Power", the two equipment lines, "Power data unavailable" and the NPC estimate note, all with real de/es/fr translations. Verify with the locale key-parity test and the existing tutorial tests (`npcs.tutorial.test.tsx` and the unit page tutorial coverage) at both viewports.

## 6. Verification

Data states needed: a signed-in account synced with an owned character wearing items (and one without), an unowned character, an owned MoW, a signed-out session, and a Legendary Event with saved teams including a locked member and a reserve. For the unavailable state, block the `unit-power` dataset request in the browser.

### Desktop verification (≥ 768px)

- [ ] 6.1 Character page: the header power matches the game's power for the synced character (compare in-game), stepper and Custom changes update it, and the header tour step shows the new copy.
- [ ] 6.2 MoW page and NPC library: power shows and updates, the NPC estimate note opens, and the tour steps render.
- [ ] 6.3 LE lane: team cards show Team power beside points per battle, the estimates and leaderboard clears render, and blocking `unit-power` shows "—" everywhere with manual-only depths.

### Mobile verification (< 768px, same-origin iframe per `tp-manual-ui-verification`)

- [ ] 6.4 Character and MoW pages: the header power is visible in the mobile header and the header tour step targets it.
- [ ] 6.5 NPC library: the Power card is in the mobile stat row, and the note opens on tap.
- [ ] 6.6 LE lane: Team power sits on the points-per-battle line of the mobile card.

### Gates

- [x] 6.7 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, all clean.

## Workflow follow-up

- Review each stacked PR in its own thread; archive the change (and sync specs) after review.
