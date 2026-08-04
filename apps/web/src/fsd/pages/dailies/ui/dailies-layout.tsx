import { useMemo, useState } from "react"
import { Outlet, type NavigateFunction } from "react-router"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

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
 * tab bar here - this layout keeps only the `<Outlet/>` for the active tab's page. `RouteTabs`
 * below is still exported and used by `RaidsLayout`'s own nested Today/Plan sub-tabs, a third
 * level unaffected by that move.
 */
export function DailiesLayout() {
  const {
    projects,
    activeProjectId,
    defaultProjectId,
    fetchState,
    loading,
    retry,
  } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string>()
  const projectId = selectedProjectId ?? activeProjectId ?? defaultProjectId

  const context = useMemo<DailiesOutletContext>(
    () => ({
      projects,
      projectId,
      setProjectId: setSelectedProjectId,
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

export function RouteTabs({
  active,
  navigate,
  tabs: entries,
  testId,
}: {
  active: string
  navigate: NavigateFunction
  tabs: { value: string; label: string; path: string }[]
  testId: string
}) {
  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        const tab = entries.find((entry) => entry.value === value)
        if (tab) void navigate(tab.path)
      }}
    >
      {/* overflow-y-hidden avoids a spurious vertical scrollbar: overflow-x-auto alone forces
          overflow-y to also compute as 'auto' per the CSS overflow spec, which then clips and
          scrolls on any sub-pixel vertical overflow (e.g. the "line" variant's underline). */}
      <TabsList
        variant="line"
        className="max-w-full justify-start overflow-x-auto overflow-y-hidden"
        data-testid={testId}
      >
        {entries.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
