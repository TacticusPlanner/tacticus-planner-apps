import {
  lastRank,
  progressionIndex,
  rankIndex,
  rarityRank,
} from "@workspace/game-domain"
import type { Progression, Rank, Rarity } from "@workspace/game-domain"

import type { TeamRosterUnit } from "../model/use-team-roster"

/** A rarity's caps, as V1's team editor applies them (spec assumption). */
interface RarityCaps {
  rank: Rank
  level: number
  progression: Progression
}

const RARITY_CAPS: Record<Rarity, RarityCaps> = {
  Common: { rank: "Iron1", level: 8, progression: "Common:TwoStars" },
  Uncommon: { rank: "Bronze1", level: 17, progression: "Uncommon:FourStars" },
  Rare: { rank: "Silver1", level: 26, progression: "Rare:RedOneStar" },
  Epic: { rank: "Gold1", level: 35, progression: "Epic:RedThreeStars" },
  Legendary: {
    rank: "Diamond3",
    level: 50,
    progression: "Legendary:OneBlueStar",
  },
  // V1 caps Mythic at Adamantine 3 and level 65; nothing in V2 goes past either, so Mythic caps
  // nothing.
  Mythic: { rank: lastRank, level: 65, progression: "Mythic:MythicWings" },
}

/** The editor's default cap: Mythic, which shows every unit as it is. */
export const DEFAULT_RARITY_CAP: Rarity = "Mythic"

/**
 * A roster unit as it shows under the cap: a unit above the cap's rarity has its progression,
 * rank, level and ability levels capped. Display only; the team never stores a cap.
 */
export function capRosterUnit(
  unit: TeamRosterUnit,
  cap: Rarity,
  rarity: (progression: Progression) => Rarity
): TeamRosterUnit {
  if (rarityRank(rarity(unit.progression)) <= rarityRank(cap)) return unit
  const caps = RARITY_CAPS[cap]
  const progression =
    progressionIndex(unit.progression) > progressionIndex(caps.progression)
      ? caps.progression
      : unit.progression
  const rank =
    unit.rank && rankIndex(unit.rank) > rankIndex(caps.rank)
      ? caps.rank
      : unit.rank
  return {
    progression,
    rank,
    xpLevel:
      unit.xpLevel === undefined
        ? undefined
        : Math.min(unit.xpLevel, caps.level),
    abilityLevels: [
      Math.min(unit.abilityLevels[0], caps.level),
      Math.min(unit.abilityLevels[1], caps.level),
    ],
  }
}

/** What of a unit sits under the cap's targets, so a capped preview shows what to raise. */
export interface UnderCap {
  rarity: boolean
  rank: boolean
  level: boolean
  /** Active then passive (characters), primary then secondary (MoWs). */
  abilities: [boolean, boolean]
  any: boolean
}

/**
 * Compares a unit with the cap's targets: its rarity, rank, XP level and ability levels. The
 * default (Mythic) cap is not a target, so nothing is ever under it.
 */
export function underCap(
  unit: TeamRosterUnit,
  cap: Rarity,
  rarity: (progression: Progression) => Rarity
): UnderCap {
  const none: UnderCap = {
    rarity: false,
    rank: false,
    level: false,
    abilities: [false, false],
    any: false,
  }
  if (cap === DEFAULT_RARITY_CAP) return none
  const caps = RARITY_CAPS[cap]
  const result = {
    rarity: rarityRank(rarity(unit.progression)) < rarityRank(cap),
    rank:
      unit.rank !== undefined && rankIndex(unit.rank) < rankIndex(caps.rank),
    // Only characters level up by XP; a MoW has no rank and its data still carries a level.
    level:
      unit.rank !== undefined &&
      unit.xpLevel !== undefined &&
      unit.xpLevel < caps.level,
    abilities: [
      unit.abilityLevels[0] < caps.level,
      unit.abilityLevels[1] < caps.level,
    ] as [boolean, boolean],
  }
  return {
    ...result,
    any:
      result.rarity ||
      result.rank ||
      result.level ||
      result.abilities[0] ||
      result.abilities[1],
  }
}
