import {
  impactTeams,
  laneRosterPotential,
  potentialCellStates,
  teamReaches,
  type ClearEstimateRoster,
  type LegendaryEventRun,
} from "@/entities/legendary-event"

import type { LanePotentialsViewModel } from "../legendary-event/lane-potential.view-model"
import type { PlanEvaluation } from "./plan-evaluator"
import type { PlanInputs } from "./plan-inputs"

/**
 * Every lane's roster potential map for the Target step (spec: roster potential with the planned
 * goals): the synced roster's potential and the saved teams' reach as on the event page, plus the
 * battles only the draft's goals reach, on the last plan run's projected roster.
 */
export function planPotentials(
  inputs: PlanInputs,
  evaluation: Pick<PlanEvaluation, "rosters">,
  runs: readonly LegendaryEventRun[]
): LanePotentialsViewModel {
  const synced: ClearEstimateRoster = new Map(
    inputs.roster.map((unit) => [unit.unitId as string, unit])
  )
  const lastRun = runs.at(-1)
  const upgradedRoster =
    (lastRun === undefined ? undefined : evaluation.rosters.get(lastRun)) ??
    synced
  return Object.fromEntries(
    inputs.lanes.map(({ laneId, lane, model, progress, battlePowers }) => {
      if (battlePowers.length === 0) {
        const none = { defeatAllDepth: 0, objectiveDepths: [] }
        return [
          laneId,
          {
            kind: "unavailable",
            cells: potentialCellStates(model, progress, none, []),
          },
        ]
      }
      const potentialOn = (roster: ClearEstimateRoster) =>
        laneRosterPotential({
          lane,
          units: inputs.units,
          model,
          progress,
          battlePowers,
          roster,
          config: inputs.config,
        })
      const potential = potentialOn(synced)
      const upgraded = potentialOn(upgradedRoster)
      const teams = teamReaches(
        impactTeams(
          inputs.plan.teams.filter((team) => team.laneId === laneId),
          lane,
          inputs.units,
          runs[0] ?? 1
        ),
        { battlePowers, roster: synced, config: inputs.config }
      )
      return [
        laneId,
        {
          kind: "ready",
          potential,
          upgraded,
          cells: potentialCellStates(
            model,
            progress,
            potential,
            teams,
            upgraded
          ),
        },
      ]
    })
  ) as LanePotentialsViewModel
}
