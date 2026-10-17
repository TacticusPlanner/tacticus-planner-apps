## Context

See proposal.md for why. Today `@workspace/game-domain` `characterCombatPower` (V1's old heuristic) feeds the Legendary Event entity (`unit-combat-power.ts` → `clear-estimate.ts`, and through it Goals Preview, Upgrade impact, Team suggestions and the master table) and Dailies (`team-eligibility.ts` `combatPowerOf`). The character unit page computes stats with `statAtRank`, an approximation that is about 1% off at Adamantine II (8,032 against the game's 7,955 for Tigurius). V1's new formula (`tacticusplanner/src/fsd/4-entities/unit/character-power/character-power.ts`, about 490 lines) reads a GameConfig slice. I checked it against the V2 catalog: unit base stats, weapons, movement, rank-up upgrade ids and all 217 equipment items are identical to V1's slice. The missing pieces arrive in the API companion's `unit-power` dataset. A Python port of the formula run against this data reproduces V1's in-game references exactly (worldKharn 936,827, orksWarboss 1,037,811).

Contract surface with the companion `tacticus-planner-api` change `unify-unit-power-formula`: the served `unit-power` dataset (`specs/unit-power-dataset/spec.md` there).

## Goals / Non-Goals

**Goals:**

- One power implementation, ported 1:1 from V1 and pinned by V1's in-game reference values.
- Every power number in V2 (Library, LE, Dailies) comes from it, and character stats on the unit page come from its stat step.

**Non-Goals:**

- Power on the Library list pages (characters and MoWs lists), roster pages, or sorting by power. These can follow once the shared slice exists.
- Exact NPC power for bosses and other NPCs whose crit, block or abilities the datamine lacks (see Risks).
- Recalibrating the clear-estimate power ratio. It stays 1 and uncalibrated.
- Equipment planning (power for items the player does not wear).

## Decisions

### D1. The formula lives in `@workspace/game-domain` as pure functions over typed inputs

`packages/game-domain/src/unit-power.ts` replaces `combat-power.ts`. It exports `characterStats`, `characterPower`, `mowPower` and `npcPower`. Each takes a typed `UnitPowerTables` (built once from the `unit-power` record into maps) plus the unit's catalog fields, the item level stats and the upgrade stat types it needs, and the unit's state. The math is V1's, step for step, including the truncations, chance stacking, the √0.9 melee range and the passive curve for a MoW's secondary ability. V1's loud validation becomes a typed `UnitPowerDataError`. Domain code throws it, and app adapters turn it into "unavailable".

Alternatives: keep V1's untyped `JsonObject` walker (rejected: V2's catalog is already parsed and typed), or compute on the API (rejected: Custom values and ability steppers on the Library pages need instant client-side recomputation).

`characterCombatPower`, `characterAbilityPower`, `characterAttributePower` and `abilityCoeff` are deleted, along with their tests. `statAtRank` stays for the comparison radar's V1 reference stats only; its other callers move to `characterStats`.

### D2. One shared loader slice: `apps/web/src/fsd/shared/unit-power`

The power inputs come from four datasets (`unit-power`, characters/MoWs, `equipment-*`, `upgrades-*`), and both entities (`legendary-event`) and pages (library, dailies) need them. Entities may not import entities, so the loader goes in `shared`:

- `useUnitPowerContext(): ReadState<UnitPowerContext | null>` reads the datasets with `@workspace/game-catalog/queries` and builds the tables once (memoized per catalog hash). `null` means the dataset is absent.
- Adapters: `rosterCharacterPower(rosterRecord, ctx)` (synced `characters` record: `progressionIndex`, `rank`, `appliedUpgradeSlots`, `abilities[0..1]`, `equippedItems`), `characterPowerAt(characterId, values, ctx)`, `characterStatsAt(...)`, `mowPowerAt(...)` and `npcPowerAt(npcId, row, ctx)`. Each returns `number | null`, where null means unavailable for that unit.

Consumers pass `ctx` down as data, so the existing LE entity functions stay pure. `unitEffectivePower(unitId, roster, config)` gains the context through `ClearEstimateConfig`. The public API is `@/shared/unit-power` (index file only). The FSD boundary validator (`pnpm lint:fsd`) must stay green.

### D3. Roster records carry equipment

`LegendaryEventRosterUnit` adds `equippedItems`, and the Dailies `TeamRosterCharacter` adds `equippedItems`. Both are already in the synced `characters` chunk (`player-data.schema.ts`). Upgrade slot indices (`appliedUpgradeSlots`) index the catalog `rankUpUpgrades` row directly, which is the same column order as V1's `upgrades[rank]`. They are deduplicated as today.

### D4. Unavailable is distinct from zero

A locked unit is 0. Missing data (dataset absent, failed to load, or a unit or item the tables don't know) is `null`. LE treats any null member as "no estimate" for that team or unit, so it never shows a partial sum, and the team card's Team power shows "—". The Library pages show "Power data unavailable". This matches V1's intent ("throws loudly rather than a believable-but-wrong number") without blanking the page.

### D5. Clear depth keeps catalog battle power

This is the user's decision: "Catalog power". `laneBattlePowers` is unchanged. NPC power is used only on the NPC library page, with its "estimated" note.

### D6. Library character page inputs (desktop and mobile identical)

Power = `characterPower` at the shown values (`ShownValues`), with the ability panel levels, the player's applied slots only while the shown rank equals the player's rank, the player's equipped items (owned only), and the relic at the Relic panel level when it is the equipped relic. At a glance and Stats by rank use `characterStats` without items. One `useCharacterPowerView` hook in `pages/library/ui/character-unit` derives the stats and power from a single `characterStats` call, so the two never disagree. Power goes in the unit header's values area on both forms, as on the MoW page. No new Joyride target is needed, because the existing `header` step targets `unit-header`. The header step copy (`characterUnit.tour.steps.header`, `mowUnit.tour.steps.header`) and the NPC `stats` step copy gain a sentence about power in every locale.

### D7. Team card total

`teams.view-model.ts` adds `teamPower: number | null` per card, as the sum of `rosterCharacterPower` over the non-reserve owned members (null if any owned member is unavailable). On desktop it goes after points per battle in the card header row. On mobile it shares the points-per-battle line. Both use the existing card markup, so there is no layout fork beyond that line.

## Risks / Trade-offs

- [Every LE and Dailies number shifts] → Estimates move to the game's scale. The spec worked examples were recomputed with the new formula, and the scenarios use `powerRatio` 1.2 so they keep their depth outcomes. The one exception is Certus's unlock preview (2 → 0), because a fresh Stone I unit has power 45 on the game's scale. Calibration via `calibratePowerRatio` is unchanged and can be rerun.
- [NPC power is approximate] → It matches the game's wave power for 656 of 1,292 LE waves. Waves with any of 66 NPC ids (mostly bosses) differ by up to 1.5×. It is shown only on the NPC library with an "estimated" note, and a catalog parity test pins the matching count so a data refresh that improves or breaks it is visible.
- [`unit-power` stale after a game patch] → The API refuses to load when a catalog unit is missing from it, and the client returns null for an unknown unit or item instead of a wrong figure.
- [Bundle and IndexedDB size] → `unit-power` is a few tens of KB served (two curves, about 600 ability modifiers, 130 small unit rows), against about 1.3 MB for V1's slice, because items and upgrades are reused.

## Migration Plan

API companion first (adds the dataset). Then this change, in stacked PRs: (1) domain formula and parity tests, plus the game-catalog dataset and shared loader; (2) LE and Dailies migration with the team-card total; (3) Library character, MoW and NPC pages. Rollback is reverting the apps PRs; the API dataset is additive.
