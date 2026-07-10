import { Rank, rankAt, rankIndex } from "./rank"
import { Rarity } from "./rarity"

// The 15 stars steps a unit's rarity can carry, from freshly-unlocked (no stars) through max
// Mythic ("wings"). Each step adds a flat +10% to Health/Damage/Armour (see `statAtRank`) — ported
// from V1's RarityStars enum. On its own this is ambiguous about rank-eligibility (the same star
// count is valid at two different rarities around a promotion boundary, e.g. "TwoStars" is both
// Common's max and Uncommon's min) — `Progression` below pairs it with a `Rarity` to resolve that.
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

// The 20-step (rarity, stars) ascension path a unit actually walks through — ported 1:1 from V1's
// OrbAscensionCalculator.UPGRADE_PATH state machine. A star count is repeated across a rarity
// boundary (e.g. "Common:TwoStars" then "Uncommon:TwoStars") because promoting rarity alone
// doesn't add a star: it's the same star count presented at the new, higher rarity. Encoded as
// "{Rarity}:{RarityStars}" strings — same flat string-union pattern as `Rank`/`RarityStars` — so a
// step is directly usable as a URL param / Select value / React key without extra
// serialization.
export const progressionOrder = [
  "Common:None",
  "Common:OneStar",
  "Common:TwoStars",
  "Uncommon:TwoStars",
  "Uncommon:ThreeStars",
  "Uncommon:FourStars",
  "Rare:FourStars",
  "Rare:FiveStars",
  "Rare:RedOneStar",
  "Epic:RedOneStar",
  "Epic:RedTwoStars",
  "Epic:RedThreeStars",
  "Legendary:RedThreeStars",
  "Legendary:RedFourStars",
  "Legendary:RedFiveStars",
  "Legendary:OneBlueStar",
  "Mythic:OneBlueStar",
  "Mythic:TwoBlueStars",
  "Mythic:ThreeBlueStars",
  "Mythic:MythicWings",
] as const

export type Progression = (typeof progressionOrder)[number]

export const firstProgression: Progression = progressionOrder[0]
export const lastProgression: Progression =
  progressionOrder[progressionOrder.length - 1]

export const progressionIndex = (value: Progression): number =>
  progressionOrder.indexOf(value)

export const isProgression = (value: string): value is Progression =>
  (progressionOrder as readonly string[]).includes(value)

export const progressionAt = (index: number): Progression =>
  progressionOrder[Math.min(Math.max(index, 0), progressionOrder.length - 1)]

export function progressionRarity(value: Progression): Rarity {
  return value.slice(0, value.indexOf(":")) as Rarity
}

export function progressionStars(value: Progression): RarityStars {
  return value.slice(value.indexOf(":") + 1) as RarityStars
}

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
 * Computes a Health/Damage/Armour stat at a given rank + star progression. Only the star count
 * feeds the multiplier (matching V1's calculateStat, which likewise ignores rarity) — pass
 * `progressionStars(progression)` when working with a full `Progression` step.
 * @param baseStat the value of the stat at Common rarity, no stars, Stone1 (the raw value served
 *   on the character record).
 * @param rank the rank to compute the stat at.
 * @param rarityStars the star progression to compute the stat at.
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

// A unit can only reach a rank its rarity permits — ported from V1's RarityMapper.toMaxRank.
const maxRankByRarity: Record<Rarity, Rank> = {
  Common: Rank.Iron1,
  Uncommon: Rank.Bronze1,
  Rare: Rank.Silver1,
  Epic: Rank.Gold1,
  Legendary: Rank.Diamond3,
  Mythic: Rank.Adamantine2,
}

/** The highest rank a unit at this progression step can be ranked up to. */
export function maxRankForProgression(value: Progression): Rank {
  return maxRankByRarity[progressionRarity(value)]
}

/** The earliest progression step whose rarity unlocks `rank` — the inverse of `maxRankForProgression`. */
export function minProgressionForRank(rank: Rank): Progression {
  const target = rankIndex(rank)
  return (
    progressionOrder.find(
      (value) => rankIndex(maxRankForProgression(value)) >= target
    ) ?? lastProgression
  )
}
