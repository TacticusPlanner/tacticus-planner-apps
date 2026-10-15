import { useCallback, useMemo } from "react"

import {
  LEGENDARY_EVENT_LANE_IDS,
  previewRoster,
  type LegendaryEvent,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import {
  useGoalLabels,
  useLegendaryEventGoalTargets,
} from "@/features/legendary-event-goals"

import type { GoalsPreviewAvailability } from "./legendary-event-page.view-model"

/**
 * The page's goal reads (Stage 6): the Active goal targets for the event's units, the preview roster
 * built from them over the synced roster, and the badge lines. The preview feeds only the
 * leaderboards and the picker; points, team cards, upgrade impact and suggestions stay synced.
 */
export function useEventGoals({
  eventData,
  units,
  roster,
}: {
  eventData: LegendaryEvent | undefined
  units: readonly LegendaryEventUnit[] | undefined
  roster: readonly LegendaryEventRosterUnit[] | undefined
}) {
  const goalLabels = useGoalLabels()
  const allowedUnitIds = useMemo(
    () =>
      new Set(
        eventData
          ? LEGENDARY_EVENT_LANE_IDS.flatMap(
              (laneId) => eventData[laneId].availableUnitIds
            )
          : []
      ),
    [eventData]
  )
  const goalTargets = useLegendaryEventGoalTargets(allowedUnitIds)
  const byUnit = goalTargets.status === "ready" ? goalTargets.byUnit : undefined
  const availability: GoalsPreviewAvailability =
    goalTargets.status === "ready"
      ? goalTargets.targets.length > 0
        ? "ready"
        : "noGoals"
      : goalTargets.status
  const initialRarityOf = useMemo(() => {
    const byId = new Map(
      units ? units.map((unit) => [unit.id as string, unit.initialRarity]) : []
    )
    return (unitId: string) => byId.get(unitId)
  }, [units])
  const preview = useMemo(
    () =>
      goalTargets.status === "ready"
        ? previewRoster(roster, goalTargets.targets, initialRarityOf)
        : undefined,
    [goalTargets, roster, initialRarityOf]
  )
  const goalUnitIds = useMemo(
    () => new Set(byUnit ? byUnit.keys() : []),
    [byUnit]
  )
  const goalLines = useCallback(
    (unitId: string) =>
      byUnit ? goalLabels.badgeLines(byUnit.get(unitId)) : [],
    [byUnit, goalLabels]
  )
  return {
    byUnit,
    availability,
    initialRarityOf,
    preview,
    goalUnitIds,
    goalLines,
  }
}
