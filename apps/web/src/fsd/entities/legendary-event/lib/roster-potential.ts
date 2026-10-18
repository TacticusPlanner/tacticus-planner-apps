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
import { MIN_TEAM_MEMBERS } from "./team-size"
import { SUGGESTION_TEAM_SIZE } from "./team-suggestions"

export interface LaneRosterPotential {
  /** Estimated depth of the five strongest owned units the lane allows; 0 below three units. */
  defeatAllDepth: number
  /** One depth per objective, in the points model's objective order. */
  objectiveDepths: number[]
  /** Lane reachable points of one synthetic team per row at its potential depth. */
  pointsLeft: number
  /** The lane's maximum minus the synced earned points. */
  lanePointsLeft: number
  /** 1-based battle the roster can no longer win; null when it reaches the last battle. */
  fallsBehindBattle: number | null
  /** Catalog `index` of each objective whose potential depth is 0. */
  uncoveredObjectiveIndexes: number[]
}

export interface RosterPotentialInput {
  lane: Pick<
    LegendaryEventLane,
    "availableUnitIds" | "allowedUnitsFilter" | "unitsRestrictions"
  >
  units: readonly LegendaryEventUnit[]
  model: LanePointsModel
  progress: LaneProgressView | undefined
  battlePowers: readonly number[]
  roster: ClearEstimateRoster
  config: ClearEstimateConfig
}

/**
 * How far the synced roster can get on a lane (spec: roster potential per lane): defeat-all and
 * each objective are estimated on their own, each from the five owned allowed units with the
 * highest effective power that fit it (design D1), and scored with lane reachable points (D2).
 * An upper bound, never one team that clears everything.
 */
export function laneRosterPotential(
  input: RosterPotentialInput
): LaneRosterPotential {
  const { lane, model, progress, battlePowers, roster, config } = input
  const allowed = new Set(lane.availableUnitIds)
  const owned = input.units
    .filter((unit) => allowed.has(unit.id) && roster.has(unit.id))
    .flatMap((unit) => {
      // A unit without power data is left out: one in a team makes the whole team's estimate
      // unavailable.
      const power = unitEffectivePower(unit.id, roster, config)
      return power === null
        ? []
        : [
            {
              id: unit.id,
              satisfied: new Set(objectivesSatisfied(unit, lane)),
              power,
            },
          ]
    })
    .sort((a, b) => b.power - a.power || a.id.localeCompare(b.id))

  const depthOf = (candidates: typeof owned) => {
    if (candidates.length < MIN_TEAM_MEMBERS) return 0
    const members = candidates
      .slice(0, SUGGESTION_TEAM_SIZE)
      .map((candidate) => candidate.id)
    return teamClearEstimate(members, battlePowers, roster, config)?.depth ?? 0
  }

  const defeatAllDepth = depthOf(owned)
  const objectiveDepths = model.objectives.map((objective) =>
    depthOf(owned.filter((unit) => unit.satisfied.has(objective.index)))
  )
  const reaches: LaneReach[] = [
    { depth: defeatAllDepth, coveredObjectiveIndexes: [] },
    ...model.objectives.map((objective, column) => ({
      depth: objectiveDepths[column]!,
      coveredObjectiveIndexes: [objective.index],
    })),
  ]
  return {
    defeatAllDepth,
    objectiveDepths,
    pointsLeft: laneReachablePoints(model, progress, reaches).total,
    lanePointsLeft: model.maxPoints - (progress?.pointsEarned ?? 0),
    fallsBehindBattle:
      defeatAllDepth < model.battles.length ? defeatAllDepth + 1 : null,
    uncoveredObjectiveIndexes: model.objectives
      .filter((_, column) => objectiveDepths[column] === 0)
      .map((objective) => objective.index),
  }
}

export type PotentialCellState = "cleared" | "teams" | "roster" | "out"

/**
 * Each map cell's state (spec: potential mini map; design D3): per battle, defeat-all first then
 * one cell per objective in model order. Cleared beats a saved team's reach, which beats the
 * roster's potential.
 */
export function potentialCellStates(
  model: LanePointsModel,
  progress: LaneProgressView | undefined,
  potential: Pick<LaneRosterPotential, "defeatAllDepth" | "objectiveDepths">,
  teams: readonly LaneReach[]
): PotentialCellState[][] {
  return model.battles.map((battle) => {
    const cleared = progress?.battles[battle.index]?.cleared ?? []
    const reaching = teams.filter((team) => team.depth > battle.index)
    const rows = [
      {
        potentialDepth: potential.defeatAllDepth,
        teamReaches: reaching.length > 0,
      },
      ...model.objectives.map((objective, column) => ({
        potentialDepth: potential.objectiveDepths[column] ?? 0,
        teamReaches: reaching.some((team) =>
          team.coveredObjectiveIndexes.includes(objective.index)
        ),
      })),
    ]
    return rows.map((row, position): PotentialCellState => {
      if (cleared[position]) return "cleared"
      if (row.teamReaches) return "teams"
      if (row.potentialDepth > battle.index) return "roster"
      return "out"
    })
  })
}
