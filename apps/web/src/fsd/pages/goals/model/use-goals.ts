import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"

import { goalQueries, type GoalSummary } from "@/entities/goal"
import { ApiError } from "@/shared/api"
import { useActiveAccountId } from "@/shared/auth"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; goals: GoalSummary[] }

export function useGoals(options?: { archived?: boolean }) {
  const { t } = useTranslation()
  const accountId = useActiveAccountId()
  const archived = options?.archived ?? false
  const query = useQuery({
    ...goalQueries.list(accountId ?? "anonymous", archived),
    enabled: Boolean(accountId),
  })

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
    fetchState = { status: "success", goals: query.data.goals }
  } else {
    fetchState = { status: "idle" }
  }

  return {
    fetchState,
    isLoading: Boolean(accountId) && query.isPending,
    retry: () => {
      void query.refetch()
    },
  }
}
