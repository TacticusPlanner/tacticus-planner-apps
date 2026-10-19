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
  /** 1 to 20, then 21 for the Bonus mission. */
  number: number
  objectives: readonly [HreObjective, HreObjective]
}

export const HRE_BONUS_MISSION = 21

const o = (
  kind: HreObjectiveKind,
  target: number,
  qualifier?: string
): HreObjective => (qualifier ? { kind, target, qualifier } : { kind, target })

/**
 * The 21 HRE missions. Every Hero Release Event uses the same list; only the alliance and the
 * featured hero change (Severyn, 2026-10). Order and targets follow Zapspitta's mission sheet.
 */
export const HRE_MISSIONS: readonly HreMission[] = [
  {
    number: 1,
    objectives: [o("lightningVictories", 2), o("killWithMelee", 5)],
  },
  { number: 2, objectives: [o("campaignRaids", 5), o("killWithAlliance", 10)] },
  { number: 3, objectives: [o("campaignWins", 20), o("useAbilities", 30)] },
  { number: 4, objectives: [o("arenaBattles", 4), o("killWithRanged", 50)] },
  {
    number: 5,
    objectives: [o("abilityDamage", 10_000), o("campaignWins", 100)],
  },
  { number: 6, objectives: [o("heal", 2500), o("winWithoutSummons", 10)] },
  {
    number: 7,
    objectives: [o("salvageRuns", 2), o("useAbilitiesAlliance", 20)],
  },
  { number: 8, objectives: [o("guildRaids", 2), o("damage", 20_000)] },
  {
    number: 9,
    objectives: [o("killWithRanged", 75), o("damageType", 7500, "Psychic")],
  },
  {
    number: 10,
    objectives: [o("arenaBattles", 4), o("winWithAllianceLineup", 15)],
  },
  {
    number: 11,
    objectives: [o("lightningVictories", 25), o("killFaction", 100, "Necrons")],
  },
  { number: 12, objectives: [o("onslaught", 1), o("heal", 5000)] },
  {
    number: 13,
    objectives: [o("useAbilitiesAlliance", 50), o("killEnemies", 75)],
  },
  {
    number: 14,
    objectives: [o("winWithAllianceLineup", 25), o("damage", 30_000)],
  },
  { number: 15, objectives: [o("arenaBattles", 4), o("useAbilities", 150)] },
  {
    number: 16,
    objectives: [o("killWithAlliance", 100), o("campaignRaids", 25)],
  },
  { number: 17, objectives: [o("killEnemies", 75), o("damage", 60_000)] },
  {
    number: 18,
    objectives: [o("abilityDamage", 50_000), o("killWithRanged", 250)],
  },
  { number: 19, objectives: [o("campaignWins", 75), o("killWithMelee", 100)] },
  {
    number: 20,
    objectives: [o("campaignWins", 250), o("useAbilitiesFeatured", 10)],
  },
  {
    number: HRE_BONUS_MISSION,
    objectives: [o("campaignWins", 250), o("featuredDamage", 15_000)],
  },
]

/** The mission with this number (1 to 21), clamped into range. */
export function hreMission(number: number): HreMission {
  const index = Math.min(Math.max(Math.round(number), 1), HRE_MISSIONS.length)
  return HRE_MISSIONS[index - 1]!
}
