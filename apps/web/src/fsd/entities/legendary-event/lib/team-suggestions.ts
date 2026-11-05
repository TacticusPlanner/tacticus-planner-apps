import type { LegendaryEventLane, LegendaryEventUnit } from "../model/types"
import {
  teamClearEstimate,
  unitEffectivePower,
  type ClearEstimateConfig,
  type ClearEstimateRoster,
} from "./clear-estimate"
import type { LanePointsModel } from "./lane-points-model"
import { laneTokensNeeded } from "./lane-tokens-needed"
import { objectivesSatisfied } from "./objective-match"
import { laneReachablePoints, type LaneReach } from "./reachable-points"
import {
  objectiveClearedThrough,
  type LaneProgressView,
} from "./synced-lane-progress"
import { derivedTeamCoverage } from "./team-coverage"
import { MIN_TEAM_MEMBERS } from "./team-size"
import { withSupport } from "./team-support"
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
  /** Tokens it saves over the existing teams (`laneTokensNeeded` without it minus with it). */
  tokensSaved: number
}

/** A proposal covering at least this many open objectives is listed even without a gain. */
const WIDE_COVERAGE_OBJECTIVES = 3

/** The largest objective subset a proposal is built for. */
const MAX_SUBSET_SIZE = 3

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

/** Every subset of one to `maxSize` indexes, smaller subsets first, each ascending. */
function subsetsUpTo(indexes: readonly number[], maxSize: number): number[][] {
  let level: number[][] = [[]]
  const result: number[][] = []
  for (let size = 1; size <= maxSize; size++) {
    level = level.flatMap((subset) => {
      const last = subset.at(-1)
      const start = last === undefined ? 0 : indexes.indexOf(last) + 1
      return indexes.slice(start).map((index) => [...subset, index])
    })
    result.push(...level)
  }
  return result
}

const memberKey = (ids: readonly string[]) => [...ids].sort().join("|")

/**
 * Proposed teams for a lane (spec: team suggestions per lane): for every one- to three-objective
 * subset, the five best units satisfying all of it (none when fewer than three do: a team needs
 * three characters), with a held, useful Healer or Mechanic swapped in where the team lacks one,
 * ranked by the lane reachable points each adds over the existing teams, then the tokens it saves.
 * A proposal with neither is kept only when it covers three or more objectives still open within
 * its depth, ranked last. Never stored.
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
      id: unit.id,
      traits: unit.traits,
      satisfied: new Set(objectivesSatisfied(unit, lane)),
      // A unit without power data sorts as 0 (its teams have no estimate).
      power: unitEffectivePower(unit.id, roster, config) ?? 0,
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
  const baselineTokens = laneTokensNeeded(model, progress, input.existingTeams)
  const objectiveIndexes = [...lane.unitsRestrictions]
    .map((objective) => objective.index)
    .sort((a, b) => a - b)

  const seen = new Set<string>()
  const suggestions: TeamSuggestion[] = []
  for (const subset of subsetsUpTo(objectiveIndexes, MAX_SUBSET_SIZE)) {
    const subsetCandidates = candidates.filter((candidate) =>
      subset.every((index) => candidate.satisfied.has(index))
    )
    // A useful Healer or Mechanic the player holds replaces the weakest plain member (spec:
    // Support); a locked one would add no power and could not be fielded.
    const members = withSupport(
      subsetCandidates.slice(0, SUGGESTION_TEAM_SIZE),
      subsetCandidates,
      SUGGESTION_TEAM_SIZE,
      (candidate) => roster.has(candidate.id)
    ).map((candidate) => candidate.id)
    if (members.length < MIN_TEAM_MEMBERS) continue
    const key = memberKey(members)
    if (seen.has(key) || existingKeys.has(key)) continue
    const covered = derivedTeamCoverage(members, lane, input.units)
    const depth =
      teamClearEstimate(members, battlePowers, roster, config)?.depth ?? 0
    // A subset objective already cleared through the depth narrowed the candidates for nothing
    // (spec: suggestions do not rely on objectives already cleared). The drop does not claim the
    // member set, so a later subset picking the same members still proposes it.
    if (
      subset.some((index) =>
        objectiveClearedThrough(model, progress, index, depth)
      )
    ) {
      continue
    }
    seen.add(key)
    const withProposal = [
      ...input.existingTeams,
      { depth, coveredObjectiveIndexes: covered },
    ]
    const gainPoints =
      laneReachablePoints(model, progress, withProposal).total - baseline
    const tokensSaved =
      baselineTokens - laneTokensNeeded(model, progress, withProposal)
    if (gainPoints <= 0 && tokensSaved <= 0) {
      // Spec: wide coverage. Open in at least one battle it reaches, so it can still score there.
      const open = covered.filter(
        (index) => !objectiveClearedThrough(model, progress, index, depth)
      )
      if (depth < 1 || open.length < WIDE_COVERAGE_OBJECTIVES) continue
    }
    suggestions.push({
      objectiveIndexes: subset,
      memberUnitIds: members,
      coveredObjectiveIndexes: covered,
      depth,
      gainPoints,
      tokensSaved: Math.max(0, tokensSaved),
    })
  }
  return suggestions.sort(
    (a, b) =>
      b.gainPoints - a.gainPoints ||
      b.tokensSaved - a.tokensSaved ||
      b.depth - a.depth ||
      b.memberUnitIds.length - a.memberUnitIds.length ||
      Math.min(...a.coveredObjectiveIndexes) -
        Math.min(...b.coveredObjectiveIndexes)
  )
}
