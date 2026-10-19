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

/** The current mission's open objective the raid list serves, if any. */
export type HreRaidObjective = {
  missionNumber: number
  objective: HreObjective
  battlesToGo: number
  /** Lightning victories count event-campaign raids only. */
  eventOnly: boolean
  /** "battles" lists nodes to battle by hand (abilities only count in a fought battle). */
  kind: "raids" | "battles"
  /** Only nodes with this many deployment slots, when set. */
  slots?: number
  /** The objective needs an all-alliance team (the featured hero's alliance). */
  allianceTeam: boolean
}

/** Ability uses a fought battle with five units yields, for `useAbilitiesAlliance` (assumption: two
 * each). Mission 7's 20 uses are then two battles, as Severyn suggested. */
const ABILITY_USES_PER_BATTLE = 10
/** A full all-alliance team, so every slot's abilities count. */
const FULL_TEAM_SLOTS = 5

/**
 * The objective the raid suggestions fill. A lightning-victory objective comes first, because its
 * event-campaign raids also count as campaign wins; then the campaign objective; then an
 * all-alliance lineup's wins (raids); then the alliance ability uses, as battles fought by hand on
 * 5-slot nodes.
 */
export function selectRaidObjective(
  state: HreProgress
): HreRaidObjective | null {
  if (state.mission >= HRE_ALL_DONE) return null
  const mission = hreMission(state.mission)
  const open = mission.objectives
    .map((objective, index) => ({
      objective,
      battlesToGo: objective.target - state.progress[index]!,
    }))
    .filter((item) => item.battlesToGo > 0)
  const lightning = open.find(
    (item) => item.objective.kind === "lightningVictories"
  )
  const campaign = open.find((item) => CAMPAIGN_KINDS.has(item.objective.kind))
  const raidPick = lightning ?? campaign
  if (raidPick) {
    return {
      missionNumber: mission.number,
      objective: raidPick.objective,
      battlesToGo: raidPick.battlesToGo,
      eventOnly: raidPick === lightning,
      kind: "raids",
      allianceTeam: false,
    }
  }
  const lineup = open.find(
    (item) => item.objective.kind === "winWithAllianceLineup"
  )
  if (lineup) {
    return {
      missionNumber: mission.number,
      objective: lineup.objective,
      battlesToGo: lineup.battlesToGo,
      eventOnly: false,
      kind: "raids",
      allianceTeam: true,
    }
  }
  const abilities = open.find(
    (item) => item.objective.kind === "useAbilitiesAlliance"
  )
  if (!abilities) return null
  return {
    missionNumber: mission.number,
    objective: abilities.objective,
    battlesToGo: Math.ceil(abilities.battlesToGo / ABILITY_USES_PER_BATTLE),
    eventOnly: false,
    kind: "battles",
    slots: FULL_TEAM_SLOTS,
    allianceTeam: true,
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
