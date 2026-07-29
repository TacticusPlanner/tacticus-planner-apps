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
  const [projectPriorities, setProjectPriorities] = useState<
    Record<string, string>
  >({})

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
    if (!enabled) {
      // Drop the stale priority input so re-checking the project later starts blank rather than
      // silently reusing whatever was typed before it was unchecked.
      setProjectPriorities((current) => {
        const next = { ...current }
        delete next[projectId]
        return next
      })
    }
  }

  const setProjectPriority = (projectId: string, value: string) => {
    setProjectPriorities((current) => ({ ...current, [projectId]: value }))
  }

  const reset = () => {
    setSelectedProjectIds([])
    setProjectPriorities({})
  }

  return {
    projects,
    selectedProjectIds,
    toggleProject,
    projectPriorities,
    setProjectPriority,
    reset,
  }
}
