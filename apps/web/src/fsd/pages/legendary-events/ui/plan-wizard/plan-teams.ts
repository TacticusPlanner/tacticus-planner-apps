import {
  derivedTeamCoverage,
  isCompleteTeam,
  suggestLaneTeams,
  teamClearEstimate,
  teamDepthForRun,
  type LegendaryEventLaneId,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type TeamSuggestion,
} from "@/entities/legendary-event"

import type { PlanInputs, PlanLane } from "./plan-inputs"

/** Teams per lane the plan generates up to (design D5). */
export const MAX_PLAN_TEAMS_PER_LANE = 6

type RunRosters = ReadonlyMap<
  LegendaryEventRun,
  ReadonlyMap<string, LegendaryEventRosterUnit>
>

/** One team of the wizard's draft: a stored team kept (or edited) or a generated one. */
export interface DraftTeam {
  /** Stable within the draft: the stored id, else the lane and the sorted members. */
  key: string
  laneId: LegendaryEventLaneId
  /** The stored team this draft keeps or edits; null for a new team. */
  storedId: string | null
  /** The stored name; empty for a new team (named by its objectives on creation). */
  name: string
  memberUnitIds: string[]
  reserveUnitId: string | null
  objectiveIndexes: number[]
  /** The depth each plan run reaches (stored, else the estimate on that run's roster). */
  depthByRun: Partial<Record<LegendaryEventRun, number>>
  /** The members, reserve or name differ from the stored team. */
  edited: boolean
}

/** The member set of a team, order-free (equal teams share it). */
export const memberKey = (memberUnitIds: readonly string[]) =>
  [...memberUnitIds].sort().join("|")

export const generatedTeamKey = (
  laneId: LegendaryEventLaneId,
  memberUnitIds: readonly string[]
) => `${laneId}:${memberKey(memberUnitIds)}`

/** The stored complete teams of a lane as drafts, coverage narrowed to what members derive. */
export function storedDrafts(
  inputs: Pick<PlanInputs, "units">,
  planLane: Pick<PlanLane, "laneId" | "lane">,
  teams: readonly LegendaryEventTeam[]
): DraftTeam[] {
  return teams
    .filter((team) => team.laneId === planLane.laneId)
    .filter(isCompleteTeam)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((team) => {
      const derived = new Set(
        derivedTeamCoverage(team.memberUnitIds, planLane.lane, inputs.units)
      )
      return {
        key: team.id,
        laneId: team.laneId,
        storedId: team.id,
        name: team.name,
        memberUnitIds: [...team.memberUnitIds],
        reserveUnitId: team.reserveUnitId,
        objectiveIndexes: team.objectiveIndexes.filter((index) =>
          derived.has(index)
        ),
        depthByRun: Object.fromEntries(
          team.runDepths.map((entry) => [entry.run, entry.expectedBattleClears])
        ),
        edited: false,
      }
    })
}

/** A team's depth on one run: the stored depth of an unedited stored team, else its estimate. */
function depthOn(
  team: DraftTeam,
  run: LegendaryEventRun,
  stored: ReadonlyMap<string, LegendaryEventTeam>,
  planLane: PlanLane,
  roster: ReadonlyMap<string, LegendaryEventRosterUnit>,
  inputs: Pick<PlanInputs, "config">
): number {
  const storedTeam =
    team.storedId && !team.edited ? stored.get(team.storedId) : undefined
  const storedDepth = storedTeam ? teamDepthForRun(storedTeam, run) : null
  if (storedDepth) return storedDepth.expectedBattleClears
  if (planLane.battlePowers.length === 0) return 0
  return (
    teamClearEstimate(
      team.memberUnitIds,
      planLane.battlePowers,
      roster,
      inputs.config
    )?.depth ?? 0
  )
}

export interface LaneGenerationInput {
  inputs: Pick<PlanInputs, "units" | "config" | "nameOf" | "plan">
  planLane: PlanLane
  /** The lane's teams to keep, in order (the user's teams unless replaced). */
  start: readonly DraftTeam[]
  rosters: RunRosters
  /** The plan runs, in order. */
  runs: readonly LegendaryEventRun[]
  /** Draft keys the user removed: never proposed again. */
  excluded?: ReadonlySet<string>
  cap?: number
}

function bestSuggestion(
  input: LaneGenerationInput,
  teams: readonly DraftTeam[],
  run: LegendaryEventRun,
  roster: ReadonlyMap<string, LegendaryEventRosterUnit>
): TeamSuggestion | undefined {
  const { planLane, inputs } = input
  const suggestions = suggestLaneTeams({
    lane: planLane.lane,
    units: inputs.units,
    model: planLane.model,
    progress: planLane.progress,
    existingTeams: teams.map((team) => ({
      memberUnitIds: team.memberUnitIds,
      coveredObjectiveIndexes: team.objectiveIndexes,
      depth: team.depthByRun[run] ?? 0,
    })),
    battlePowers: planLane.battlePowers,
    roster,
    config: inputs.config,
    onlyUnlocked: true,
    preferGoals: false,
    goalUnitIds: new Set(),
    nameOf: (unit) => inputs.nameOf(unit.id),
  })
  const present = new Set(teams.map((team) => memberKey(team.memberUnitIds)))
  return suggestions.find(
    (suggestion) =>
      !present.has(memberKey(suggestion.memberUnitIds)) &&
      !input.excluded?.has(
        generatedTeamKey(planLane.laneId, suggestion.memberUnitIds)
      )
  )
}

/**
 * A lane's team set across the plan runs (spec: teams are generated per lane for each run's
 * roster): for each run in order, the kept and earlier generated teams are re-estimated on that
 * run's roster, then the suggestion adding the most reachable points is added until none gains or
 * the lane holds `cap` teams. Every team's depth per run is its estimate on that run's roster (a
 * stored depth for a kept, unedited team).
 */
export function generateLaneTeams(input: LaneGenerationInput): DraftTeam[] {
  const { planLane, rosters, runs } = input
  const cap = input.cap ?? MAX_PLAN_TEAMS_PER_LANE
  const stored = new Map(input.inputs.plan.teams.map((team) => [team.id, team]))
  const teams: DraftTeam[] = input.start.map((team) => ({
    ...team,
    depthByRun: {},
  }))
  const estimateAll = (
    run: LegendaryEventRun,
    roster: ReadonlyMap<string, LegendaryEventRosterUnit>
  ) => {
    for (const team of teams) {
      team.depthByRun[run] = depthOn(
        team,
        run,
        stored,
        planLane,
        roster,
        input.inputs
      )
    }
  }
  for (const run of runs) {
    const roster = rosters.get(run)
    if (!roster) continue
    estimateAll(run, roster)
    if (planLane.battlePowers.length === 0) continue
    while (teams.length < cap) {
      const suggestion = bestSuggestion(input, teams, run, roster)
      if (!suggestion) break
      teams.push({
        key: generatedTeamKey(planLane.laneId, suggestion.memberUnitIds),
        laneId: planLane.laneId,
        storedId: null,
        name: "",
        memberUnitIds: suggestion.memberUnitIds,
        reserveUnitId: null,
        objectiveIndexes: suggestion.coveredObjectiveIndexes,
        depthByRun: { [run]: suggestion.depth },
        edited: false,
      })
    }
  }
  // Teams added on a later run get their earlier runs' depths too.
  for (const run of runs) {
    const roster = rosters.get(run)
    if (roster) estimateAll(run, roster)
  }
  return teams
}
