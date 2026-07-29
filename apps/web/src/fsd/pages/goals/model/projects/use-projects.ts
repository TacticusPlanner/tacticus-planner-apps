import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { projectQueries, type ProjectSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; projects: ProjectSummary[] }

export function useProjects() {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...projectQueries.list(),
    enabled: isAuthenticated,
  })
  const projects = query.data?.projects ?? []
  const activeProject = projects.find((project) => project.isActivePlan)

  let fetchState: FetchState
  if (query.isError) {
    fetchState = {
      status: "error",
      message:
        query.error instanceof ApiError
          ? query.error.message
          : t("goals.loadError"),
    }
  } else if (query.data) {
    fetchState = { status: "success", projects }
  } else {
    fetchState = { status: "idle" }
  }

  return {
    fetchState,
    projects,
    activeProjectId: activeProject?.projectId,
    loading: isAuthenticated && query.isPending,
    retry: () => {
      void query.refetch()
    },
  }
}
