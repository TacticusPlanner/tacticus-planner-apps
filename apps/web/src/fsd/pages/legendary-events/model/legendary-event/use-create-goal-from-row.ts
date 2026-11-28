import { useCreateGoalLauncher } from "@/entities/goal"
import type {
  LegendaryEventLaneId,
  LegendaryEventRosterUnit,
} from "@/entities/legendary-event"
import {
  leaderboardRowPrefill,
  prefillGoalType,
} from "@/features/legendary-event-goals"
import { useAnalyticsActions } from "@/shared/analytics"

/** A leaderboard row's Create goal (Stage 6): opens the goal-creation sheet prefilled for the unit
 *  (ownership read from the synced roster; unknown while it is unavailable) and reports it. */
export function useCreateGoalFromRow(
  eventId: string,
  syncedRoster: readonly LegendaryEventRosterUnit[] | undefined
) {
  const launchCreateGoal = useCreateGoalLauncher()
  const { captureEvent } = useAnalyticsActions()
  return (unitId: string, laneId: LegendaryEventLaneId | null) => {
    const ownership = syncedRoster
      ? syncedRoster.some((unit) => unit.unitId === unitId)
        ? "owned"
        : "locked"
      : "unknown"
    const prefill = leaderboardRowPrefill(unitId, ownership)
    captureEvent({
      type: "legendary_event_create_goal_opened",
      eventId,
      laneId,
      source: "leaderboard",
      goalType: prefillGoalType(prefill),
    })
    launchCreateGoal(prefill)
  }
}
