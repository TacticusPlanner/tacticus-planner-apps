import { Rank, rankAt, rankIndex } from "./rank"

// The 15-step rarity+stars progression a unit can be at, from a freshly-unlocked Common unit (no
// stars) through max Mythic ("wings"). Each step adds a flat +10% to Health/Damage/Armour (see
// `statAtRank`). Ported from V1's RarityStars enum — rarity and stars are interdependent in-game
// (a unit's rarity caps how many stars it can have), so this is exposed as a single combined
// progression selector rather than two separate rarity/stars controls.
export const rarityStarsOrder = [
  "None",
  "OneStar",
  "TwoStars",
  "ThreeStars",
  "FourStars",
  "FiveStars",
  "RedOneStar",
  "RedTwoStars",
  "RedThreeStars",
  "RedFourStars",
  "RedFiveStars",
  "OneBlueStar",
  "TwoBlueStars",
  "ThreeBlueStars",
  "MythicWings",
] as const

export type RarityStars = (typeof rarityStarsOrder)[number]

export const firstRarityStars: RarityStars = rarityStarsOrder[0]
export const lastRarityStars: RarityStars =
  rarityStarsOrder[rarityStarsOrder.length - 1]

export const rarityStarsIndex = (value: RarityStars): number =>
  rarityStarsOrder.indexOf(value)

export const isRarityStars = (value: string): value is RarityStars =>
  (rarityStarsOrder as readonly string[]).includes(value)

// Per-rank stat growth coefficient. Ranks up to and including Diamond3 grow at 1.25205x per rank;
// from Adamantine1 on, growth slows to 1.1091x per rank (compounding on top of the Diamond3
// value). Ported 1:1 from V1's StatsCalculatorService.getRankCoefficient — `rankIndex(rank)` here
// is the same 0-based value V1 computed via `(rank as number) - 1`.
const perRankGrowth = 1.252_05
const postDiamond3Growth = 1.1091

function rankCoefficient(rank: Rank): number {
  const rankValue = rankIndex(rank)
  const diamond3Value = rankIndex(Rank.Diamond3)
  if (rankValue <= diamond3Value) {
    return Math.pow(perRankGrowth, rankValue)
  }
  return (
    Math.pow(perRankGrowth, diamond3Value) *
    Math.pow(postDiamond3Growth, rankValue - diamond3Value)
  )
}

/**
 * Computes a Health/Damage/Armour stat at a given rank + rarity/stars progression.
 * @param baseStat the value of the stat at Common rarity, no stars, Stone1 (the raw value served
 *   on the character record).
 * @param rank the rank to compute the stat at.
 * @param rarityStars the rarity+stars progression to compute the stat at.
 * @param appliedUpgrades how many rank-up upgrades affecting this stat have been applied (0 for a
 *   fresh/unowned lookup — the stat value on first reaching `rank`).
 */
export function statAtRank(
  baseStat: number,
  rank: Rank,
  rarityStars: RarityStars,
  appliedUpgrades = 0
): number {
  const starsMultiplier = 1 + 0.1 * rarityStarsIndex(rarityStars)
  const previousRank = rankAt(rankIndex(rank) - 1)
  return Math.floor(
    baseStat * rankCoefficient(rank) * starsMultiplier +
      baseStat * rankCoefficient(previousRank) * appliedUpgrades
  )
}
