import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { projectQueries } from "@/entities/project"

/**
 * The Create Goal drawer's project-membership selection, split out of
 * use-create-goal-form.ts for that file's max-lines budget. A newly opened
 * form derives its initial membership from the last successfully created goal's
 * choice (transient, in-memory: a reload starts over), else the user's default
 * project. An explicit selection (prefill or the user's own edit) always wins.
 */
export function useProjectSelection({ open }: { open: boolean }) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [rememberedProjectIds, setRememberedProjectIds] = useState<string[]>([])

  const projectsQuery = useQuery({
    ...projectQueries.list(),
    enabled: open,
  })
  const projects = projectsQuery.data?.projects ?? []
  const defaultProjectId = projects.find(
    (project) => project.isDefault
  )?.projectId
  // Drop prefilled IDs (e.g. from a stale project URL) that aren't the account's projects.
  const validSelectedProjectIds = projectsQuery.isSuccess
    ? selectedProjectIds.filter((id) =>
        projects.some((project) => project.projectId === id)
      )
    : selectedProjectIds
  // A remembered project archived or removed since is ignored rather than offered or submitted.
  const validRememberedProjectIds = projectsQuery.isSuccess
    ? rememberedProjectIds.filter((id) =>
        projects.some(
          (project) => project.projectId === id && project.status !== "Archived"
        )
      )
    : []
  const effectiveProjectIds =
    validSelectedProjectIds.length > 0
      ? validSelectedProjectIds
      : open && validRememberedProjectIds.length > 0
        ? validRememberedProjectIds
        : open && defaultProjectId
          ? [defaultProjectId]
          : []

  const selectProjects = (projectIds: readonly string[]) => {
    setSelectedProjectIds([...projectIds])
  }

  // Snapshots what was just submitted so the next creation starts from it; `reset` then clears the
  // explicit selection, which lets the remembered ids show through.
  const remember = () => {
    setRememberedProjectIds(effectiveProjectIds)
  }

  const reset = () => {
    setSelectedProjectIds([])
  }

  return {
    projects,
    selectedProjectIds: effectiveProjectIds,
    selectProjects,
    remember,
    reset,
  }
}
