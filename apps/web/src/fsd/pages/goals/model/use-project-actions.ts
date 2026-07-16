import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

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
import { useActiveAccountId } from "@/shared/auth"

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
  const accountId = useActiveAccountId()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)
  const mutation = useMutation({
    mutationFn: ({
      action,
    }: {
      action: () => Promise<unknown>
      accountId: string
    }) => action(),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: projectQueries.all(variables.accountId),
        }),
        queryClient.invalidateQueries({
          queryKey: goalQueries.all(variables.accountId),
        }),
      ])
    },
  })

  const run = async (action: () => Promise<unknown>) => {
    if (!accountId) {
      return false
    }

    setPending(true)
    try {
      await mutation.mutateAsync({ action, accountId })
      return true
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({
          queryKey: projectQueries.all(accountId),
        })
        void queryClient.invalidateQueries({
          queryKey: goalQueries.all(accountId),
        })
      }
      toast.error(
        error instanceof ApiError
          ? error.message
          : t("goals.toasts.actionError")
      )
      return false
    } finally {
      setPending(false)
    }
  }

  const activate = async (projectId: string) => {
    if (!accountId) {
      return
    }

    const ok = await run(() => activateProject(projectId))
    if (ok) {
      toast.success(t("goals.toasts.activated"))
    }
  }

  const bulkStatus = async (projectId: string, status: "Active" | "Paused") => {
    if (!accountId) {
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
    if (!accountId) {
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
    if (!accountId) return false
    const ok = await run(() => createProject({ name, description, color }))
    if (ok) toast.success(t("goals.toasts.projectCreated"))
    return ok
  }

  const save = async (
    project: ProjectSummary,
    changes: Pick<ProjectSummary, "name" | "description" | "color" | "status">
  ) => {
    if (!accountId) return false
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
