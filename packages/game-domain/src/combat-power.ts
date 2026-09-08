import {
  progressionRarity,
  progressionStarsIndex,
  type Progression,
} from "./progression"
import { rankIndex, rankOrder, type Rank } from "./rank"
import type { Rarity } from "./rarity"

// Ported 1:1 from V1's `CharactersPowerService`
// (tacticusplanner/src/fsd/4-entities/unit/characters-power.service.ts). This module is the single
// point to re-sync if V1's coefficients change. Character-only: V1's Machine-of-War branches are
// intentionally not ported (MoWs are out of scope for every current consumer).

export type CharacterCombatPowerInput = {
  /** Owned with a non-locked rank. An un-unlocked unit has 0 combat power. */
  unlocked: boolean
  rank: Rank
  /** Current progression step — yields both the rarity and the star tier. */
  progression: Progression
  /** Rank-up upgrade slots applied at the current rank. */
  appliedUpgradeCount: number
  activeAbilityLevel: number
  passiveAbilityLevel: number
}

const ATTRIBUTES_WEIGHT = 3_000_000 / 9326
const ABILITY_WEIGHT = 500_000 / 41_274

/** V1's `getRarityCoeff` character table. */
const rarityCoeffByRarity: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1.2,
  Rare: 1.4,
  Epic: 1.6,
  Legendary: 1.8,
  Mythic: 2,
}

/** V1's `getAbilityCoeff` piecewise level curve. */
export function abilityCoeff(level: number): number {
  if (level <= 22) return level
  if (level <= 39) return 3.8 * (level - 22) + 22
  if (level <= 40) return 5.3 * (level - 39) + 86.6
  if (level <= 44) return 8.4 * (level - 40) + 91.9
  if (level <= 50) return 17.3 * (level - 44) + 125.5
  return 35 * (level - 50) + 229.3
}

/** V1's `getRankCoeff`: `1.25 ^ (rank ladder index)`, index 0 at `Stone1`. */
function rankCoeff(rank: Rank): number {
  return Math.pow(1.25, rankIndex(rank))
}

/** V1's `getStarsCoeff` character table against the 0..14 progression star index
 * (`None` → 1.0, `OneStar` → 1.1, … `MythicWings` → 2.4). */
function starsCoeff(progression: Progression): number {
  return 1 + 0.1 * progressionStarsIndex(progression)
}

/** V1's `getCharacterAbilityPower` (character branch). */
export function characterAbilityPower(
  input: CharacterCombatPowerInput
): number {
  if (!input.unlocked) return 0
  const rarity = progressionRarity(input.progression)
  return Math.round(
    ABILITY_WEIGHT *
      rarityCoeffByRarity[rarity] *
      (abilityCoeff(input.activeAbilityLevel) +
        abilityCoeff(input.passiveAbilityLevel))
  )
}

/** V1's `getCharacterAttributePower`. */
export function characterAttributePower(
  input: CharacterCombatPowerInput
): number {
  if (!input.unlocked) return 0
  const current = rankCoeff(input.rank)
  const nextIndex = rankIndex(input.rank) + 1
  // V1 reads `getRankCoeff(rank + 1)` unclamped and would produce NaN at the very top of the ladder
  // (a rank no real unit reaches). Clamp instead: at the max rank the upgrade boost is simply 0.
  const next =
    nextIndex < rankOrder.length ? rankCoeff(rankOrder[nextIndex]) : current
  const upgradeBoost = (1 / 9) * (next - current)
  return Math.round(
    ATTRIBUTES_WEIGHT *
      starsCoeff(input.progression) *
      (current + upgradeBoost * input.appliedUpgradeCount)
  )
}

/** A single owned character's overall combat strength — V1's `getCharacterPower`. The sum of
 * attribute power and ability power, each rounded, then rounded again. */
export function characterCombatPower(input: CharacterCombatPowerInput): number {
  if (!input.unlocked) return 0
  return Math.round(
    characterAttributePower(input) + characterAbilityPower(input)
  )
}
