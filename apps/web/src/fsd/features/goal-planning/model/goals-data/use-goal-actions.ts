import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  deleteGoal,
  goalOrderConflict,
  goalQueries,
  goalTypesOverLimit,
  isGoalLimitError,
  MAX_GOALS_PER_TYPE,
  updateGoalsStatus,
} from "@/entities/goal"
import type { GoalDetail, GoalListResponse, GoalStatus } from "@/entities/goal"
import { changeProjectMembership, projectQueries } from "@/entities/project"
import type { ProjectSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useUnitName } from "@/shared/unit-name"

import {
  membershipErrorText,
  projectConflictText,
} from "../projects/project-conflict-copy"
import { goalSlotConflict } from "../projects/project-membership"
import { isOnlyMemberOf } from "../projects/project-removal"
import type { GoalRow } from "../shared/types"
import { applyOptimisticGoalRemoval } from "./optimistic-goal-removal"
import { applyOptimisticGoalStatus } from "./optimistic-goal-status"
import type { GoalFieldPatch } from "./optimistic-goal-status"
import { runCatching, runWithCleanup } from "@/shared/lib"

/** A prerequisite cascade target: the id to also transition, and its status immediately before the
 *  transition, needed to revert its row if the transition is rejected. */
export type CascadeTarget = { goalId: string; previousStatus: GoalStatus }

/** Leaving or entering the in-flight set renumbers other goals server-side: the request carries the
 *  order revision it saw, and the order reads refetch once afterwards. */
const movesOrder = (status: GoalStatus) =>
  status === "Completed" || status === "Archived"

/**
 * Per-goal lifecycle mutations (pause/resume/complete/archive/unarchive/delete) and membership changes
 * shared by the list, grid and row-actions menu. A status change of any number of goals is one atomic
 * `POST goals/status` (spec: goal-status-actions): its response is written into the cached details
 * and lists, a rejection reverts every optimistic row and is reported once. `pendingIds` disables every
 * row whose action is in flight.
 */
export function useGoalActions() {
  const { t, i18n } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const getUnitName = useUnitName()
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
  })

  /** Patches the goal in place in every cached goal read (its detail and both lists), so a pause/resume
   *  toggle reads as immediate rather than waiting on the round trip. */
  const patchGoal = (goalId: string, patch: GoalStatus | GoalFieldPatch) =>
    queryClient.setQueriesData({ queryKey: goalQueries.all() }, (old) =>
      applyOptimisticGoalStatus(old, goalId, patch)
    )

  /** Writes a response goal: the detail as returned, and its summary fields into every list. */
  const writeGoal = (goal: GoalDetail) => {
    queryClient.setQueryData(goalQueries.detail(goal.goalId).queryKey, goal)
    patchGoal(goal.goalId, {
      status: goal.status,
      globalPriority: goal.globalPriority,
      updatedAt: goal.updatedAt,
    })
  }

  const writeOrderRevision = (orderRevision: number) =>
    queryClient.setQueriesData<GoalListResponse>(
      { queryKey: goalQueries.lists() },
      (list) => list && { ...list, orderRevision }
    )

  const currentOrderRevision = () =>
    queryClient.getQueryData<GoalListResponse>(goalQueries.list(false).queryKey)
      ?.orderRevision

  /** Refetches the reads an order change affects; in the background so rows don't wait on it. */
  const refreshGoalLists = () =>
    queryClient.invalidateQueries({ queryKey: goalQueries.lists() })

  /** Adds or removes `projectId` on the cached goals (detail and lists carry `projectIds`), then
   *  refetches the project list, whose `goalIds` changed. */
  const patchGoalProjects = (
    goalIds: readonly string[],
    projectId: string,
    member: boolean
  ) => {
    const patch = (goal: GoalDetail) =>
      goalIds.includes(goal.goalId)
        ? {
            ...goal,
            projectIds: member
              ? [...new Set([...goal.projectIds, projectId])]
              : goal.projectIds.filter((id) => id !== projectId),
          }
        : goal
    goalIds.forEach((goalId) =>
      queryClient.setQueryData(
        goalQueries.detail(goalId).queryKey,
        (goal: GoalDetail | undefined) => goal && patch(goal)
      )
    )
    queryClient.setQueriesData<GoalListResponse>(
      { queryKey: goalQueries.lists() },
      (list) => list && { ...list, goals: list.goals.map(patch) }
    )
  }

  const refreshProjects = () =>
    queryClient.invalidateQueries({ queryKey: projectQueries.list().queryKey })

  const patchRemovalCache = (goalId: string) =>
    queryClient.setQueriesData({ queryKey: goalQueries.all() }, (old) =>
      applyOptimisticGoalRemoval(old, goalId)
    )

  const addPending = (goalId: string) =>
    setPendingIds((prev) => new Set(prev).add(goalId))
  const removePending = (goalId: string) =>
    setPendingIds((prev) => {
      if (!prev.has(goalId)) return prev
      const next = new Set(prev)
      next.delete(goalId)
      return next
    })

  const goalLabel = (
    goal: Pick<GoalRow, "entityType" | "entityId" | "goalType">
  ) =>
    `${getUnitName(goal.entityType, goal.entityId)} · ${t(`goals.create.goalTypes.${goal.goalType}`)}`

  const cachedGoal = (goalId: string) =>
    queryClient
      .getQueriesData<GoalListResponse>({ queryKey: goalQueries.lists() })
      .flatMap(([, list]) => list?.goals ?? [])
      .find((goal) => goal.goalId === goalId)

  /** One toast for a rejected transition, naming the acting goal: an occupied slot names the goal holding
   *  it (from `current`), a stale order offers a reload, anything else shows the server's text. */
  const reportStatusFailure = (actingGoalId: string, error: unknown) => {
    const acting = cachedGoal(actingGoalId)
    const slot = goalSlotConflict(error)
    const order = goalOrderConflict(error)
    const reason = slot
      ? projectConflictText(
          t,
          slot.current,
          getUnitName(slot.current.entityType, slot.current.entityId)
        )
      : order
        ? t("goals.order.conflictTitle")
        : isGoalLimitError(error)
          ? t("goals.limits.goalLimitReachedGeneric", {
              max: MAX_GOALS_PER_TYPE,
            })
          : error instanceof ApiError
            ? error.message
            : t("goals.toasts.actionError")
    toast.error(
      acting
        ? t("goals.toasts.statusConflict", {
            goal: goalLabel(acting),
            reason,
          })
        : reason,
      order
        ? {
            action: {
              label: t("appError.reload"),
              onClick: () => void refreshGoalLists(),
            },
          }
        : undefined
    )
  }

  /**
   * Transitions every target to `status` in one atomic request. Pause/resume rows update optimistically
   * and every one reverts if the request is rejected (nothing changed server-side). The request carries
   * the list's order revision whenever the transition enters or leaves the in-flight set.
   */
  const transition = async (
    targets: readonly CascadeTarget[],
    status: GoalStatus
  ) => {
    if (!isAuthenticated || targets.length === 0) return
    // Leaving Archived counts toward the per-type cap (goalLimitReached): checked against the loaded
    // non-archived list first, so a refused request is not sent.
    if (status !== "Archived") {
      const restoring = targets
        .filter((target) => target.previousStatus === "Archived")
        .flatMap((target) => cachedGoal(target.goalId)?.goalType ?? [])
      const over = goalTypesOverLimit(
        queryClient.getQueryData<GoalListResponse>(
          goalQueries.list(false).queryKey
        )?.goals ?? [],
        restoring
      )
      if (over[0]) {
        toast.error(
          t("goals.limits.goalLimitReached", {
            max: MAX_GOALS_PER_TYPE,
            type: t(`goals.create.goalTypes.${over[0]}`),
          })
        )
        return
      }
    }
    const goalIds = targets.map((target) => target.goalId)
    const optimistic = status === "Active" || status === "Paused"
    const touchesOrder =
      movesOrder(status) ||
      targets.some((target) => movesOrder(target.previousStatus))
    const expectedOrderRevision = touchesOrder
      ? currentOrderRevision()
      : undefined
    goalIds.forEach(addPending)
    if (optimistic) goalIds.forEach((goalId) => patchGoal(goalId, status))
    return runWithCleanup(
      async () => {
        return runCatching(
          async () => {
            const response = await mutation.mutateAsync(() =>
              updateGoalsStatus({
                goalIds,
                status,
                ...(expectedOrderRevision !== undefined
                  ? { expectedOrderRevision }
                  : {}),
              })
            )
            const { goals, orderRevision } = response as Awaited<
              ReturnType<typeof updateGoalsStatus>
            >
            goals.forEach(writeGoal)
            writeOrderRevision(orderRevision)
            if (touchesOrder) void refreshGoalLists()
          },
          (error) => {
            if (optimistic) {
              targets.forEach((target) =>
                patchGoal(target.goalId, target.previousStatus)
              )
            }
            reportStatusFailure(goalIds[0]!, error)
          }
        )
      },
      () => {
        goalIds.forEach(removePending)
      }
    )
  }

  /**
   * `cascade` entries are prerequisite goals (from `dependsOn`) to transition with `goalId`, in the same
   * request. Callers exclude a `Completed`/`Archived` prerequisite from `cascade` beforehand.
   */
  const setStatus = (
    goalId: string,
    status: GoalStatus,
    previousStatus: GoalStatus,
    cascade: readonly CascadeTarget[] = []
  ) => transition([{ goalId, previousStatus }, ...cascade], status)

  /** Bulk pause/resume over an explicit selection: one request for all of them. */
  const setStatusMany = (
    targets: readonly CascadeTarget[],
    status: "Active" | "Paused"
  ) => transition(targets, status)

  /** Deleting renumbers the remaining in-flight goals, and a failure must restore the row, so both
   *  outcomes refetch the goal lists once. */
  const remove = async (goalId: string) => {
    if (!isAuthenticated) return false
    addPending(goalId)
    patchRemovalCache(goalId)
    return runWithCleanup(
      async () => {
        return runCatching(
          async () => {
            await mutation.mutateAsync(() => deleteGoal(goalId))
            return true
          },
          (error) => {
            toast.error(
              error instanceof ApiError
                ? error.message
                : t("goals.toasts.actionError")
            )
            return false
          }
        )
      },
      () => {
        void refreshGoalLists()
        removePending(goalId)
      }
    )
  }

  /** Bulk delete: every row leaves the caches immediately, then one delete per goal runs sequentially.
   *  The goal lists refetch once after the loop (renumbering, and restoring only the failed ids); a
   *  failure shows one aggregate error toast, success shows none. */
  const removeMany = async (goalIds: readonly string[]) => {
    if (!isAuthenticated || goalIds.length === 0) return
    goalIds.forEach(addPending)
    goalIds.forEach(patchRemovalCache)
    return runWithCleanup(
      async () => {
        let succeeded = 0
        for (const goalId of goalIds) {
          try {
            await mutation.mutateAsync(() => deleteGoal(goalId))
            succeeded++
          } catch {
            // Counted below; the refetch restores the row.
          }
        }
        void refreshGoalLists()
        if (succeeded < goalIds.length) {
          toast.error(
            t("goals.toasts.bulkPartial", {
              succeeded,
              total: goalIds.length,
            })
          )
        }
      },
      () => {
        goalIds.forEach(removePending)
      }
    )
  }

  /**
   * Adds every row to each of `projects`, one membership request per project, in turn
   * (add-goal-to-several-projects). Each request keeps the goals' other memberships, leaves goals
   * already in that project as they are, and re-applies itself once on a `membershipStale` rejection
   * (`changeProjectMembership`). One toast reports the outcome: the destinations and the goals added,
   * or, when some requests failed, the failed destinations with a Retry for those only; the successful
   * ones stay added.
   */
  const addToProjects = async (
    rows: readonly Pick<GoalRow, "goalId">[],
    projects: readonly ProjectSummary[]
  ): Promise<void> => {
    if (!isAuthenticated || rows.length === 0 || projects.length === 0) return
    const goalIds = rows.map((row) => row.goalId)
    goalIds.forEach(addPending)
    const added = new Set<string>()
    const succeeded: ProjectSummary[] = []
    const addedTo: ProjectSummary[] = []
    const failed: ProjectSummary[] = []
    let lastError: unknown
    await runWithCleanup(
      async () => {
        for (const project of projects) {
          try {
            const { before, after } = await changeProjectMembership(
              project.projectId,
              project.goalIds,
              (current) => [...current, ...goalIds]
            )
            succeeded.push(project)
            const newIds = after.filter((goalId) => !before.includes(goalId))
            if (newIds.length > 0) {
              newIds.forEach((goalId) => added.add(goalId))
              addedTo.push(project)
              patchGoalProjects(goalIds, project.projectId, true)
            }
          } catch (error) {
            failed.push(project)
            lastError = error
          }
        }
      },
      () => {
        void refreshProjects()
        goalIds.forEach(removePending)
      }
    )

    const names = (list: readonly ProjectSummary[]) =>
      new Intl.ListFormat(i18n.language, { type: "conjunction" }).format(
        list.map((project) => project.name)
      )
    if (failed.length === 0) {
      if (added.size === 0) return
      toast.success(
        addedTo.length === 1
          ? t("goals.toasts.goalsAddedToProject", {
              project: addedTo[0]!.name,
              count: added.size,
            })
          : t("goals.toasts.goalsAddedToProjects", {
              projects: names(addedTo),
              count: added.size,
            })
      )
      return
    }
    const message =
      succeeded.length > 0
        ? t("goals.toasts.addedToSomeProjects", {
            added: names(succeeded),
            failed: names(failed),
          })
        : failed.length === 1
          ? membershipErrorText(t, lastError)
          : t("goals.toasts.addToProjectsFailed", { failed: names(failed) })
    toast.error(message, {
      action: {
        label: t("goals.toasts.retry"),
        onClick: () => void addToProjects(rows, failed),
      },
    })
  }

  /** Adds every row to `project` (one membership request); see `addToProjects`. */
  const addToProject = (
    rows: readonly Pick<GoalRow, "goalId">[],
    project: ProjectSummary
  ) => addToProjects(rows, [project])

  /**
   * Takes every row out of `project`, leaving its other memberships alone. A row whose only project is
   * `project` needs `destination`: it joins that project first (one request), and only then are all the
   * rows removed from `project` (a second one). Without a destination such a row is rejected by the
   * server (`lastProjectMembership`) and nothing is removed. One toast reports the outcome, including
   * when the move succeeded but the removal then failed and the goals are in both projects.
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
    return runWithCleanup(
      async () => {
        return runCatching(
          async () => {
            if (destination && relocating.length > 0) {
              await changeProjectMembership(
                destination.projectId,
                destination.goalIds,
                (current) => [...current, ...relocating]
              )
              movedToDestination = true
              patchGoalProjects(relocating, destination.projectId, true)
            }
            const { before, after } = await changeProjectMembership(
              project.projectId,
              project.goalIds,
              (current) => current.filter((goalId) => !goalIds.includes(goalId))
            )
            patchGoalProjects(goalIds, project.projectId, false)
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
          },
          (error) => {
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
          }
        )
      },
      () => {
        void refreshProjects()
        goalIds.forEach(removePending)
      }
    )
  }

  return {
    setStatus,
    setStatusMany,
    remove,
    removeMany,
    addToProject,
    addToProjects,
    removeFromProject,
    pendingIds,
  }
}
