import type {
  LegendaryEventLaneId,
  LegendaryEventRosterUnit,
  LegendaryEventRun,
} from "@/entities/legendary-event"

import { ceilingOf, draftTokenView } from "./plan-ceiling"
import {
  planRuns,
  projectedRosters,
  rosterKey,
  type ChosenUpgrade,
  type PlanEconomy,
  type PlanInputs,
} from "./plan-inputs"
import { generateLaneTeams, storedDrafts, type DraftTeam } from "./plan-teams"

/** The user's Teams-step changes the generation keeps (spec: keep the user's edits where they
 *  still apply). */
export interface TeamAdjustments {
  /** Replace my teams: start every lane empty instead of from the stored teams. */
  replace: boolean
  /** Draft keys removed (stored or generated). */
  removed: ReadonlySet<string>
  /** Draft key → the team as the user edited it. */
  edited: ReadonlyMap<string, DraftTeam>
  /** Suggestions or new teams the user added, in order. */
  added: readonly DraftTeam[]
}

export const NO_TEAM_ADJUSTMENTS: TeamAdjustments = {
  replace: false,
  removed: new Set(),
  edited: new Map(),
  added: [],
}

export interface PlanEvaluation {
  rosters: Map<LegendaryEventRun, ReadonlyMap<string, LegendaryEventRosterUnit>>
  /** In lane order, then team order. */
  teams: DraftTeam[]
  /** Null when the event has no reward ladder or token supply. */
  ceiling: number | null
}

export interface PlanEvaluator {
  evaluate: (chosen: readonly ChosenUpgrade[]) => PlanEvaluation
}

/** The lane's starting teams: kept stored teams (unless replaced) with the user's edits, removals
 *  and additions applied. */
function laneStart(
  inputs: PlanInputs,
  laneId: LegendaryEventLaneId,
  adjustments: TeamAdjustments
): DraftTeam[] {
  const planLane = inputs.lanes.find((lane) => lane.laneId === laneId)!
  const stored = adjustments.replace
    ? []
    : storedDrafts(inputs, planLane, inputs.plan.teams)
  return [
    ...stored,
    ...adjustments.added.filter((team) => team.laneId === laneId),
  ]
    .filter((team) => !adjustments.removed.has(team.key))
    .map((team) => adjustments.edited.get(team.key) ?? team)
}

/**
 * Evaluates chosen upgrades on the draft (design D3–D5): each run's projected roster, every lane's
 * generated teams and the ceiling at the end of the horizon run (the last run without one). A lane's generation is cached by the roster changes of the units
 * it allows, so evaluating one unit's upgrade regenerates only the lanes that unit plays in.
 */
export function createPlanEvaluator(
  inputs: PlanInputs,
  economy: PlanEconomy,
  adjustments: TeamAdjustments = NO_TEAM_ADJUSTMENTS,
  horizon?: LegendaryEventRun
): PlanEvaluator {
  const runs = planRuns(inputs.resolution)
  const base = new Map(
    inputs.roster.map((unit) => [unit.unitId as string, unit])
  )
  const allowed = new Map(
    inputs.lanes.map((lane) => [
      lane.laneId,
      new Set<string>(lane.lane.availableUnitIds),
    ])
  )
  const starts = new Map(
    inputs.lanes.map((lane) => [
      lane.laneId,
      laneStart(inputs, lane.laneId, adjustments),
    ])
  )
  const cache = new Map<string, DraftTeam[]>()

  const evaluate = (chosen: readonly ChosenUpgrade[]): PlanEvaluation => {
    const rosters = projectedRosters(inputs, chosen)
    const teams = inputs.lanes.flatMap((planLane) => {
      const key = `${planLane.laneId}#${runs
        .map((run) =>
          rosterKey(rosters.get(run)!, base, allowed.get(planLane.laneId))
        )
        .join("#")}`
      let laneTeams = cache.get(key)
      if (!laneTeams) {
        laneTeams = generateLaneTeams({
          inputs,
          planLane,
          start: starts.get(planLane.laneId) ?? [],
          rosters,
          runs,
          excluded: adjustments.removed,
        })
        cache.set(key, laneTeams)
      }
      return laneTeams
    })
    return {
      rosters,
      teams,
      ceiling: ceilingOf(draftTokenView(inputs, teams, economy), horizon),
    }
  }
  return { evaluate }
}

/** A kept team a generated set beats (spec: swap suggestions): removing it lets the lane add
 *  `replacements`, and the plan ceiling rises by `gain`. */
export interface TeamSwap {
  laneId: LegendaryEventLaneId
  /** The kept team's draft key. */
  teamKey: string
  replacements: DraftTeam[]
  gain: number
}

/** Whether a replacement takes the kept team's place: one of them covers every objective the kept
 *  team covers, so the offer reads as the same slot done better rather than another team. */
export function coversObjectives(
  team: Pick<DraftTeam, "objectiveIndexes">,
  replacements: readonly Pick<DraftTeam, "objectiveIndexes">[]
): boolean {
  return replacements.some((replacement) =>
    team.objectiveIndexes.every((index) =>
      replacement.objectiveIndexes.includes(index)
    )
  )
}

/**
 * The swaps worth suggesting on an evaluation: for each kept, unedited team of the user's, the
 * lane is regenerated without it on the same rosters, and the swap is offered when a new team
 * covers the kept team's objectives (`coversObjectives`) and the new teams raise the ceiling.
 * Accepting one is removing the team.
 */
export function teamSwaps(
  inputs: PlanInputs,
  economy: PlanEconomy,
  adjustments: TeamAdjustments,
  evaluation: PlanEvaluation,
  horizon?: LegendaryEventRun
): TeamSwap[] {
  const { ceiling } = evaluation
  if (ceiling === null) return []
  const runs = planRuns(inputs.resolution)
  const present = new Set(evaluation.teams.map((team) => team.key))
  return evaluation.teams.flatMap((team) => {
    if (team.storedId === null || team.edited) return []
    const planLane = inputs.lanes.find((lane) => lane.laneId === team.laneId)!
    const removed = new Set([...adjustments.removed, team.key])
    const laneTeams = generateLaneTeams({
      inputs,
      planLane,
      start: laneStart(inputs, team.laneId, { ...adjustments, removed }),
      rosters: evaluation.rosters,
      runs,
      excluded: removed,
    })
    const replacements = laneTeams.filter((entry) => !present.has(entry.key))
    if (!coversObjectives(team, replacements)) return []
    const teams = [
      ...evaluation.teams.filter((entry) => entry.laneId !== team.laneId),
      ...laneTeams,
    ]
    const gain =
      (ceilingOf(draftTokenView(inputs, teams, economy), horizon) ?? 0) -
      ceiling
    return gain > 0
      ? [{ laneId: team.laneId, teamKey: team.key, replacements, gain }]
      : []
  })
}
