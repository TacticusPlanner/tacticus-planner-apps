import type { SyntheticEvent } from "react"

import type { GoalStatus } from "@/entities/goal"
import { normalizeXpBookRarity } from "@/entities/planning-setting"
import type { GoalOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import {
  levelBookAvailability,
  type EstimateOutcome,
} from "@/features/goal-farming"
import type { XpBookFigure } from "../shared/level-requirement-display"
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

/** Pauses/resumes one goal together with its cascade prerequisites — shared by the row menu and the
 *  status chip's quick toggle. */
export function toggleGoalStatus(
  actions: ReturnType<typeof useGoalActions>,
  row: GoalRow,
  next: "Active" | "Paused",
  cascadeContext: CascadeContext | undefined
) {
  const cascade = cascadeTargets(row.dependsOn, next, cascadeContext).map(
    (id) => ({
      goalId: id,
      // cascadeTargets only returns ids whose status cascadeContext knows — the fallback is unreachable.
      previousStatus: cascadeContext?.statusById.get(id) ?? next,
    })
  )
  return actions.setStatus(row.goalId, next, row.status, cascade)
}

export type GoalsListProps = {
  rows: GoalRow[]
  actions: ReturnType<typeof useGoalActions>
  /** Ids of the selected goals (the page owns the selection). Absent renders nothing selected. */
  selection?: ReadonlySet<string>
  /** Toggles one goal in the selection. */
  onToggleSelected?: (goalId: string) => void
  /** Every visible row id across all groups — what the header select-all checkbox covers (desktop).
   *  Defaults to this list's own rows. */
  visibleIds?: readonly string[]
  /** Header select-all: selects every visible row, or clears when all are already selected. */
  onSelectAllVisible?: () => void
  /** Mobile-only: whether select mode is active (each card shows a header checkbox). */
  selectActive?: boolean
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
  /** Opens the Edit goal dialog for a goal (the row's Edit action). */
  onEdit?: (goalId: string) => void
  /** Priority-shared plan estimate per goal id (plan §16 phase 4) — absent, or `null` for a goal
   *  entry, both render as the "—" placeholder (no project selected, non-Rank goal, or blocked). */
  estimates?: ReadonlyMap<string, EstimateOutcome>
  /** Progress + remaining-resource info per goal id (plan §2) — absent renders neither. */
  metrics?: ReadonlyMap<string, GoalOverviewMetrics>
  potentialProgress?: ReadonlyMap<string, number>
  /** Potential progress of each Rank/Ability goal's *level requirement* (owned XP books), keyed by that
   *  goal's id — beside `potentialProgress`, which carries the same goal's material Potential. */
  levelPotentialProgress?: ReadonlyMap<string, number>
  /** Each Rank/Ability goal's own charged level-requirement XP interval, keyed by goal id
   *  (`PlanInsightsResult.levelChargedXpByGoalId`) — paired with `levelPoolXpAvailable` below to show
   *  an available/needed book-equivalent count (show-xp-book-availability-per-goal). */
  levelChargedXp?: ReadonlyMap<string, number>
  /** The shared owned-book pool's raw XP total at each Rank/Ability goal's own turn in priority order,
   *  keyed by goal id (`PlanInsightsResult.levelPoolXpAvailableByGoalId`). */
  levelPoolXpAvailable?: ReadonlyMap<string, number>
  /** The user's selected XP-book rarity, used to express `levelChargedXp`/`levelPoolXpAvailable` as
   *  book-equivalent counts. Absent renders no book count even when the maps above have entries. */
  xpBookRarity?: string
  /** Whether each row's target has been reached (attainment-computed) — drives the completed-row
   *  presentation (`goal-list-layout`) and hides pause/resume. Absent renders every row as
   *  not-reached. */
  reachedByGoalId?: ReadonlyMap<string, boolean>
  /** Built once per page render (`buildCascadeContext`) from this list's full, unfiltered row set —
   *  not `rows`, which may be a filtered/grouped subset. Absent disables the cascade entirely. */
  cascadeContext?: CascadeContext
}

/** Whether a row renders as a completed (Reached) row/card — a display state derived from computed
 *  attainment, never the goal's stored status. */
export function isReachedRow(
  row: GoalRow,
  reachedByGoalId: ReadonlyMap<string, boolean> | undefined
): boolean {
  return reachedByGoalId?.get(row.goalId) ?? false
}

/** The XP-book available/needed figure for a goal's chip (`LevelRequirementLine`), in the
 *  selected rarity; `undefined` when the goal needs no level-up books. */
export function goalXpBookFigure(
  chargedXp: number | undefined,
  poolXpAvailable: number | undefined,
  xpBookRarity: string | undefined
): XpBookFigure | undefined {
  const rarity = normalizeXpBookRarity(xpBookRarity)
  const { available, needed } = levelBookAvailability(
    chargedXp ?? 0,
    poolXpAvailable ?? 0,
    rarity
  )
  return needed > 0 ? { available, needed, rarity } : undefined
}

/** Shared classes for the green Reached tint (theme token, so the contrast audit covers it). */
export const REACHED_ROW_CLASS = "bg-success hover:bg-success"

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

export function estimateOnslaughtTokens(estimate: EstimateOutcome | undefined) {
  return estimate && estimate.status !== "Blocked"
    ? estimate.onslaughtTokens
    : undefined
}

export function estimateShopSpend(estimate: EstimateOutcome | undefined) {
  return estimate && estimate.status !== "Blocked"
    ? estimate.shopSpend
    : undefined
}

/** Only an Active/Paused goal occupies an in-flight priority slot — a historical (Completed/Archived)
 *  row can be visible in the same sorted list, but has nothing to reorder (see `spliceGoalOrder`). */
export function isInFlightStatus(status: string) {
  return status === "Active" || status === "Paused"
}
