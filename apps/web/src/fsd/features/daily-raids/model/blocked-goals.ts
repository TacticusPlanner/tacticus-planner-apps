import type {
  EstimatePlanParams,
  RaidPlanSchedule,
} from "@/features/goal-farming/@x/daily-raids"

import type { DailyRaidBlockedGoal } from "./daily-raids.domain"

/** Goals the plan could not fully source, in plan order, read from the plan's own outcomes. */
export function blockedGoalsOf(
  goals: EstimatePlanParams["goals"],
  outcomes: RaidPlanSchedule["outcomes"]
): DailyRaidBlockedGoal[] {
  return goals.flatMap(({ goalId }) => {
    const outcome = outcomes.get(goalId)
    return outcome?.status === "Blocked" && outcome.blockers
      ? [
          {
            goalId,
            blockers: outcome.blockers,
            partial: (outcome.actionableResourceIds?.length ?? 0) > 0,
          },
        ]
      : []
  })
}
