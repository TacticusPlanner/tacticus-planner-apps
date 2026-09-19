import type { SyntheticEvent } from "react"

import type { ProjectSummary } from "@/entities/project"
import type { GoalOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import type { EstimateOutcome } from "@/features/goal-farming"
import type { GoalRow } from "../../model/shared/types"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"

export type GoalsListProps = {
  rows: GoalRow[]
  actions: ReturnType<typeof useGoalActions>
  /** The project these rows are being viewed inside, when there is one. Project scope is what makes
   *  the row menu's "Remove from this project" action meaningful; Overview has none and omits it. */
  project?: ProjectSummary
  /** Whether this list is a reorderable surface at all — true only on project detail (never Goals
   *  Overview). Desktop shows a drag handle on every row whenever this is true; mobile additionally
   *  needs `mobileReorderActive` (add-inline-goal-reprioritize: desktop has no separate reorder mode,
   *  mobile does). */
  reorderEnabled?: boolean
  /** Mobile-only: whether the collapsed, drag-only card mode is currently active. Ignored on desktop. */
  mobileReorderActive?: boolean
  /** Fires once per completed drag with this list's full new row order (goal ids). The caller is
   *  responsible for splicing that into the project's complete priority order and submitting it —
   *  this list only knows its own, possibly filtered/grouped, visible subset. */
  onReorder?: (orderedGoalIds: string[], movedGoalId: string) => void
  /** While true, the drag surface ignores drops — closes the race a second drag could otherwise
   *  cause while the previous drop's reorder mutation is still in flight. */
  reorderPending?: boolean
  onView?: (goalId: string) => void
  /** Priority-shared plan estimate per goal id (plan §16 phase 4) — absent, or `null` for a goal
   *  entry, both render as the "—" placeholder (no project selected, non-Rank goal, or blocked). */
  estimates?: ReadonlyMap<string, EstimateOutcome>
  /** Progress + remaining-resource info per goal id (plan §2) — absent renders neither. */
  metrics?: ReadonlyMap<string, GoalOverviewMetrics>
  potentialProgress?: ReadonlyMap<string, number>
  /** A row's own goal id -> the id of the single Level goal merged into it as a sub-line (Cluster 7's
   *  Level-goal decision, folded into add-inline-goal-reprioritize). `rows` already excludes a merged
   *  Level goal's own row — this only says which *other* row it attaches to. */
  levelGoalIdByParent?: ReadonlyMap<string, string>
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

/** Only an Active/Paused goal occupies an in-flight priority slot — a historical (Completed/Archived)
 *  row can be visible in the same sorted list, but has nothing to reorder (see `spliceGoalOrder`). */
export function isInFlightStatus(status: string) {
  return status === "Active" || status === "Paused"
}
