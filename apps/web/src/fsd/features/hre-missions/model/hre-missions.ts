/**
 * The objective kinds an HRE mission can ask for. Kinds ending in `Alliance` or `Lineup` read the
 * featured hero's alliance and `*Featured` kinds the hero's name, both at render time (design D1).
 */
export const HRE_OBJECTIVE_KINDS = [
  "campaignWins",
  "campaignRaids",
  "arenaBattles",
  "guildRaids",
  "onslaught",
  "salvageRuns",
  "lightningVictories",
  "killEnemies",
  "killWithMelee",
  "killWithRanged",
  "killWithAlliance",
  "killFaction",
  "damage",
  "abilityDamage",
  "damageType",
  "featuredDamage",
  "useAbilities",
  "useAbilitiesAlliance",
  "useAbilitiesFeatured",
  "heal",
  "winWithoutSummons",
  "winWithAllianceLineup",
] as const

export type HreObjectiveKind = (typeof HRE_OBJECTIVE_KINDS)[number]

export type HreObjective = {
  kind: HreObjectiveKind
  target: number
  /** `killFaction`: the faction id; `damageType`: the damage type id. */
  qualifier?: string
}

export type HreMission = {
  /** The mission's place in the chain, from 1; the last one is the Bonus mission. */
  number: number
  /** The Bonus mission, after the paid ones. */
  bonus: boolean
  /** The event currency the mission gives. */
  currency: number
  objectives: readonly [HreObjective, HreObjective]
}

/**
 * Missions whose two objectives swapped places when the list moved to the game's order (the wiki's,
 * 2026-10): progress stored in the old order is swapped on read (`parseHreProgress`).
 */
export const HRE_REORDERED_MISSIONS: ReadonlySet<number> = new Set([
  7, 9, 10, 12, 13, 15, 17, 19, 20, 21,
])

/** The number past the last mission: the tracker's state once every mission is done. */
export const hreAllDone = (missions: readonly HreMission[]) =>
  missions.length + 1

/** The mission with this number (1 to the last), clamped into range. */
export function hreMission(
  missions: readonly HreMission[],
  number: number
): HreMission {
  const index = Math.min(Math.max(Math.round(number), 1), missions.length)
  return missions[index - 1]!
}
