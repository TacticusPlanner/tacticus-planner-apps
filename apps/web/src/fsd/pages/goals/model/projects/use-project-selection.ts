import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { projectQueries } from "@/entities/project"

/**
 * The Create Goal drawer's project-membership selection, split out of
 * use-create-goal-form.ts for that file's max-lines budget. A newly opened
 * form derives its initial membership from the user's default project.
 */
export function useProjectSelection({ open }: { open: boolean }) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

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
  const effectiveProjectIds =
    validSelectedProjectIds.length > 0
      ? validSelectedProjectIds
      : open && defaultProjectId
        ? [defaultProjectId]
        : []

  const selectProjects = (projectIds: readonly string[]) => {
    setSelectedProjectIds([...projectIds])
  }

  const reset = () => {
    setSelectedProjectIds([])
  }

  return {
    projects,
    selectedProjectIds: effectiveProjectIds,
    selectProjects,
    reset,
  }
}
