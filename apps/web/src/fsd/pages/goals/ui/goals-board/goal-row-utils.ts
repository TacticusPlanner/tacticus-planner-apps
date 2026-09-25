import type { SyntheticEvent } from "react"

import type { GoalStatus } from "@/entities/goal"
import type { ProjectSummary } from "@/entities/project"
import type { GoalOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import type { EstimateOutcome } from "@/features/goal-farming"
import type { GoalRow } from "../../model/shared/types"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"

/** The data a prerequisite pause/resume cascade needs about every goal currently in view, not just
 *  the row being acted on — built once per page render from its full row set (`buildCascadeContext`),
 *  not recomputed per row (see `simplify-goal-status-management`'s design.md). */
export type CascadeContext = {
  statusById: ReadonlyMap<string, GoalStatus>
  dependentCountById: ReadonlyMap<string, number>
}

export function buildCascadeContext(rows: readonly GoalRow[]): CascadeContext {
  const statusById = new Map<string, GoalStatus>()
  const dependentCountById = new Map<string, number>()
  for (const row of rows) {
    statusById.set(row.goalId, row.status)
    for (const dependencyId of row.dependsOn ?? []) {
      dependentCountById.set(
        dependencyId,
        (dependentCountById.get(dependencyId) ?? 0) + 1
      )
    }
  }
  return { statusById, dependentCountById }
}

/** Which of a goal's `dependsOn` prerequisites a pause/resume cascade should also transition to
 *  `targetStatus`: a `Completed`/`Archived` (or unknown) prerequisite is always excluded — a cascade
 *  never reopens a finished goal; pausing further excludes a prerequisite shared by more than one
 *  dependent, resuming does not (see `goal-status-actions`'s "Pausing or resuming a goal cascades to
 *  its prerequisites"). */
export function cascadeTargets(
  dependsOn: readonly string[] | undefined,
  targetStatus: GoalStatus,
  context: CascadeContext | undefined
): string[] {
  if (!dependsOn || dependsOn.length === 0 || !context) return []
  return dependsOn.filter((id) => {
    const status = context.statusById.get(id)
    if (status !== "Active" && status !== "Paused") return false
    if (targetStatus === "Paused") {
      return (context.dependentCountById.get(id) ?? 0) <= 1
    }
    return true
  })
}

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
  /** Potential progress of each Rank/Ability goal's *level requirement* (owned XP books), keyed by that
   *  goal's id — beside `potentialProgress`, which carries the same goal's material Potential. */
  levelPotentialProgress?: ReadonlyMap<string, number>
  /** Whether each row's target has been reached (attainment-computed) — gates the "⋯" menu's Archive
   *  item (`goal-status-actions`: "Archive is available only once a goal has reached its target").
   *  Absent renders every row as not-reached, so Archive stays hidden by default. */
  reachedByGoalId?: ReadonlyMap<string, boolean>
  /** Built once per page render (`buildCascadeContext`) from this list's full, unfiltered row set —
   *  not `rows`, which may be a filtered/grouped subset. Absent disables the cascade entirely. */
  cascadeContext?: CascadeContext
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
