import {
  LEGENDARY_EVENT_LANE_IDS,
  buildLanePointsModel,
  impactTeams,
  laneRosterPotential,
  potentialCellStates,
  teamReaches,
  type LaneRosterPotential,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventUnit,
  type PotentialCellState,
} from "@/entities/legendary-event"

import type {
  ClearEstimatesViewModel,
  ProgressGridViewModel,
} from "./legendary-event-page.view-model"

/** One lane's roster potential map (spec: potential mini map): a skeleton while its inputs load,
 *  "needs clear estimates" (cleared cells only) when estimates are unavailable, else the figures. */
export type LanePotentialViewModel =
  | { kind: "loading" }
  | { kind: "unavailable"; cells: PotentialCellState[][] }
  | {
      kind: "ready"
      potential: LaneRosterPotential
      cells: PotentialCellState[][]
    }

export type LanePotentialsViewModel = Record<
  LegendaryEventLaneId,
  LanePotentialViewModel
>

/**
 * Every lane's roster potential over the synced roster, with each cell's state against the
 * plan's saved teams (none while signed out or the plan has not loaded). Never stored.
 */
export function buildLanePotentials({
  event,
  units,
  progressGrid,
  clearEstimates,
  plan,
  run,
}: {
  event: LegendaryEvent
  units: readonly LegendaryEventUnit[] | "loading" | "error"
  progressGrid: ProgressGridViewModel
  clearEstimates: ClearEstimatesViewModel
  plan: LegendaryEventPlan | undefined
  run: LegendaryEventRun
}): LanePotentialsViewModel {
  const loading =
    units === "loading" ||
    progressGrid.kind === "loading" ||
    clearEstimates.kind === "pending"
  return Object.fromEntries(
    LEGENDARY_EVENT_LANE_IDS.map((laneId): [string, LanePotentialViewModel] => {
      if (loading) return [laneId, { kind: "loading" }]
      const lane = event[laneId]
      const model = buildLanePointsModel(lane)
      const progress =
        progressGrid.kind === "ready" ? progressGrid.lanes[laneId] : undefined
      const inputs =
        clearEstimates.kind === "ready"
          ? clearEstimates.byLane[laneId].inputs
          : undefined
      const unitList = Array.isArray(units) ? units : []
      const teams =
        plan && inputs
          ? teamReaches(
              impactTeams(
                plan.teams.filter((team) => team.laneId === laneId),
                lane,
                unitList,
                run
              ),
              inputs
            )
          : []
      if (!inputs || units === "error") {
        const none = { defeatAllDepth: 0, objectiveDepths: [] }
        return [
          laneId,
          {
            kind: "unavailable",
            cells: potentialCellStates(model, progress, none, []),
          },
        ]
      }
      const potential = laneRosterPotential({
        lane,
        units: unitList,
        model,
        progress,
        battlePowers: inputs.battlePowers,
        roster: inputs.roster,
        config: inputs.config,
      })
      return [
        laneId,
        {
          kind: "ready",
          potential,
          cells: potentialCellStates(model, progress, potential, teams),
        },
      ]
    })
  ) as LanePotentialsViewModel
}
