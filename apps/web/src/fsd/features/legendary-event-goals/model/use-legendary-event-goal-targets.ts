import { useMemo } from "react"
import { useQueries, type UseQueryResult } from "@tanstack/react-query"

import {
  goalQueries,
  useGlobalGoalPlan,
  type GoalDetail,
} from "@/entities/goal"
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

type DetailsState =
  { status: "loading" | "failed" } | { status: "ready"; details: GoalDetail[] }

// Module-level so TanStack Query keeps the combined result stable between renders.
function combineDetails(results: UseQueryResult<GoalDetail>[]): DetailsState {
  if (results.some((result) => result.isError)) return { status: "failed" }
  if (results.some((result) => result.isPending)) return { status: "loading" }
  return {
    status: "ready",
    details: results.flatMap((result) => (result.data ? [result.data] : [])),
  }
}

/**
 * Active Character goals of kinds Unlock, Ascension, Rank and Ability for the event's allowed units,
 * read from the global plan and the goal details (spec: goal targets map onto a previewed unit). A
 * created goal refreshes through the shell's goal-query invalidation.
 */
export function useLegendaryEventGoalTargets(
  allowedUnitIds: ReadonlySet<string>
): LegendaryEventGoalTargets {
  const plan = useGlobalGoalPlan()
  const summaries = useMemo(
    () => eventGoalSummaries(plan.active, allowedUnitIds),
    [plan.active, allowedUnitIds]
  )
  const details = useQueries({
    queries: summaries.map((goal) => goalQueries.detail(goal.goalId)),
    combine: combineDetails,
  })
  return useMemo((): LegendaryEventGoalTargets => {
    if (plan.isError || details.status === "failed") return { status: "failed" }
    if (plan.loading || details.status !== "ready") return { status: "loading" }
    const targets = goalTargetsFromDetails(details.details)
    return {
      status: "ready",
      targets,
      byUnit: new Map(targets.map((target) => [target.unitId, target])),
    }
  }, [plan.isError, plan.loading, details])
}
