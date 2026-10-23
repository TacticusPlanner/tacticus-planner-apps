import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { goalQueries, type GoalDetail } from "@/entities/goal"
import { ApiError } from "@/shared/api"

export type GoalsFetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; goals: GoalDetail[] }

export function useGoals(options?: { archived?: boolean }) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const archived = options?.archived ?? false
  const query = useQuery({
    ...goalQueries.list(archived),
    enabled: isAuthenticated,
  })

  let fetchState: GoalsFetchState
  if (query.isError) {
    fetchState = {
      status: "error",
      message:
        query.error instanceof ApiError
          ? query.error.message
          : t("goals.loadError"),
    }
  } else if (query.data) {
    fetchState = { status: "success", goals: query.data.goals }
  } else {
    fetchState = { status: "idle" }
  }

  return {
    fetchState,
    isLoading: isAuthenticated && query.isPending,
    retry: () => {
      void query.refetch()
    },
  }
}
