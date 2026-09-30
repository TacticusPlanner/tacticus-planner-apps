import { useMemo, useState } from "react"
import { Outlet } from "react-router"

import { useProjects, type ProjectSummary } from "@/entities/project"
import { PageContainer } from "@/widgets/page-container"

export type DailiesOutletContext = {
  projects: ProjectSummary[]
  projectId: string | undefined
  setProjectId: (projectId: string | undefined) => void
  projectsUnavailable: boolean
  projectsError: boolean
  retryProjects: () => void
}

/**
 * Parent route for the Dailies area: Raids/Shops/Onslaught/Salvage Run/Arena/Guild Raids are now
 * rendered by the shared app-shell header's section-tabs row (see `section-tabs.tsx`) instead of a
 * tab bar here - this layout keeps only the `<Outlet/>` for the active tab's page.
 */
export function DailiesLayout() {
  const { projects, fetchState, loading, retry } = useProjects()
  // No selection means every Active goal in the global plan; a project is an optional narrowing filter,
  // kept for the session only.
  const [projectId, setProjectId] = useState<string>()

  const context = useMemo<DailiesOutletContext>(
    () => ({
      projects,
      projectId,
      setProjectId,
      projectsUnavailable:
        !loading && fetchState.status === "success" && projects.length === 0,
      projectsError: !loading && fetchState.status === "error",
      retryProjects: retry,
    }),
    [fetchState.status, loading, projectId, projects, retry]
  )

  return (
    <PageContainer data-testid="dailies-layout">
      <Outlet context={context} />
    </PageContainer>
  )
}
