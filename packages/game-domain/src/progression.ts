import { Rank, rankAt, rankIndex, type Rank as RankType } from "./rank"
import type { Rarity } from "./rarity"

// The 20-step (rarity, stars) ascension path a unit actually walks through — ported 1:1 from V1's
// OrbAscensionCalculator.UPGRADE_PATH state machine. A star count is repeated across a rarity
// boundary (e.g. "Common:TwoStars" then "Uncommon:TwoStars") because promoting rarity alone
// doesn't add a star: it's the same star count presented at the new, higher rarity. Encoded as
// "{Rarity}:{Stars}" strings, so a step is directly usable as a URL param / Select value / React
// key without extra serialization.
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

const progressionStarsIndexBySuffix: Readonly<Record<string, number>> = {
  None: 0,
  OneStar: 1,
  TwoStars: 2,
  ThreeStars: 3,
  FourStars: 4,
  FiveStars: 5,
  RedOneStar: 6,
  RedTwoStars: 7,
  RedThreeStars: 8,
  RedFourStars: 9,
  RedFiveStars: 10,
  OneBlueStar: 11,
  TwoBlueStars: 12,
  ThreeBlueStars: 13,
  MythicWings: 14,
}

export function progressionStarsIndex(value: Progression): number {
  const suffix = value.slice(value.indexOf(":") + 1)
  return progressionStarsIndexBySuffix[suffix] ?? 0
}

const perRankGrowth = 1.252_05
const postDiamond3Growth = 1.1091

function rankCoefficient(rank: RankType): number {
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

export function statAtRank(
  baseStat: number,
  rank: RankType,
  progression: Progression,
  appliedUpgrades = 0
): number {
  const starsMultiplier = 1 + 0.1 * progressionStarsIndex(progression)
  const previousRank = rankAt(rankIndex(rank) - 1)
  return Math.floor(
    baseStat * rankCoefficient(rank) * starsMultiplier +
      baseStat * rankCoefficient(previousRank) * appliedUpgrades
  )
}

const maxRankByRarity: Record<Rarity, RankType> = {
  Common: Rank.Iron1,
  Uncommon: Rank.Bronze1,
  Rare: Rank.Silver1,
  Epic: Rank.Gold1,
  Legendary: Rank.Diamond3,
  Mythic: Rank.Adamantine2,
}

export function maxRankForProgression(value: Progression): RankType {
  return maxRankByRarity[progressionRarity(value)]
}

export function minProgressionForRank(rank: RankType): Progression {
  const target = rankIndex(rank)
  return (
    progressionOrder.find(
      (value) => rankIndex(maxRankForProgression(value)) >= target
    ) ?? lastProgression
  )
}
