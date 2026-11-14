import type {
  LegendaryEventLane,
  LegendaryEventLaneId,
  LegendaryEventUnit,
} from "../model/types"
import type { LegendaryEventRun, LegendaryEventTeam } from "../model/plan.types"
import {
  teamClearEstimate,
  type ClearEstimateConfig,
  type ClearEstimateRoster,
} from "./clear-estimate"
import { teamDepthForRun } from "./current-run"
import type { LaneReach } from "./reachable-points"
import { derivedTeamCoverage } from "./team-coverage"
import { isCompleteTeam } from "./team-size"
import type { ImpactTeam } from "./upgrade-impact"

/** What a lane's clear estimates read: the battles' powers, the synced roster and the config. */
export interface LaneEstimateInputs {
  battlePowers: readonly number[]
  roster: ClearEstimateRoster
  config: ClearEstimateConfig
}

type CoverageLane = Pick<
  LegendaryEventLane,
  "allowedUnitsFilter" | "unitsRestrictions"
>

/**
 * A lane's teams as reachable points read them (design D4): non-reserve members, the stored
 * objectives the current members still derive, and the current run's stored depth. An incomplete
 * team (fewer than three members) is left out: no calculation plays it.
 */
export function impactTeams(
  teams: readonly LegendaryEventTeam[],
  lane: CoverageLane,
  units: readonly LegendaryEventUnit[],
  run: LegendaryEventRun
): ImpactTeam[] {
  return teams.filter(isCompleteTeam).map((team) => {
    const derived = new Set(
      derivedTeamCoverage(team.memberUnitIds, lane, units)
    )
    return {
      id: team.id,
      memberUnitIds: team.memberUnitIds,
      coveredObjectiveIndexes: team.objectiveIndexes.filter((index) =>
        derived.has(index)
      ),
      manualDepth: teamDepthForRun(team, run)?.expectedBattleClears ?? null,
    }
  })
}

/** Each team's reach: its stored depth, else its estimate, else 0, with its members kept. */
export function teamReaches(
  teams: readonly ImpactTeam[],
  inputs: LaneEstimateInputs
): (LaneReach & { memberUnitIds: readonly string[] })[] {
  return teams.map((team) => ({
    memberUnitIds: team.memberUnitIds,
    coveredObjectiveIndexes: team.coveredObjectiveIndexes,
    depth:
      team.manualDepth ??
      teamClearEstimate(
        team.memberUnitIds,
        inputs.battlePowers,
        inputs.roster,
        inputs.config
      )?.depth ??
      0,
  }))
}

/**
 * The units each lane's teams use, members and reserve alike, for the leaderboards' "Only in my
 * teams" filter. Incomplete teams count too: picking a unit is the plan to use it.
 */
export function teamUnitIdsByLane(
  teams: readonly Pick<
    LegendaryEventTeam,
    "laneId" | "memberUnitIds" | "reserveUnitId"
  >[]
): Record<LegendaryEventLaneId, ReadonlySet<string>> {
  const byLane: Record<LegendaryEventLaneId, Set<string>> = {
    alpha: new Set(),
    beta: new Set(),
    gamma: new Set(),
  }
  for (const team of teams) {
    const units = byLane[team.laneId]
    for (const unitId of team.memberUnitIds) units.add(unitId)
    if (team.reserveUnitId) units.add(team.reserveUnitId)
  }
  return byLane
}
