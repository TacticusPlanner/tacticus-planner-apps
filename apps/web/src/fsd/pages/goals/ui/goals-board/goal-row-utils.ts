import type { SyntheticEvent } from "react"

import type { GoalOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import type { EstimateOutcome } from "@/features/goal-farming"
import type { GoalRow } from "../../model/shared/types"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"

export type GoalsListProps = {
  rows: GoalRow[]
  actions: ReturnType<typeof useGoalActions>
  reorderEnabled?: boolean
  onMove?: (goalId: string, direction: "up" | "down") => void
  onView?: (goalId: string) => void
  /** Priority-shared plan estimate per goal id (plan §16 phase 4) — absent, or `null` for a goal
   *  entry, both render as the "—" placeholder (no project selected, non-Rank goal, or blocked). */
  estimates?: ReadonlyMap<string, EstimateOutcome>
  /** Progress + remaining-resource info per goal id (plan §2) — absent renders neither. */
  metrics?: ReadonlyMap<string, GoalOverviewMetrics>
  potentialProgress?: ReadonlyMap<string, number>
}

/** Stops activation on an inner control from
 * also bubbling up to the row/card's own "open detail" handler. */
export function stopRowNavigation(event: SyntheticEvent<HTMLElement>): void {
  event.stopPropagation()
}

export function estimateEnergy(estimate: EstimateOutcome | undefined) {
  return estimate && estimate.status !== "Blocked"
    ? estimate.energyTotal
    : undefined
}
