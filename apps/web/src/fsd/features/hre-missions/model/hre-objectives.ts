import {
  HRE_MISSIONS,
  hreMission,
  type HreObjective,
  type HreObjectiveKind,
} from "./hre-missions"
import { HRE_ALL_DONE, type HreProgress } from "./hre-progress"

const CAMPAIGN_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "campaignWins",
  "campaignRaids",
])

/** What one battle fought by hand counts toward a manual objective, or null when the page cannot
 * estimate it (ability damage, a damage type, the featured hero's damage, healing). */
type HreBattleYield =
  "battle" | "abilityUses" | "enemies" | "factionEnemies" | "enemyHealth"

/** An open objective that only progresses in battles played by hand (raids count no kills, damage
 * or ability uses: Severyn, 2026-10). */
type HreManualNeed = {
  objective: HreObjective
  /** Left to go, in the objective's own unit (kills, uses, wins, damage). */
  toGo: number
  per: HreBattleYield | null
}

/** The current mission's campaign suggestions: raids for its raid objective and battles to fight by
 * hand for its manual objectives (hre-campaign-raids). */
export type HreCampaignPlan = {
  missionNumber: number
  /** The open campaign-win, campaign-raid or lightning objective, served by raids. */
  raids: {
    objective: HreObjective
    battlesToGo: number
    /** Lightning victories count event-campaign raids only. */
    eventOnly: boolean
  } | null
  /** One list for every open manual objective: the mission's pairs all fit one team (design D9). */
  battles: {
    needs: HreManualNeed[]
    /** Only nodes with this many deployment slots: every ability use counts with a full team. */
    slots?: number
    /** Only nodes where the featured hero's alliance can deploy (alliance or featured-hero
     * objectives). */
    alliance: boolean
    /** Only nodes with this faction's enemies (faction kills). */
    faction: string | null
    /** Lightning victories are open: nodes with a lightning condition come first. */
    preferLightning: boolean
    /** Campaign wins are open: each battle won by hand counts as one, so fewer raids are needed. */
    countsAsWins: boolean
  } | null
}

const RAID_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "campaignWins",
  "campaignRaids",
  "lightningVictories",
])

/** What one hand-fought battle yields per manual kind; absent kinds are raid or token objectives. */
const MANUAL_YIELD: Partial<Record<HreObjectiveKind, HreBattleYield | null>> = {
  killEnemies: "enemies",
  killWithMelee: "enemies",
  killWithRanged: "enemies",
  killWithAlliance: "enemies",
  killFaction: "factionEnemies",
  damage: "enemyHealth",
  abilityDamage: null,
  damageType: null,
  featuredDamage: null,
  heal: null,
  useAbilities: "abilityUses",
  useAbilitiesAlliance: "abilityUses",
  useAbilitiesFeatured: "battle",
  winWithoutSummons: "battle",
  winWithAllianceLineup: "battle",
}

/** Manual objectives that only progress where the featured hero's alliance (or the hero) deploys. */
const ALLIANCE_NODE_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "killWithAlliance",
  "useAbilitiesAlliance",
  "winWithAllianceLineup",
  "useAbilitiesFeatured",
  "featuredDamage",
])

const FULL_TEAM_SLOTS = 5

/** Whether an objective only progresses in battles played by hand. */
export const isManualObjective = (kind: HreObjectiveKind) =>
  kind in MANUAL_YIELD

/** The current mission's open objectives with what is left of each. */
function openObjectives(state: HreProgress) {
  return hreMission(state.mission)
    .objectives.map((objective, index) => ({
      objective,
      toGo: objective.target - state.progress[index]!,
    }))
    .filter((item) => item.toGo > 0)
}

/**
 * The campaign suggestions for the current mission. Its campaign-win, campaign-raid or lightning
 * objective gets raids (any node: raids count only battles, never kills or ability uses). Its open
 * manual objectives get one list of battles to fight by hand, kept to the nodes they need: full
 * 5-slot teams for ability uses, the featured hero's alliance for alliance and featured-hero
 * objectives, the faction for faction kills. Summon-free wins (mission 6) leave out the wins the
 * Arena tokens above a later mission's reserve can play (`arenaSurplus`).
 */
export function selectCampaignPlan(
  state: HreProgress,
  arenaSurplus = 0
): HreCampaignPlan | null {
  if (state.mission >= HRE_ALL_DONE) return null
  const open = openObjectives(state)
  const raid = open.find((item) => RAID_KINDS.has(item.objective.kind))
  const needs = open.flatMap((item): HreManualNeed[] => {
    const kind = item.objective.kind
    if (!isManualObjective(kind)) return []
    const toGo =
      kind === "winWithoutSummons"
        ? item.toGo - Math.max(0, arenaSurplus)
        : item.toGo
    return toGo > 0
      ? [{ objective: item.objective, toGo, per: MANUAL_YIELD[kind] ?? null }]
      : []
  })
  if (!raid && needs.length === 0) return null
  const has = (kinds: readonly HreObjectiveKind[]) =>
    needs.some((need) => kinds.includes(need.objective.kind))
  const faction = needs.find((need) => need.objective.kind === "killFaction")
  return {
    missionNumber: state.mission,
    raids: raid
      ? {
          objective: raid.objective,
          battlesToGo: raid.toGo,
          eventOnly: raid.objective.kind === "lightningVictories",
        }
      : null,
    battles:
      needs.length > 0
        ? {
            needs,
            ...(has(["useAbilities", "useAbilitiesAlliance"])
              ? { slots: FULL_TEAM_SLOTS }
              : {}),
            alliance: needs.some((need) =>
              ALLIANCE_NODE_KINDS.has(need.objective.kind)
            ),
            faction: faction?.objective.qualifier ?? null,
            preferLightning: raid?.objective.kind === "lightningVictories",
            countsAsWins: raid?.objective.kind === "campaignWins",
          }
        : null,
  }
}

/** Whether the current mission has a campaign objective at all (met or not). */
export function campaignObjectiveState(
  state: HreProgress
): "open" | "met" | "none" {
  if (state.mission >= HRE_ALL_DONE) return "none"
  const objectives = hreMission(state.mission).objectives
  const index = objectives.findIndex(
    (objective) =>
      CAMPAIGN_KINDS.has(objective.kind) ||
      objective.kind === "lightningVictories"
  )
  if (index < 0) return "none"
  return state.progress[index]! >= objectives[index]!.target ? "met" : "open"
}

/** The next mission after the current one that has a campaign objective, with that objective. */
export function nextCampaignMission(
  state: HreProgress
): { missionNumber: number; objective: HreObjective } | null {
  for (const mission of HRE_MISSIONS) {
    if (mission.number <= state.mission) continue
    const objective = mission.objectives.find((item) =>
      CAMPAIGN_KINDS.has(item.kind)
    )
    if (objective) return { missionNumber: mission.number, objective }
  }
  return null
}

/** Campaign battles still needed over the current mission (less its progress) and every later one. */
export function remainingCampaignBattles(state: HreProgress): number {
  let total = 0
  for (const mission of HRE_MISSIONS) {
    if (mission.number < state.mission) continue
    mission.objectives.forEach((objective, index) => {
      if (!CAMPAIGN_KINDS.has(objective.kind)) return
      const done = mission.number === state.mission ? state.progress[index]! : 0
      total += Math.max(0, objective.target - done)
    })
  }
  return total
}

const HRE_TOKEN_MODES = [
  "arena",
  "guildRaid",
  "onslaught",
  "salvageRun",
] as const
export type HreTokenMode = (typeof HRE_TOKEN_MODES)[number]

const TOKEN_KIND: Record<HreTokenMode, HreObjectiveKind> = {
  arena: "arenaBattles",
  guildRaid: "guildRaids",
  onslaught: "onslaught",
  salvageRun: "salvageRuns",
}

/** Battles of each token mode the current mission (less its progress) and every later one need. */
export function tokenNeeds(state: HreProgress): Record<HreTokenMode, number> {
  const needs = { arena: 0, guildRaid: 0, onslaught: 0, salvageRun: 0 }
  for (const mission of HRE_MISSIONS) {
    if (mission.number < state.mission) continue
    mission.objectives.forEach((objective, index) => {
      const mode = HRE_TOKEN_MODES.find(
        (item) => TOKEN_KIND[item] === objective.kind
      )
      if (!mode) return
      const done = mission.number === state.mission ? state.progress[index]! : 0
      needs[mode] += Math.max(0, objective.target - done)
    })
  }
  return needs
}

/** Whether an objective spends a token mode's tokens. */
export const isTokenObjective = (kind: HreObjectiveKind) =>
  HRE_TOKEN_MODES.some((mode) => TOKEN_KIND[mode] === kind)

/** The first token mission after `missionNumber`, with the tokens it needs, for the reserve tip shown
 * on the missions before it (a token mission's own tip would tell you to keep what it spends). */
export function nextTokenReserve(
  missionNumber: number
): { mode: HreTokenMode; tokens: number; missionNumber: number } | null {
  for (const mission of HRE_MISSIONS) {
    if (mission.number <= missionNumber) continue
    for (const objective of mission.objectives) {
      const mode = HRE_TOKEN_MODES.find(
        (item) => TOKEN_KIND[item] === objective.kind
      )
      if (mode) {
        return { mode, tokens: objective.target, missionNumber: mission.number }
      }
    }
  }
  return null
}

export type HreTokenNeedRow = {
  mode: HreTokenMode
  need: number
  /** Synced tokens now, or null when the mode is not unlocked. */
  have: number | null
  short: boolean
}

/** The tokens-needed rows: modes with a remaining need, compared with the synced tokens. */
export function tokenNeedRows(
  state: HreProgress,
  tokens: Record<HreTokenMode, number | null>
): HreTokenNeedRow[] {
  const needs = tokenNeeds(state)
  return HRE_TOKEN_MODES.filter((mode) => needs[mode] > 0).map((mode) => {
    const have = tokens[mode]
    return {
      mode,
      need: needs[mode],
      have,
      short: have !== null && needs[mode] > have,
    }
  })
}
