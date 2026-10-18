# unit-power Specification

## Purpose

Defines the app's single in-game power calculation beyond characters: the power of a Machine of War, the power of an NPC level row, and the character stats the calculation produces. It also requires that every power figure in the app comes from it and the `character-combat-power` estimate, never from a separate formula.

## Requirements

### Requirement: One power formula across the app

Every power figure the app shows, sums, ranks or compares SHALL come from the `character-combat-power` estimate (characters) or from this capability (Machines of War and NPCs). No feature SHALL keep its own power formula or coefficients. The game data SHALL be read from the catalog (`units-*`, `equipment-*`, `upgrades-*`, `npcs-*`, `unit-power`). Power is never written to the API.

Power figures SHALL be shown as whole numbers with locale digit grouping ("16,672").

#### Scenario: Same unit, same number everywhere

- **GIVEN** a synced Tigurius at Gold I, Epic 1 red star, slots 0 to 2 applied, abilities 20/15, no items
- **WHEN** the user opens Tigurius's Library page at Your unit, and a Legendary Event team card holding him alone
- **THEN** both show power 16,672

### Requirement: Character stats come from the power calculation

A character's Health, Damage and Armour at a rank, progression step and set of applied current-rank slots SHALL be step 1 of the `character-combat-power` calculation, with no items. They are the stats the game shows on the unit before equipment.

#### Scenario: Tigurius at Mythic 2 blue stars, Adamantine II

- **WHEN** stats are computed for `ultraTigurius` at Adamantine2 (game rank 19), progression index 17 (`unitStatMultiplierPct` 220), no slots applied
- **THEN** the completed ranks bring base 65/30/14 to 3,616/1,669/779, and × 220% truncated gives Health **7,955**, Damage **3,671**, Armour **1,713**

### Requirement: Machine of War power

The capability SHALL expose, for a Machine of War at a progression index and primary and secondary ability levels, a non-negative integer power that reproduces V1's `calculateRosterMowPower`:

`round((10 + traitMultiplier × ((primaryPower + secondaryPower) × abilityPowerMultiplier + mythicAbilityPower)) × powerMultiplier / 100)`

Here `primaryPower` = active curve[primary − 1] × the primary ability's modifier/100, and `secondaryPower` = **passive** curve[secondary − 1] × the secondary ability's modifier/100 (0 below level 1). `abilityPowerMultiplier` and `mythicAbilityPower` come from the MoW progression step. `traitMultiplier` and `powerMultiplier` are as for characters. MoWs have no stats, weapons, items or rank. A MoW that is not unlocked has power 0.

Assumptions:

- The secondary ability reads the passive curve (the game's convention, ported from V1).
- The mythic ability adds a flat `mythicAbilityPower` once the progression step unlocks one (Mythic 1 blue star and above), regardless of its own level.

#### Scenario: Worked example, maxed Biovore

- **WHEN** power is computed for `tyranBiovore` at progression index 19, primary 60 and secondary 60
- **THEN** primary = active curve[59] 17,781 and secondary = passive curve[59] 12,932 (both modifiers 100). The step's `abilityPowerMultiplier` is 29, so the ability part is (17,781 + 12,932) × 29 = 890,677. `mythicAbilityPower` is 150,000, `traitMultiplier` is 1 (MachineOfWar 100) and `powerMultiplier` 100
- **AND** power = round(10 + 890,677 + 150,000) = **1,040,687**, V1's documented value

### Requirement: NPC power

The capability SHALL expose, for an NPC and one of its catalog `stats` rows, a non-negative integer power from the same calculation as a character, with these inputs:

- Health, Damage and Armour are the row's `health`, `damage` and `armour`, used as final stats (no rank or progression scaling, no upgrades);
- no items, crit or block;
- weapons from the NPC's melee and ranged damage types, hits and `distance`;
- both abilities at the row's `abilityLevel` (only the first active and first passive ability; none when the NPC lists none), multiplied by the hero progression step `abilityPowerMultiplier` at the row's `progressionIndex`;
- the NPC's traits and movement, and `powerMultiplier` 100.

An NPC with no damage type and no ranged weapon (`Watcher`, `Spore Mine`) has `weaponsPower` 0, so its power is `round(10 + traitMultiplier × abilitiesPower)`.

Assumptions:

- The catalog NPC rows carry no crit, block or power multiplier, and for some NPCs not every ability. For 655 of the 1,296 Legendary Event waves in the 1.43 catalog, the summed NPC power equals the game's wave power within rounding. Waves holding any of 66 NPC ids, mostly bosses, differ (by up to about 1.5×). NPC power is therefore a close estimate, not the game's figure, wherever those fields matter.
- A Legendary Event battle's or wave's own catalog `power` remains the game's figure. Features that compare against battle power read that value, not summed NPC power.

#### Scenario: Worked example, Dark Angels Infiltrator

- **WHEN** power is computed for `darkaNpc1Infiltrator`'s third row (`health` 76, `damage` 34, `armour` 22, `abilityLevel` 3, `progressionIndex` 1)
- **THEN** melee Physical × 3 = 3 × 34 × 35% × √0.9 = 33.868, ranged Bolter × 2 at distance 2 = 2 × 34 × 63% × √2 = 60.585, and `weaponsPower` = 69.409
- **AND** `durability` = 76 × (1 + 22/2) = 912 and `statsPower` = (912 × 69.409)^(2/3) = 1,588.32. It has no abilities, `traitMultiplier` = Infiltrate 1.10 × Overwatch 1.15 = 1.265, and movement is 3
- **AND** power = round(10 + 1.265 × 1,588.32 × √3 / 100) = round(44.80) = **45**
- **AND** Fabius Bile Gamma battle 1, round 1 (4 of this row) has catalog power 180 = 4 × 45

#### Scenario: Power data unavailable

- **GIVEN** the `unit-power` dataset is absent or failed to load, or has no entry for the MoW
- **WHEN** a MoW or NPC power is requested
- **THEN** no power is returned and the caller shows its unavailable state
