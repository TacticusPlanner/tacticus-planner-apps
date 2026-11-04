import { useCallback, useMemo } from "react"

import {
  buildLanePointsModel,
  useTeamDisplayName,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { buildUpgradeImpactState } from "@/features/legendary-event-goals"
import { laneTeams } from "@/features/legendary-event-plan"
import { useUnitName } from "@/shared/unit-name"

import {
  laneEstimateInputs,
  type ClearEstimatesViewModel,
  type ProgressGridViewModel,
} from "./legendary-event-page.view-model"

type UpgradeImpactInputs = Parameters<typeof buildUpgradeImpactState>[0]

/**
 * The given lanes' Upgrade impact (Stage 6) over the synced roster; null with no lane (another
 * tab) or while the plan cannot be read (signed out). Teams read as loading until the plan, the
 * units and the synced progress have all resolved.
 */
export function useUpgradeImpact({
  eventData,
  laneIds,
  planEnabled,
  planData,
  units,
  progressPending,
  clearEstimates,
  run,
  progressGrid,
  initialRarityOf,
}: {
  eventData: LegendaryEvent | undefined
  laneIds: readonly LegendaryEventLaneId[]
  planEnabled: boolean
  planData: LegendaryEventPlan | undefined
  units: readonly LegendaryEventUnit[] | undefined
  progressPending: boolean
  clearEstimates: ClearEstimatesViewModel
  run: UpgradeImpactInputs["run"]
  progressGrid: ProgressGridViewModel
  initialRarityOf: UpgradeImpactInputs["initialRarityOf"]
}) {
  const unitName = useUnitName()
  return useMemo(() => {
    if (!eventData || laneIds.length === 0 || !planEnabled) return null
    const teamsReady = planData !== undefined && units && !progressPending
    return Object.fromEntries(
      laneIds.map((laneId) => {
        const lane = eventData[laneId]
        return [
          laneId,
          buildUpgradeImpactState({
            teams: teamsReady ? laneTeams(planData, laneId) : "loading",
            estimates: laneEstimateInputs(clearEstimates, laneId),
            lane,
            units: units ?? [],
            run,
            model: buildLanePointsModel(lane),
            progress:
              progressGrid.kind === "ready"
                ? progressGrid.lanes[laneId]
                : undefined,
            initialRarityOf,
            nameOf: (unitId) => unitName("Character", unitId),
          }),
        ]
      })
    )
  }, [
    eventData,
    laneIds,
    planEnabled,
    planData,
    units,
    progressPending,
    clearEstimates,
    run,
    progressGrid,
    initialRarityOf,
    unitName,
  ])
}

/** An Upgrade impact row's team name by id: its display name (spec: a team shows a readable name),
 *  or the id while the plan does not hold it. */
export function useImpactTeamName(
  eventData: Pick<LegendaryEvent, LegendaryEventLaneId> | undefined,
  planData: LegendaryEventPlan | undefined
): (teamId: string) => string {
  const displayName = useTeamDisplayName()
  return useCallback(
    (teamId) => {
      const teams = planData?.teams ?? []
      const team = teams.find((entry) => entry.id === teamId)
      if (!team) return teamId
      return eventData
        ? displayName(team, eventData[team.laneId], teams)
        : team.name
    },
    [displayName, eventData, planData]
  )
}
