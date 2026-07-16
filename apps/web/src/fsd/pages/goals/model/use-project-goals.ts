import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"

import { projectQueries, type ProjectGoalSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useActiveAccountId } from "@/shared/auth"

type FetchState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; goals: ProjectGoalSummary[] }

export function useProjectGoals(projectId: string | undefined) {
  const { t } = useTranslation()
  const accountId = useActiveAccountId()
  const query = useQuery({
    ...projectQueries.goals(
      accountId ?? "anonymous",
      projectId ?? "unselected"
    ),
    enabled: Boolean(accountId && projectId),
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
    loading: Boolean(accountId && projectId) && query.isPending,
    retry: () => {
      void query.refetch()
    },
  }
}
