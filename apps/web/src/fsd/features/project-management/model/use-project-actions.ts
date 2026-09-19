import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  activateProject,
  createProject,
  updateProject,
  updateProjectGoalOrder,
  projectQueries,
  type ProjectGoalSummary,
  type ProjectSummary,
} from "@/entities/project"
import { goalQueries } from "@/entities/goal"
import { ApiError } from "@/shared/api"
import { applyOptimisticGoalOrder } from "./optimistic-goal-order"

/**
 * Project-level mutations: active-plan toggle, bulk pause/resume, and per-project goal reorder.
 * Reorder takes the project's complete in-flight goal-id order (flat per-goal, not unit-grouped —
 * `add-inline-goal-reprioritize`) and submits it verbatim; the caller is responsible for computing
 * that full order (see `reorderGoals` on `project-detail-page.tsx`, which splices a dragged goal's
 * id into the full priority-ordered list regardless of what sort/filter/group is currently applied).
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

  const reorderGoals = async (projectId: string, goalIds: string[]) => {
    if (!isAuthenticated) return false

    // Optimistic: dragging feels laggy if the row order only updates once the round trip
    // completes, so the cache is rewritten immediately (matching the server's own two-zone
    // renumbering, see `applyOptimisticGoalOrder`) and rolled back only if the request fails —
    // `onSuccess`'s invalidation above reconciles it with the authoritative response either way.
    const queryKey = projectQueries.goals(projectId).queryKey
    await queryClient.cancelQueries({ queryKey })
    const previous = queryClient.getQueryData<{ goals: ProjectGoalSummary[] }>(
      queryKey
    )
    if (previous) {
      queryClient.setQueryData(queryKey, {
        ...previous,
        goals: applyOptimisticGoalOrder(previous.goals, goalIds),
      })
    }

    const ok = await run(() => updateProjectGoalOrder(projectId, goalIds))
    if (!ok && previous) {
      queryClient.setQueryData(queryKey, previous)
    }
    return ok
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

  return { activate, reorderGoals, create, save, pending }
}
