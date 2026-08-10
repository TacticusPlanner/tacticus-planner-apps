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
  const effectiveProjectIds =
    selectedProjectIds.length > 0
      ? selectedProjectIds
      : open && defaultProjectId
        ? [defaultProjectId]
        : []

  const toggleProject = (projectId: string, enabled: boolean) => {
    setSelectedProjectIds((current) => {
      const selection =
        current.length > 0
          ? current
          : defaultProjectId
            ? [defaultProjectId]
            : []
      return enabled
        ? selection.includes(projectId)
          ? selection
          : [...selection, projectId]
        : selection.filter((id) => id !== projectId)
    })
  }

  const selectProjects = (projectIds: readonly string[]) => {
    setSelectedProjectIds([...projectIds])
  }

  const reset = () => {
    setSelectedProjectIds([])
  }

  return {
    projects,
    selectedProjectIds: effectiveProjectIds,
    toggleProject,
    selectProjects,
    reset,
  }
}
