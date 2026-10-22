import { useMemo } from "react"

import { useGlobalGoalPlan } from "@/entities/goal"
import type { LegendaryEventGoalTarget } from "@/entities/legendary-event"

import { eventGoalSummaries, goalTargetsFromDetails } from "./goal-targets"

/** The event's goal targets by data state (design D8). `ready` with no targets means the account
 *  has no Active goal for the event's units. */
export type LegendaryEventGoalTargets =
  | { status: "loading" }
  | { status: "failed" }
  | {
      status: "ready"
      targets: LegendaryEventGoalTarget[]
      byUnit: ReadonlyMap<string, LegendaryEventGoalTarget>
    }

/**
 * Active Character goals of kinds Unlock, Ascension, Rank and Ability for the event's allowed units,
 * read from the global plan, which carries every goal in full (spec: goal targets map onto a
 * previewed unit). A created goal refreshes through the goals-list refresh.
 */
export function useLegendaryEventGoalTargets(
  allowedUnitIds: ReadonlySet<string>
): LegendaryEventGoalTargets {
  const plan = useGlobalGoalPlan()
  return useMemo((): LegendaryEventGoalTargets => {
    if (plan.isError) return { status: "failed" }
    if (plan.loading) return { status: "loading" }
    const targets = goalTargetsFromDetails(
      eventGoalSummaries(plan.active, allowedUnitIds)
    )
    return {
      status: "ready",
      targets,
      byUnit: new Map(targets.map((target) => [target.unitId, target])),
    }
  }, [plan.isError, plan.loading, plan.active, allowedUnitIds])
}
