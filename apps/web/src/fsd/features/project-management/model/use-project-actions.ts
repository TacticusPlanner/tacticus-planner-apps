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
import { ApiError, apiIssue } from "@/shared/api"

/**
 * Project-level mutations: create and save (name/description/color/status/target). Reordering goals is a
 * move on the account-wide order and lives in `features/goal-planning`; there is no bulk pause/resume
 * (project-management: "No bulk pause/resume on Projects"). Response-first (spec: client-data-freshness):
 * the returned project is written into the cached project list; nothing about goals changes, so no goal
 * read is refetched, and a 409 refetches the project list only.
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
  })

  /** Replaces the project in the cached list, or appends it when it is new. */
  const writeProject = (project: ProjectSummary) =>
    queryClient.setQueryData(
      projectQueries.list().queryKey,
      (current: { projects: ProjectSummary[] } | undefined) =>
        current && {
          ...current,
          projects: current.projects.some(
            (entry) => entry.projectId === project.projectId
          )
            ? current.projects.map((entry) =>
                entry.projectId === project.projectId ? project : entry
              )
            : [...current.projects, project],
        }
    )

  const run = async (action: () => Promise<ProjectSummary>) => {
    if (!isAuthenticated) {
      return false
    }

    setPendingCount((count) => count + 1)
    try {
      writeProject((await mutation.mutateAsync(action)) as ProjectSummary)
      return true
    } catch (error) {
      // A stale project revision carries the project as it stands: adopt it; refetch otherwise.
      const stale = apiIssue(
        error,
        "projectRevisionStale",
        "defaultProjectCannotBeArchived"
      )
      if (stale?.current && typeof stale.current === "object") {
        writeProject(stale.current as ProjectSummary)
      } else if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({
          queryKey: projectQueries.list().queryKey,
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
