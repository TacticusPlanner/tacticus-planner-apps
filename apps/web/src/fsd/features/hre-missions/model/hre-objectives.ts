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
  /** Only nodes where the featured hero's alliance can deploy: an all-alliance team, or the
   * mission's other open objective needs alliance units or the featured hero. */
  allianceNodes: boolean
  /** The mission's open faction-kill objective, for a separate list of nodes with those enemies. */
  enemyFaction: { faction: string; killsToGo: number } | null
}

/** Open objectives that only progress on nodes where the featured hero's alliance can deploy. */
const ALLIANCE_NODE_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "killWithAlliance",
  "useAbilitiesFeatured",
  "featuredDamage",
])

/** Ability uses a fought battle with five units yields, for `useAbilitiesAlliance`: one each, as
 * Severyn confirmed (mission 7 at 12 / 20 still needs 2 battles). */
const ABILITY_USES_PER_BATTLE = 5
/** A full all-alliance team, so every slot's abilities count; for any units, a full raid team. */
const FULL_TEAM_SLOTS = 5

/**
 * The objective the raid suggestions fill. A lightning-victory objective comes first, because its
 * event-campaign raids also count as campaign wins; then the campaign objective; then an
 * all-alliance lineup's wins, as battles fought by hand (raids have no lineup, so they cannot count);
 * then the alliance ability uses, as battles fought by hand on 5-slot nodes; then any units' ability
 * uses, as raids on 5-slot nodes, five uses a raid (mission 15, and mission 3 once its wins are done). The mission's other
 * objective restricts the nodes too: alliance kills or the featured hero keep them to where the
 * alliance deploys, and faction kills add a list of nodes with that faction's enemies.
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
  const factionKills = open.find(
    (item) => item.objective.kind === "killFaction"
  )
  const enemyFaction = factionKills?.objective.qualifier
    ? {
        faction: factionKills.objective.qualifier,
        killsToGo: factionKills.battlesToGo,
      }
    : null
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
      allianceNodes: open.some((item) =>
        ALLIANCE_NODE_KINDS.has(item.objective.kind)
      ),
      enemyFaction,
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
      kind: "battles",
      allianceTeam: true,
      allianceNodes: true,
      enemyFaction,
    }
  }
  const abilities = open.find(
    (item) => item.objective.kind === "useAbilitiesAlliance"
  )
  if (!abilities) {
    const anyAbilities = open.find(
      (item) => item.objective.kind === "useAbilities"
    )
    if (!anyAbilities) return null
    return {
      missionNumber: mission.number,
      objective: anyAbilities.objective,
      battlesToGo: Math.ceil(
        anyAbilities.battlesToGo / ABILITY_USES_PER_BATTLE
      ),
      eventOnly: false,
      kind: "raids",
      slots: FULL_TEAM_SLOTS,
      allianceTeam: false,
      allianceNodes: open.some((item) =>
        ALLIANCE_NODE_KINDS.has(item.objective.kind)
      ),
      enemyFaction,
    }
  }
  return {
    missionNumber: mission.number,
    objective: abilities.objective,
    battlesToGo: Math.ceil(abilities.battlesToGo / ABILITY_USES_PER_BATTLE),
    eventOnly: false,
    kind: "battles",
    slots: FULL_TEAM_SLOTS,
    allianceTeam: true,
    allianceNodes: true,
    enemyFaction,
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
