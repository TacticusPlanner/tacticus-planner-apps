import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  deleteGoal,
  goalQueries,
  updateGoalStatus,
  type GoalDetail,
  type GoalStatus,
} from "@/entities/goal"
import {
  changeProjectMembership,
  projectQueries,
  type ProjectSummary,
} from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useUnitName } from "@/shared/unit-name"

import { membershipErrorText } from "../projects/project-conflict-copy"
import { isOnlyMemberOf } from "../projects/project-removal"
import type { GoalRow } from "../shared/types"
import { applyOptimisticGoalRemoval } from "./optimistic-goal-removal"
import {
  applyOptimisticGoalStatus,
  type GoalFieldPatch,
} from "./optimistic-goal-status"

/** A prerequisite cascade target: the id to also transition, and its status immediately before the
 *  transition, needed to revert just that goal if its own call fails without disturbing whichever
 *  cascade members already succeeded. */
export type CascadeTarget = { goalId: string; previousStatus: GoalStatus }

/** Leaving or entering the in-flight set renumbers other goals server-side, which no single response
 *  describes, so those transitions refetch the order reads once. */
const movesOrder = (status: GoalStatus) =>
  status === "Completed" || status === "Archived"

/**
 * Per-goal lifecycle mutations (pause/resume/complete/archive/unarchive/delete) shared by the list, grid,
 * and row-actions menu. Response-first (spec: client-data-freshness): each response is written into the
 * cached detail and every cached list holding the goal, and only reads the response cannot describe
 * (goal lists and per-project member lists after an order change or a membership change) are refetched. `pendingIds` disables every row
 * whose action is currently in flight — a set, not a single id, since a prerequisite cascade (see
 * `setStatus`'s `cascade`) can have several goals in flight from one user action at once; `onChanged`
 * is the caller's list `retry`.
 */
export function useGoalActions(_onChanged?: () => void) {
  void _onChanged
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const getUnitName = useUnitName()
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
  })

  /** Patches every cached query under both slices' prefixes in place — a goal can be cached by
   *  Goals Overview's flat list, any number of Project Detail's per-project lists, and its own
   *  cached detail simultaneously, and all of them need to agree instantly for the pause/resume
   *  toggle to feel immediate rather than waiting on the round trip + refetch. */
  const patchStatusCache = (
    goalId: string,
    status: GoalStatus | GoalFieldPatch
  ) => {
    queryClient.setQueriesData({ queryKey: goalQueries.all() }, (old) =>
      applyOptimisticGoalStatus(old, goalId, status)
    )
    queryClient.setQueriesData({ queryKey: projectQueries.all() }, (old) =>
      applyOptimisticGoalStatus(old, goalId, status)
    )
  }

  /** Writes a status response: the detail as returned, and its status and priority into every list. */
  const writeGoal = (goal: GoalDetail) => {
    queryClient.setQueryData(goalQueries.detail(goal.goalId).queryKey, goal)
    patchStatusCache(goal.goalId, {
      status: goal.status,
      globalPriority: goal.globalPriority,
    })
  }

  /** Refetches the reads an order change affects; in the background so rows don't wait on it. */
  const refreshOrderReads = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: goalQueries.lists() }),
      queryClient.invalidateQueries({ queryKey: projectQueries.details() }),
    ])

  /** Adds or removes `projectId` on the cached details of `goalIds` (lists carry no membership). */
  const patchDetailProjects = (
    goalIds: readonly string[],
    projectId: string,
    member: boolean
  ) =>
    goalIds.forEach((goalId) =>
      queryClient.setQueryData(
        goalQueries.detail(goalId).queryKey,
        (goal: GoalDetail | undefined) =>
          goal && {
            ...goal,
            projectIds: member
              ? [...new Set([...goal.projectIds, projectId])]
              : goal.projectIds.filter((id) => id !== projectId),
          }
      )
    )

  const refreshMembers = (...projectIds: string[]) =>
    Promise.all(
      projectIds.map((projectId) =>
        queryClient.invalidateQueries({
          queryKey: projectQueries.goals(projectId).queryKey,
        })
      )
    )

  const patchRemovalCache = (goalId: string) => {
    queryClient.setQueriesData({ queryKey: goalQueries.all() }, (old) =>
      applyOptimisticGoalRemoval(old, goalId)
    )
    queryClient.setQueriesData({ queryKey: projectQueries.all() }, (old) =>
      applyOptimisticGoalRemoval(old, goalId)
    )
  }

  const addPending = (goalId: string) =>
    setPendingIds((prev) => new Set(prev).add(goalId))
  const removePending = (goalId: string) =>
    setPendingIds((prev) => {
      if (!prev.has(goalId)) return prev
      const next = new Set(prev)
      next.delete(goalId)
      return next
    })

  /** Returns the action's result, or `undefined` when it failed (already reported unless `silent`).
   *  `silent` skips the per-call error toast — used for a cascade target beyond the acting goal
   *  itself, so a partial cascade failure surfaces as one aggregate toast (see `setStatus`) rather
   *  than one toast per failed prerequisite. `trackPending: false` skips this call's own add/remove
   *  because the caller is already holding `goalId` pending for a longer span (see `setStatus`) —
   *  without it, a cascade's acting goal would re-enable its row between its own call finishing and
   *  the last prerequisite call finishing, letting a second click start an overlapping cascade. */
  const run = async <T>(
    goalId: string,
    action: () => Promise<T>,
    options: { silent?: boolean; trackPending?: boolean } = {}
  ): Promise<{ value: T } | undefined> => {
    if (!isAuthenticated) {
      return undefined
    }

    const trackPending = options.trackPending ?? true
    if (trackPending) addPending(goalId)
    try {
      return { value: (await mutation.mutateAsync(action)) as T }
    } catch (error) {
      if (!options.silent) {
        toast.error(
          error instanceof ApiError
            ? error.message
            : t("goals.toasts.actionError")
        )
      }
      return undefined
    } finally {
      if (trackPending) removePending(goalId)
    }
  }

  /**
   * `cascade` entries are prerequisite goals (from `dependsOn`) to transition to the same `status`
   * alongside `goalId`, sequentially, after the acting goal's own call succeeds (see design.md: not
   * `Promise.all`, since each call also renormalizes its project's priority order server-side).
   * Callers are responsible for excluding a `Completed`/`Archived` prerequisite from `cascade`
   * before calling this — this function does not re-check a target's current status. Every goal
   * involved (the acting goal and every cascade target) stays pending for the whole operation, not
   * just its own individual call, so none of their rows can be clicked again — starting a second,
   * overlapping cascade — before the first one finishes.
   *
   * For a pause/resume toggle (`status` is `Active` or `Paused`), every involved goal's row updates
   * optimistically before the request resolves, reverting individually if its own call fails — the
   * acting goal and each cascade member fail independently, so one failure doesn't undo goals that
   * already succeeded. `previousStatus` is what to revert to; callers already have it (it's what
   * `cascadeTargets` filtered on), so this never re-derives it from the cache. No optimistic patch is
   * attempted for any other target status (archiving moves a goal between two separately cached
   * Overview lists, which this in-place field patch does not handle — see optimistic-goal-status.ts).
   */
  const setStatus = async (
    goalId: string,
    status: GoalStatus,
    previousStatus: GoalStatus,
    cascade: readonly CascadeTarget[] = []
  ) => {
    if (!isAuthenticated) {
      return
    }

    const optimistic = status === "Active" || status === "Paused"
    const allIds = [goalId, ...cascade.map((entry) => entry.goalId)]
    allIds.forEach(addPending)
    if (optimistic) {
      patchStatusCache(goalId, status)
      cascade.forEach((entry) => patchStatusCache(entry.goalId, status))
    }
    let changed = false
    try {
      const own = await run(goalId, () => updateGoalStatus(goalId, status), {
        trackPending: false,
      })
      if (!own) {
        if (optimistic) patchStatusCache(goalId, previousStatus)
        return
      }
      changed = true
      writeGoal(own.value)
      if (cascade.length === 0) {
        return
      }

      let cascadeSucceeded = 0
      for (const entry of cascade) {
        const result = await run(
          entry.goalId,
          () => updateGoalStatus(entry.goalId, status),
          { silent: true, trackPending: false }
        )
        if (result) {
          cascadeSucceeded++
          writeGoal(result.value)
        } else if (optimistic) {
          patchStatusCache(entry.goalId, entry.previousStatus)
        }
      }
      if (cascadeSucceeded < cascade.length) {
        toast.error(
          t("goals.toasts.statusChangedPartial", {
            succeeded: cascadeSucceeded + 1,
            total: cascade.length + 1,
          })
        )
      }
    } finally {
      allIds.forEach(removePending)
      if (changed && (movesOrder(status) || movesOrder(previousStatus))) {
        void refreshOrderReads()
      }
    }
  }

  /** Deleting renumbers the remaining in-flight goals, and a failure must restore the row, so both
   *  outcomes refetch the order reads once. */
  const remove = async (goalId: string) => {
    if (!isAuthenticated) {
      return false
    }

    patchRemovalCache(goalId)
    const ok = await run(goalId, () => deleteGoal(goalId))
    void refreshOrderReads()
    return Boolean(ok)
  }

  /** Bulk pause/resume over an explicit selection (no prerequisite cascade). Every id stays pending for
   *  the whole loop, rows patch optimistically up front, and each failed id reverts on its own; one
   *  aggregate toast reports a partial failure and nothing is shown when all succeed.
   *  ponytail: sequential per-goal calls, ~150ms each; add a batch endpoint if users routinely select
   *  50+ goals. */
  const setStatusMany = async (
    targets: readonly CascadeTarget[],
    status: "Active" | "Paused"
  ) => {
    if (!isAuthenticated || targets.length === 0) return
    targets.forEach((entry) => addPending(entry.goalId))
    targets.forEach((entry) => patchStatusCache(entry.goalId, status))
    let succeeded = 0
    try {
      for (const entry of targets) {
        const result = await run(
          entry.goalId,
          () => updateGoalStatus(entry.goalId, status),
          { silent: true, trackPending: false }
        )
        if (result) {
          succeeded++
          writeGoal(result.value)
        } else patchStatusCache(entry.goalId, entry.previousStatus)
      }
      if (succeeded < targets.length) {
        toast.error(
          t("goals.toasts.statusChangedPartial", {
            succeeded,
            total: targets.length,
          })
        )
      }
    } finally {
      targets.forEach((entry) => removePending(entry.goalId))
    }
  }

  /** Bulk delete: every row leaves the caches immediately, then one delete per goal runs
   *  sequentially. The order reads refetch once after the loop (renumbering, and restoring only the
   *  failed ids); a failure shows one aggregate error toast, success shows none. */
  const removeMany = async (goalIds: readonly string[]) => {
    if (!isAuthenticated || goalIds.length === 0) return
    goalIds.forEach(addPending)
    goalIds.forEach(patchRemovalCache)
    let succeeded = 0
    try {
      for (const goalId of goalIds) {
        const ok = await run(goalId, () => deleteGoal(goalId), {
          silent: true,
          trackPending: false,
        })
        if (ok) succeeded++
      }
      void refreshOrderReads()
      if (succeeded < goalIds.length) {
        toast.error(
          t("goals.toasts.bulkPartial", {
            succeeded,
            total: goalIds.length,
          })
        )
      }
    } finally {
      goalIds.forEach(removePending)
    }
  }

  const goalLabel = (row: GoalRow) =>
    `${getUnitName(row.entityType, row.entityId)} · ${t(`goals.create.goalTypes.${row.goalType}`)}`

  /** Adds every row to `project` in one membership request, keeping each goal's other memberships;
   *  goals already in the project are left as they are. The request is atomic, so a rejection (an
   *  occupied goal slot, say) adds none of them and is reported once. */
  const addToProject = async (
    rows: readonly Pick<GoalRow, "goalId">[],
    project: ProjectSummary
  ) => {
    if (!isAuthenticated || rows.length === 0) return
    const goalIds = rows.map((row) => row.goalId)
    goalIds.forEach(addPending)
    try {
      const { before, after } = await changeProjectMembership(
        project.projectId,
        (current) => [...current, ...goalIds]
      )
      const added = after.length - before.length
      if (added > 0) {
        patchDetailProjects(goalIds, project.projectId, true)
        void refreshMembers(project.projectId)
        toast.success(
          t("goals.toasts.goalsAddedToProject", {
            project: project.name,
            count: added,
          })
        )
      }
    } catch (error) {
      void refreshMembers(project.projectId)
      toast.error(membershipErrorText(t, error))
    } finally {
      goalIds.forEach(removePending)
    }
  }

  /**
   * Takes every row out of `project`, leaving its other memberships alone. A row whose only project is
   * `project` needs `destination`: it joins that project first (one request), and only then are all the
   * rows removed from `project` (a second one), so an occupied slot in the destination stops the move
   * before anything is removed. Without a destination such a row is rejected by the server
   * (`lastProjectMembership`) and nothing is removed. One toast reports the outcome, including when the
   * move succeeded but the removal then failed and the goals are in both projects.
   */
  const removeFromProject = async (
    rows: readonly GoalRow[],
    project: ProjectSummary,
    destination?: ProjectSummary
  ) => {
    if (!isAuthenticated || rows.length === 0) return false
    const goalIds = rows.map((row) => row.goalId)
    const relocating = destination
      ? rows
          .filter((row) => isOnlyMemberOf(row, project.projectId))
          .map((row) => row.goalId)
      : []
    goalIds.forEach(addPending)
    let movedToDestination = false
    try {
      if (destination && relocating.length > 0) {
        await changeProjectMembership(destination.projectId, (current) => [
          ...current,
          ...relocating,
        ])
        movedToDestination = true
        patchDetailProjects(relocating, destination.projectId, true)
      }
      const { before, after } = await changeProjectMembership(
        project.projectId,
        (current) => current.filter((goalId) => !goalIds.includes(goalId))
      )
      patchDetailProjects(goalIds, project.projectId, false)
      const removed = before.length - after.length
      const single = rows.length === 1 ? rows[0] : undefined
      if (single && destination && relocating.length > 0) {
        toast.success(
          t("goals.toasts.goalRelocated", {
            goal: goalLabel(single),
            project: destination.name,
          })
        )
      } else if (single) {
        toast.success(
          t("goals.toasts.goalRemovedFromProject", {
            goal: goalLabel(single),
            project: project.name,
          })
        )
      } else if (destination && relocating.length > 0) {
        toast.success(
          t("goals.toasts.goalsRemovedAndMoved", {
            count: removed,
            project: project.name,
            moved: relocating.length,
            destination: destination.name,
          })
        )
      } else {
        toast.success(
          t("goals.toasts.goalsRemovedFromProject", {
            count: removed,
            project: project.name,
          })
        )
      }
      return true
    } catch (error) {
      // The two requests are separate, so a failed removal can leave the moved goals in both projects;
      // say so rather than report only the error.
      toast.error(
        movedToDestination && destination
          ? t("goals.toasts.movedButNotRemoved", {
              count: relocating.length,
              project: project.name,
              destination: destination.name,
              error: membershipErrorText(t, error),
            })
          : membershipErrorText(t, error)
      )
      return false
    } finally {
      void refreshMembers(
        project.projectId,
        ...(destination ? [destination.projectId] : [])
      )
      goalIds.forEach(removePending)
    }
  }

  return {
    setStatus,
    setStatusMany,
    remove,
    removeMany,
    addToProject,
    removeFromProject,
    pendingIds,
  }
}
