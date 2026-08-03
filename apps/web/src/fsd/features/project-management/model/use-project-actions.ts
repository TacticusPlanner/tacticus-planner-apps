import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  activateProject,
  createProject,
  updateProject,
  updateProjectGoals,
  updateProjectGoalsStatus,
  projectQueries,
  type ProjectGoalSummary,
  type ProjectSummary,
} from "@/entities/project"
import { goalQueries } from "@/entities/goal"
import { ApiError } from "@/shared/api"

const PRIORITY_STEP = 10

/**
 * Swaps `goalId` with its adjacent *visible* neighbor (the reorder buttons only ever act within the
 * currently-displayed, e.g. Active-tab, subset) inside the full, priority-ordered member list, then
 * returns the full list's goal ids in their new order. Operating on the full list — not just the visible
 * subset — matters because `updateProjectGoals` replaces a project's *entire* membership: submitting only
 * the visible subset would silently drop every non-visible (completed/archived) member from the project.
 * Swapping index positions (rather than reassigning priority values in place) keeps every other member's
 * relative order untouched.
 */
export function reorderedMemberIds(
  members: ProjectGoalSummary[],
  goalId: string,
  direction: "up" | "down",
  visibleGoalIds: string[]
): string[] | undefined {
  const visibleIndex = visibleGoalIds.indexOf(goalId)
  const neighborId =
    direction === "up"
      ? visibleGoalIds[visibleIndex - 1]
      : visibleGoalIds[visibleIndex + 1]

  if (visibleIndex === -1 || neighborId === undefined) {
    return undefined
  }

  const ids = members.map((member) => member.goal.goalId)
  const a = ids.indexOf(goalId)
  const b = ids.indexOf(neighborId)
  if (a === -1 || b === -1) {
    return undefined
  }

  const reordered = [...ids]
  ;[reordered[a], reordered[b]] = [reordered[b], reordered[a]]
  return reordered
}

/**
 * Project-level mutations: active-plan toggle, bulk pause/resume, and per-project reorder. Reorder takes
 * the *full* desired member ordering (see `reorderedMemberIds`) and recomputes spaced priorities before
 * submitting, so a single move never requires renumbering races with concurrent edits elsewhere.
 */
export function useProjectActions(_onChanged?: () => void) {
  void _onChanged
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const [pendingCount, setPendingCount] = useState(0)
  const pending = pendingCount > 0
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
        queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
      ])
    },
  })

  const run = async (action: () => Promise<unknown>) => {
    if (!isAuthenticated) {
      return false
    }

    setPendingCount((count) => count + 1)
    try {
      await mutation.mutateAsync(action)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({
          queryKey: projectQueries.all(),
        })
        void queryClient.invalidateQueries({
          queryKey: goalQueries.all(),
        })
      }
      toast.error(
        error instanceof ApiError
          ? error.message
          : t("goals.toasts.actionError")
      )
      return false
    } finally {
      setPendingCount((count) => Math.max(0, count - 1))
    }
  }

  const activate = async (projectId: string) => {
    if (!isAuthenticated) {
      return
    }

    const ok = await run(() => activateProject(projectId))
    if (ok) {
      toast.success(t("goals.toasts.activated"))
    }
  }

  const bulkStatus = async (projectId: string, status: "Active" | "Paused") => {
    if (!isAuthenticated) {
      return
    }

    const ok = await run(() => updateProjectGoalsStatus(projectId, status))
    if (ok) {
      toast.success(
        status === "Active"
          ? t("goals.toasts.bulkResumed")
          : t("goals.toasts.bulkPaused")
      )
    }
  }

  const reorder = async (projectId: string, orderedGoalIds: string[]) => {
    if (!isAuthenticated) {
      return
    }

    await run(() =>
      updateProjectGoals(
        projectId,
        orderedGoalIds.map((goalId, index) => ({
          goalId,
          priority: (index + 1) * PRIORITY_STEP,
        }))
      )
    )
  }

  const create = async (
    name: string,
    description: string | null,
    color: string | null
  ) => {
    if (!isAuthenticated) return false
    const ok = await run(() => createProject({ name, description, color }))
    if (ok) toast.success(t("goals.toasts.projectCreated"))
    return ok
  }

  const save = async (
    project: ProjectSummary,
    changes: Pick<ProjectSummary, "name" | "description" | "color" | "status">
  ) => {
    if (!isAuthenticated) return false
    const ok = await run(() =>
      updateProject(project.projectId, {
        ...changes,
        revision: project.revision,
      })
    )
    if (ok) toast.success(t("goals.toasts.projectUpdated"))
    return ok
  }

  return { activate, bulkStatus, reorder, create, save, pending }
}
