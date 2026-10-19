import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  createProject,
  updateProject,
  projectQueries,
  type ProjectSummary,
  type ProjectTarget,
} from "@/entities/project"
import { goalQueries } from "@/entities/goal"
import { ApiError } from "@/shared/api"

/**
 * Project-level mutations: create and save (name/description/color/status/target). Reordering goals is a
 * move on the account-wide order and lives in `features/goal-order`; there is no bulk pause/resume
 * (project-management: "No bulk pause/resume on Projects").
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

  const create = async (
    name: string,
    description: string | null,
    color: string | null,
    target: ProjectTarget | null = null
  ) => {
    if (!isAuthenticated) return null
    let created: ProjectSummary | null = null
    const ok = await run(async () => {
      created = await createProject({ name, description, color, target })
      return created
    })
    if (ok) toast.success(t("goals.toasts.projectCreated"))
    return ok ? created : null
  }

  const save = async (
    project: ProjectSummary,
    changes: Pick<
      ProjectSummary,
      "name" | "description" | "color" | "status" | "target"
    >
  ) => {
    if (!isAuthenticated) return false
    const ok = await run(() =>
      updateProject(project.projectId, {
        name: changes.name,
        description: changes.description,
        color: changes.color,
        status: changes.status,
        // The server clears an absent target, so archive and restore resend the current one.
        target: changes.target ?? null,
        revision: project.revision,
      })
    )
    if (ok) toast.success(t("goals.toasts.projectUpdated"))
    return ok
  }

  return { create, save, pending }
}
