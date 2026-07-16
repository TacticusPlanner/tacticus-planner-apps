import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { projectQueries, type ProjectGoalSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; goals: ProjectGoalSummary[] }

export function useProjectGoals(projectId: string | undefined) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...projectQueries.goals(projectId ?? "unselected"),
    enabled: Boolean(isAuthenticated && projectId),
  })

  let fetchState: FetchState
  if (!projectId || !query.data) {
    fetchState = query.isError
      ? {
          status: "error",
          message:
            query.error instanceof ApiError
              ? query.error.message
              : t("goals.loadError"),
        }
      : { status: "idle" }
  } else {
    fetchState = { status: "success", goals: query.data.goals }
  }

  return {
    fetchState,
    goals: fetchState.status === "success" ? fetchState.goals : [],
    loading: Boolean(isAuthenticated && projectId) && query.isPending,
    retry: () => {
      void query.refetch()
    },
  }
}
