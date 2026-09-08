## Purpose

Provides a shared, roster-agnostic estimate of how strong a single owned
character is overall, so any feature can rank the player's characters by combat
strength without re-deriving the formula. Ported from V1's
`CharactersPowerService`.

## ADDED Requirements

### Requirement: Character combat power estimate

The capability SHALL expose, for one owned character, a non-negative integer
**combat power** equal to the sum of that character's **attribute power** and
**ability power**, reproducing V1's `CharactersPowerService.getCharacterPower`
result for the same inputs. A character that is not unlocked SHALL have a
combat power of 0.

Inputs, all taken from data the app already syncs:

- the character's **rank**;
- the character's **progression step**, which determines its **rarity** and its
  **star tier**;
- the character's **applied-upgrade count** (number of rank-up upgrade slots
  applied at the current rank);
- the character's **active** and **passive** ability levels.

Game-mechanic assumptions (ported verbatim from V1; change only if V1 changes):

- `attributePower = round( attributesWeight × starsCoeff × ( rankCoeff(rank) + upgradeBoost × appliedUpgradeCount ) )`
  where `attributesWeight = 3_000_000 / 9326`, `rankCoeff(r) = 1.25 ^ rankIndex(r)`
  with `rankIndex` = 0 at the lowest rank (`Stone1`), and
  `upgradeBoost = (1 / 9) × ( rankCoeff(next rank) − rankCoeff(rank) )`
  (0 at the top rank).
- `starsCoeff = 1 + 0.1 × starTierIndex`, where `starTierIndex` runs 0 for a
  no-star tier up to 14 for `MythicWings` (V1's `RarityStars` order).
- `abilityPower = round( abilityWeight × rarityCoeff(rarity) × ( abilityCoeff(activeLevel) + abilityCoeff(passiveLevel) ) )`
  where `abilityWeight = 500_000 / 41_274`, `rarityCoeff` is
  `{ Common: 1.0, Uncommon: 1.2, Rare: 1.4, Epic: 1.6, Legendary: 1.8, Mythic: 2.0 }`,
  and `abilityCoeff(level)` is V1's piecewise curve:
  `level ≤ 22 → level`;
  `23–39 → 3.8 × (level − 22) + 22`;
  `40 → 5.3 × (level − 39) + 86.6`;
  `41–44 → 8.4 × (level − 40) + 91.9`;
  `45–50 → 17.3 × (level − 44) + 125.5`;
  `> 50 → 35 × (level − 50) + 229.3`.
- attribute power and ability power are each rounded to the nearest integer
  before being summed, and the sum is rounded again (matches V1).
- Machines of War are out of scope for this capability.

#### Scenario: Combat power of an unlocked character (worked example)

- **WHEN** combat power is computed for an owned character `Bellator` at rank
  `Gold1`, progression step `Epic:RedOneStar` (rarity `Epic`, star tier
  `RedOneStar` → `starTierIndex` 6), with 3 applied upgrades, active ability
  level 20, and passive ability level 15
- **THEN** the intermediate values are:
  `rankCoeff(Gold1) = 1.25 ^ 12 = 14.5519152`,
  `rankCoeff(Gold2) = 1.25 ^ 13 = 18.1898940`,
  `upgradeBoost = (1/9) × (18.1898940 − 14.5519152) = 0.4042199`,
  `rankCoeff(Gold1) + upgradeBoost × 3 = 15.7645748`,
  `starsCoeff = 1 + 0.1 × 6 = 1.6`,
  `attributesWeight = 3_000_000 / 9326 = 321.6813210`,
  `attributePower = round(321.6813210 × 1.6 × 15.7645748) = round(8113.8708) = 8114`
- **AND** `abilityCoeff(20) = 20`, `abilityCoeff(15) = 15`, sum `= 35`,
  `rarityCoeff(Epic) = 1.6`,
  `abilityWeight = 500_000 / 41_274 = 12.1141639`,
  `abilityPower = round(12.1141639 × 1.6 × 35) = round(678.3932) = 678`
- **AND** the reported combat power is `round(8114 + 678) = 8792`

#### Scenario: Locked character has zero power

- **WHEN** combat power is requested for a character the player has not
  unlocked
- **THEN** the reported combat power is 0, with no error

#### Scenario: Parity with V1

- **WHEN** combat power is computed for any character whose rank, progression
  step, applied-upgrade count, and ability levels are known
- **THEN** the result equals V1's `CharactersPowerService.getCharacterPower`
  for the same inputs
