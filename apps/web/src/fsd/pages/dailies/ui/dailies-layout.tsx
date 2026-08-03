import { useMemo, useState } from "react"
import {
  Outlet,
  useLocation,
  useNavigate,
  type NavigateFunction,
} from "react-router"
import { useTranslation } from "react-i18next"
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

const tabs = [
  "raids",
  "shops",
  "onslaught",
  "salvage-run",
  "arena",
  "guild-raids",
] as const

export function DailiesLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation("dailies")
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
  const active =
    tabs.find((tab) => pathname.includes(`/dailies/${tab}`)) ?? "raids"

  return (
    <PageContainer data-testid="dailies-layout">
      <RouteTabs
        active={active}
        navigate={navigate}
        testId="dailies-primary-tabs"
        tabs={tabs.map((tab) => ({
          value: tab,
          label: t(`tabs.${tab}`),
          path: `/dailies/${tab}`,
        }))}
      />
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
      <TabsList
        variant="line"
        className="max-w-full justify-start overflow-x-auto"
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
