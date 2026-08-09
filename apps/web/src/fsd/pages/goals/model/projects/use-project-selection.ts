import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { projectQueries } from "@/entities/project"

/**
 * The Create Goal drawer's project checkbox list + per-project priority inputs — split out of
 * use-create-goal-form.ts purely for that file's own max-lines budget. Empty `selectedProjectIds`
 * means "use the caller's default project" (goal.api.ts omits `projects` in that case) — a goal may
 * belong to several projects at once. `projectPriorities` holds one raw (possibly blank, mid-typing)
 * priority input per selected project, keyed by projectId; blank/unparseable means "append after the
 * project's current goals" (goal.api.ts omits that project's `priority`).
 */
export function useProjectSelection({ open }: { open: boolean }) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

  const projectsQuery = useQuery({
    ...projectQueries.list(),
    enabled: open,
  })
  const projects = projectsQuery.data?.projects ?? []

  const toggleProject = (projectId: string, enabled: boolean) => {
    setSelectedProjectIds((current) =>
      enabled
        ? [...current, projectId]
        : current.filter((id) => id !== projectId)
    )
  }

  const selectProjects = (projectIds: readonly string[]) => {
    setSelectedProjectIds([...projectIds])
  }

  const reset = () => {
    setSelectedProjectIds([])
  }

  return {
    projects,
    selectedProjectIds,
    toggleProject,
    selectProjects,
    reset,
  }
}
