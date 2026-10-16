import type { LegendaryEventLane, LegendaryEventUnit } from "../model/types"
import {
  teamClearEstimate,
  unitEffectivePower,
  type ClearEstimateConfig,
  type ClearEstimateRoster,
} from "./clear-estimate"
import type { LanePointsModel } from "./lane-points-model"
import { objectivesSatisfied } from "./objective-match"
import { laneReachablePoints, type LaneReach } from "./reachable-points"
import type { LaneProgressView } from "./synced-lane-progress"
import { derivedTeamCoverage } from "./team-coverage"
import { unitLanePotential } from "./unit-potential"

export const SUGGESTION_TEAM_SIZE = 5

export interface TeamSuggestion {
  /** The objective subset the proposal was built for. */
  objectiveIndexes: number[]
  /** In candidate order. */
  memberUnitIds: string[]
  /** Derived from the members (every objective all of them satisfy). */
  coveredObjectiveIndexes: number[]
  /** Its Stage 5 team estimate. */
  depth: number
  /** Lane reachable points it adds over the existing teams. */
  gainPoints: number
}

export interface TeamSuggestionsInput {
  lane: Pick<
    LegendaryEventLane,
    | "availableUnitIds"
    | "allowedUnitsFilter"
    | "unitsRestrictions"
    | "killPoints"
    | "battleIds"
  >
  units: readonly LegendaryEventUnit[]
  model: LanePointsModel
  progress: LaneProgressView | undefined
  /** The lane's existing teams: non-reserve members and their reach. */
  existingTeams: readonly (LaneReach & { memberUnitIds: readonly string[] })[]
  battlePowers: readonly number[]
  roster: ClearEstimateRoster
  config: ClearEstimateConfig
  onlyUnlocked: boolean
  preferGoals: boolean
  goalUnitIds: ReadonlySet<string>
  nameOf: (unit: LegendaryEventUnit) => string
}

function subsetsOfOneOrTwo(indexes: readonly number[]): number[][] {
  const result: number[][] = indexes.map((index) => [index])
  for (const [position, first] of indexes.entries()) {
    for (const second of indexes.slice(position + 1)) {
      result.push([first, second])
    }
  }
  return result
}

const memberKey = (ids: readonly string[]) => [...ids].sort().join("|")

/**
 * Proposed teams for a lane (spec: team suggestions per lane): for every one- or two-objective
 * subset, the five best units satisfying all of it, ranked by the lane reachable points each adds
 * over the existing teams. Never stored.
 */
export function suggestLaneTeams(
  input: TeamSuggestionsInput
): TeamSuggestion[] {
  const { lane, model, progress, roster, config, battlePowers } = input
  const allowed = new Set(lane.availableUnitIds)
  const candidates = input.units
    .filter((unit) => allowed.has(unit.id))
    .filter((unit) => !input.onlyUnlocked || roster.has(unit.id))
    .map((unit) => ({
      unit,
      satisfied: new Set(objectivesSatisfied(unit, lane)),
      power: unitEffectivePower(unit.id, roster, config),
      perBattle: unitLanePotential(unit, lane).pointsPerBattle,
      hasGoal: input.goalUnitIds.has(unit.id),
      name: input.nameOf(unit),
    }))
    .sort(
      (a, b) =>
        (input.preferGoals ? Number(b.hasGoal) - Number(a.hasGoal) : 0) ||
        b.power - a.power ||
        b.perBattle - a.perBattle ||
        a.name.localeCompare(b.name)
    )

  const existingKeys = new Set(
    input.existingTeams.map((team) => memberKey(team.memberUnitIds))
  )
  const baseline = laneReachablePoints(
    model,
    progress,
    input.existingTeams
  ).total
  const objectiveIndexes = [...lane.unitsRestrictions]
    .map((objective) => objective.index)
    .sort((a, b) => a - b)

  const seen = new Set<string>()
  const suggestions: TeamSuggestion[] = []
  for (const subset of subsetsOfOneOrTwo(objectiveIndexes)) {
    const members = candidates
      .filter((candidate) =>
        subset.every((index) => candidate.satisfied.has(index))
      )
      .slice(0, SUGGESTION_TEAM_SIZE)
      .map((candidate) => candidate.unit.id)
    if (members.length === 0) continue
    const key = memberKey(members)
    if (seen.has(key) || existingKeys.has(key)) continue
    seen.add(key)
    const covered = derivedTeamCoverage(members, lane, input.units)
    const depth =
      teamClearEstimate(members, battlePowers, roster, config)?.depth ?? 0
    const gainPoints =
      laneReachablePoints(model, progress, [
        ...input.existingTeams,
        { depth, coveredObjectiveIndexes: covered },
      ]).total - baseline
    if (gainPoints <= 0) continue
    suggestions.push({
      objectiveIndexes: subset,
      memberUnitIds: members,
      coveredObjectiveIndexes: covered,
      depth,
      gainPoints,
    })
  }
  return suggestions.sort(
    (a, b) =>
      b.gainPoints - a.gainPoints ||
      b.depth - a.depth ||
      b.memberUnitIds.length - a.memberUnitIds.length ||
      Math.min(...a.coveredObjectiveIndexes) -
        Math.min(...b.coveredObjectiveIndexes)
  )
}
