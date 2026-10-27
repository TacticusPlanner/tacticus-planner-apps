## MODIFIED Requirements

### Requirement: Character in-game power

The capability SHALL expose, for one character at a given state, a non-negative integer **combat power** equal to the game's own power score, reproducing V1's `calculateRosterCharacterPower` (`4-entities/unit/character-power`) for the same inputs. A character that is not unlocked SHALL have a combat power of 0.

Inputs: the character's **rank**, its **progression step** (as the progression index 0..19), the **slots applied** at the current rank, its **active** and **passive** ability levels, and its **equipped items** with their levels. Game data comes from the catalog unit record (base Health/Damage/Armour, weapons, movement, traits, first active and first passive ability, rank-up upgrade ids), the equipment and upgrade datasets, and the `unit-power` dataset.

Calculation (the game's formula as V1 ports it; change only if V1 changes):

1. **Stats.** Start from the base Health, Damage and Armour. Add the stat increase of every upgrade slot of every completed rank below the current one: an upgrade adds to Health, Damage or Armour according to its stat. Multiply each by `unitStatMultiplierPct / 100` of the progression step and truncate. Then add the increases of the applied current-rank slots, unscaled.
2. **Items.** Add each item's level stats. Health, Damage, Armour, crit damage and block damage add up. Crit chance and block chance stack as `c + trunc((1 − c/100) × added)`, and so do their bonuses. Once all items are counted, a non-zero crit chance, crit damage, block chance or block damage gains its bonus. The equipped relic (an item with an ability) sets the relic level.
3. **Weapons.** For each weapon (melee, and ranged when present): `(hits × Damage + critDamage × Σ_{i=1..hits} (critChance/100)^i) × profileModifier/100 × √range`. Range is the ranged weapon's distance, and 0.9 for melee. Then `weaponsPower = √(Σ weaponPower²)`.
4. **Durability.** `(Health + 3 × blockDamage × Σ_{i=1..3} (blockChance/100)^i) × (1 + Armour / 2)`. Then `statsPower = (durability × weaponsPower)^(2/3)`.
5. **Abilities.** For each of the active and passive ability: `curve[level − 1] × abilityModifier/100` (0 below level 1), using the active or passive curve. Their sum is multiplied by the step's `abilityPowerMultiplier`. Relic power is `relic[relicLevel − 1]`, or 0 without a relic.
6. **Power.** `round((10 + traitMultiplier × (statsPower × √movement / 100 + abilitiesPower + relicPower)) × powerMultiplier / 100)`, where `traitMultiplier` is the product of `modifier/100` over the unit's traits that have a modifier.

Assumptions:

- A trait or ability without a modifier counts as 100. A missing unit `powerMultiplier` is 100.
- Only the first active and first passive ability count.
- Machines of War are covered by `unit-power`, not here.

#### Scenario: Worked example, Tigurius at Gold I without items

- **WHEN** combat power is computed for `ultraTigurius` at rank Gold1 (game rank 12), progression index 9 (Epic, 1 red star), slots 0, 1 and 2 of the Gold1 row applied, active 20, passive 15, no items
- **THEN** base Health/Damage/Armour 65/30/14 plus the slot increases of the 12 completed ranks gives 964/445/208. × 160% (step 9) gives 1,542/712/332. The applied Gold1 slots (Health +122, Health +122, Damage +56) give **1,786/768/332**
- **AND** melee Physical: 768 × 35% × √0.9 = 255.006. Ranged Psychic, range 2: 768 × 191% × √2 = 2,074.482. `weaponsPower` = 2,090.096
- **AND** `durability` = 1,786 × (1 + 332/2) = 298,262, and `statsPower` = (298,262 × 2,090.096)^(2/3) = 729,753.4
- **AND** the abilities are StormOfWrath 89 × 120% = 106.8 and PsychicFortress 39 × 80% = 31.2, and × `abilityPowerMultiplier` 5 that is 690
- **AND** `traitMultiplier` = Psyker 1.25 (Hero 1.0), movement 3, `powerMultiplier` 100, so power = round(10 + 1.25 × (729,753.4 × √3 / 100 + 690)) = round(16,672.1) = **16,672**

#### Scenario: Worked example, an item adds crit

- **GIVEN** the Tigurius example, now with `I_Crit_C001` (Combat Knife) at level 3: crit chance 20, crit damage 50
- **WHEN** combat power is computed
- **THEN** each one-hit weapon gains 50 × 0.2 = 10 crit damage, giving weapon powers 258.326 and 2,101.493, `weaponsPower` 2,117.311 and `statsPower` 736,074.4
- **AND** power = round(10 + 1.25 × (736,074.4 × √3 / 100 + 690)) = **16,809**

#### Scenario: Locked character has zero power

- **WHEN** combat power is requested for a character the player has not unlocked
- **THEN** the reported combat power is 0, with no error

#### Scenario: Parity with V1 and the live game

- **WHEN** combat power is computed for `worldKharn` at progression 18, game rank 19, abilities 60/60, no slots applied, items `I_Crit_M006`, `I_Booster_Crit_M003` and `I_Block_M003` at level 1, and for `orksWarboss` at progression 16, game rank 19, abilities 60/60, items `R_Crit_HeadwoppasKillchoppa` 6, `I_Block_L003` 11 and `I_Booster_Block_M002` 1
- **THEN** the results are 936,827 and 1,037,811, which are V1's results and the in-game values V1 confirmed

#### Scenario: Power data missing for a unit

- **GIVEN** the `unit-power` dataset has no entry for a character, or is absent
- **WHEN** combat power is requested for it
- **THEN** no power is returned (unavailable), never 0 or a partial figure, and the caller shows its unavailable state
