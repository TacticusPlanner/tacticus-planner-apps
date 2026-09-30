import { useCallback, useEffect } from "react"
import { useSearchParams } from "react-router"

import type { ProjectSummary } from "@/entities/project"

const PARAM = "project"

/**
 * The Goals page's project scope (`goals-navigation`: "Goals project scope is URL state") — the
 * `?project=` search param, validated against the loaded project list. Writes replace the history
 * entry, so Back leaves the page rather than stepping through scopes. An unknown or archived id is
 * dropped from the URL once the list is known; while it is loading or failed the param is kept and
 * the page shows all goals.
 */
export function useGoalsProjectScope(
  projects: ProjectSummary[],
  projectsReady: boolean
) {
  const [params, setParams] = useSearchParams()
  const raw = params.get(PARAM)
  const valid =
    !!raw &&
    projectsReady &&
    projects.some(
      (project) => project.projectId === raw && project.status !== "Archived"
    )

  useEffect(() => {
    if (!raw || !projectsReady || valid) return
    setParams(
      (previous) => {
        previous.delete(PARAM)
        return previous
      },
      { replace: true }
    )
  }, [raw, projectsReady, valid, setParams])

  const setProjectId = useCallback(
    (projectId?: string) =>
      setParams(
        (previous) => {
          if (projectId) previous.set(PARAM, projectId)
          else previous.delete(PARAM)
          return previous
        },
        { replace: true }
      ),
    [setParams]
  )

  return { projectId: valid ? raw : undefined, setProjectId }
}
