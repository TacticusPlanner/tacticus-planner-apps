import type { Rarity } from "@workspace/game-domain"

import type { LegendaryEventRosterUnit } from "../model/types"
import {
  teamClearEstimate,
  type ClearEstimateConfig,
  type ClearEstimateRoster,
} from "./clear-estimate"
import type { LanePointsModel } from "./lane-points-model"
import { laneReachablePoints } from "./reachable-points"
import type { LaneProgressView } from "./synced-lane-progress"
import { nextUpgradeSteps, type UpgradeStep } from "./upgrade-steps"

/** One team of a lane as the impact reads it. */
export interface ImpactTeam {
  id: string
  /** Non-reserve members, in position order. */
  memberUnitIds: readonly string[]
  /** Stored covered objectives the current members still derive. */
  coveredObjectiveIndexes: readonly number[]
  /** The current run's stored depth, or null. */
  manualDepth: number | null
}

export interface UpgradeImpactInput {
  model: LanePointsModel
  progress: LaneProgressView | undefined
  teams: readonly ImpactTeam[]
  battlePowers: readonly number[]
  roster: ClearEstimateRoster
  config: ClearEstimateConfig
  initialRarityOf: (unitId: string) => Rarity | undefined
  nameOf: (unitId: string) => string
}

export interface UpgradeImpactRow {
  unitId: string
  step: UpgradeStep
  /** Event points the lane's reachable points rise by. */
  gainPoints: number
  /** Every team of the lane holding the unit whose depth changes. */
  teams: { teamId: string; depthBefore: number; depthAfter: number }[]
}

/** The one result the section, its summary and analytics read (design D1). */
export interface UpgradeImpact {
  baselinePoints: number
  rows: UpgradeImpactRow[]
}

function estimatedDepth(
  members: readonly string[],
  powers: readonly number[],
  roster: ClearEstimateRoster,
  config: ClearEstimateConfig
): number {
  return teamClearEstimate(members, powers, roster, config)?.depth ?? 0
}

/**
 * What one next step of each team member adds to the lane (spec: upgrade impact per lane): each
 * team holding the unit is re-estimated with the stepped unit, its depth moves by the estimate
 * delta (a stored depth too), and the gain is the change in lane reachable points.
 */
export function laneUpgradeImpact(input: UpgradeImpactInput): UpgradeImpact {
  const { model, progress, teams, battlePowers, roster, config } = input
  const battleCount = battlePowers.length
  const before = teams.map((team) => {
    const estimate = estimatedDepth(
      team.memberUnitIds,
      battlePowers,
      roster,
      config
    )
    return { team, estimate, depth: team.manualDepth ?? estimate }
  })
  const reachesOf = (depths: readonly number[]) =>
    teams.map((team, index) => ({
      depth: depths[index]!,
      coveredObjectiveIndexes: team.coveredObjectiveIndexes,
    }))
  const baselinePoints = laneReachablePoints(
    model,
    progress,
    reachesOf(before.map((entry) => entry.depth))
  ).total

  const candidates = [...new Set(teams.flatMap((team) => team.memberUnitIds))]
  const rows: UpgradeImpactRow[] = []
  for (const unitId of candidates) {
    const steps = nextUpgradeSteps(
      roster.get(unitId),
      unitId,
      input.initialRarityOf(unitId)
    )
    for (const step of steps) {
      const stepped = new Map<string, LegendaryEventRosterUnit>(roster)
      stepped.set(unitId, step.unit)
      const after = before.map(({ team, estimate, depth }) => {
        if (!team.memberUnitIds.includes(unitId)) return depth
        const next = estimatedDepth(
          team.memberUnitIds,
          battlePowers,
          stepped,
          config
        )
        return Math.min(battleCount, depth + (next - estimate))
      })
      const gainPoints =
        laneReachablePoints(model, progress, reachesOf(after)).total -
        baselinePoints
      if (gainPoints <= 0) continue
      rows.push({
        unitId,
        step,
        gainPoints,
        teams: before.flatMap(({ team, depth }, index) =>
          after[index] === depth
            ? []
            : [
                {
                  teamId: team.id,
                  depthBefore: depth,
                  depthAfter: after[index]!,
                },
              ]
        ),
      })
    }
  }
  const battlesGained = (row: UpgradeImpactRow) =>
    Math.max(0, ...row.teams.map((team) => team.depthAfter - team.depthBefore))
  rows.sort(
    (a, b) =>
      b.gainPoints - a.gainPoints ||
      battlesGained(b) - battlesGained(a) ||
      input.nameOf(a.unitId).localeCompare(input.nameOf(b.unitId))
  )
  return { baselinePoints, rows }
}
