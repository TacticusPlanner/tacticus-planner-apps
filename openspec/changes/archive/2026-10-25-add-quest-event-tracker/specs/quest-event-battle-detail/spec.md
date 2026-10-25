# Spec Delta

## Purpose

Shows one Quest Event battle in full: its board, its enemies with level and stats, the rarity cap and deploy slots, the Lightning Victory turns, the bonus objectives with their scores, and the upgrade it can drop with the player's goal need for it.

## ADDED Requirements

### Requirement: The battle header states the lineup rules

The detail SHALL open with the battle number and tier, the deploy slots ("3 units, Nubari included"), the rarity cap for the tier and what it limits, the Lightning Victory turn count, the enemy power (the served `power`, or "Enemy power not recorded" when null), and the battle's maximum points. The cap line SHALL name the tier's rarity and its maximum stars, rank, ability level and item level, read from `game-domain` (`abilityCapByRarity`, the progression and rank caps) and the served equipment ladder for that rarity.

Assumptions:

- Units above the cap are clamped to it in the battle: stars and rank, ability levels, and items, which drop to the cap rarity's maximum item level (confirmed by Severyn).

#### Scenario: Nubari battle 4

- **GIVEN** Nubari battle 4 (Uncommon, position 1, `lightningVictoryTurns` 2)
- **THEN** the header shows "Battle 4 · Uncommon", "3 units, Nubari included", the Uncommon cap with ability level 17, "Lightning Victory in 2 turns", "Enemy power 1,183" and "Up to 600 points"

### Requirement: The board image is shown with an unavailable state

The detail SHALL show the board for the served `boardId` through `battleBoardImage(boardId)`, which looks in `quest_maps` and then `le_maps`. On desktop the board SHALL sit beside the enemies; on mobile it SHALL be in a "Board" disclosure, collapsed by default. A missing or failed image SHALL show the "Map not available" placeholder used by the LE preview.

#### Scenario: Missing board

- **GIVEN** a `boardId` with no image in either folder
- **THEN** the placeholder shows, and the rest of the detail renders

### Requirement: Enemies are shown with level and stats, pickups apart

The detail SHALL list the served enemies in served order with the shared battle-preview enemy tiles: portrait, localized name, "×N" above 1, and the level from `ladderIndex` as `legendary-event-battle-preview` defines it, including its unknown-level fallback. Tapping a tile SHALL open the same enemy detail (popover on desktop, bottom sheet on mobile) with the Library link. Entries whose NPC is classified as a loot object (the board power-ups) SHALL be listed apart under "Board pickups" with no level. The header SHALL show the total enemy count, pickups excluded.

#### Scenario: Nubari battle 4 enemies

- **THEN** the detail lists Terminator ×1, Bloodletter ×3 and Traitor Guardsman ×2, each at its index-7 level, with "6 enemies"

#### Scenario: Power-up

- **GIVEN** Nubari battle 9, which serves `powupArmor`
- **THEN** it shows under "Board pickups" and is not counted as an enemy

### Requirement: Objectives are shown as chips with their scores

Each served objective SHALL show as a chip with an icon, localized wording and its score. The wording per type:

| Type                     | Wording (en)                    |
| ------------------------ | ------------------------------- |
| `NoDamageTakenByAnyHero` | No unit takes damage            |
| `NotTrait`               | No {trait} units                |
| `NotFaction`             | No {faction} units              |
| `NotDamageType`          | No {damage type} damage         |
| `DamageType`             | Deal {damage type} damage       |
| `HasRangedAttack`        | Only units with a ranged attack |
| `MaxHits`                | Units with at most {n} hits     |
| `MinHits`                | Units with at least {n} hits    |
| `UseNoSummons`           | No summons                      |
| `DoNoHealOrRepair`       | No healing or repair            |

Traits, factions and damage types SHALL be localized by id. The lineup-restricting types (`NotTrait`, `NotFaction`, `NotDamageType`, `HasRangedAttack`, `MaxHits`, `MinHits`, `UseNoSummons`, `DoNoHealOrRepair`) SHALL carry a restriction marker with accessible text, not colour alone. An unknown type SHALL show its raw type with its score. The same chips SHALL show, compact, on the battle row.

#### Scenario: Nubari battle 4 objectives

- **THEN** the chips read "No Rapid Assault units · 100" and "No Blast damage · 100", both marked as restrictions

### Requirement: The drop shows its odds and the player's goal need

The detail SHALL show the drop's material icon and localized name, its odds as "3 in 4" with a percent ("75%"), and the goal need for that material from `goal-farming` over the player's active goals: "Have X / need Y" and up to 3 units that need it, in goal priority order. With no active goal needing it, it SHALL say "No goal needs this". A tier row SHALL show the drop's material icon with the same odds as accessible text.

Assumptions:

- Quest drops use the jar system, not mercy, so the odds are per won attempt and are not shown as a guarantee.

#### Scenario: Mythic drop

- **GIVEN** Nubari battle 17 drops `upgHpM004` at 1 in 6, and one goal needs 2 of it with 0 owned
- **THEN** the detail shows "1 in 6 (17%)" and "Have 0 / need 2" with that goal's unit

### Requirement: Loading and missing data are distinct

While `npcs` is loading, tiles SHALL show the raw id with no level. A `quest-events` failure SHALL be handled by the tracker. A failed goal-need read SHALL hide the need line only, with a short notice.

#### Scenario: NPCs failed

- **GIVEN** the `npcs` read failed
- **THEN** the tiles show raw ids with "Level unknown", and the header, objectives and drop still render
