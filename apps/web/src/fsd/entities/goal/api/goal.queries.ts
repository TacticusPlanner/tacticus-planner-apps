import { queryOptions } from "@tanstack/react-query"

import { getGoal, listGoals } from "./goal.api"

export const goalQueries = {
  all: () => ["goals"] as const,
  lists: () => [...goalQueries.all(), "list"] as const,
  list: (archived: boolean) =>
    queryOptions({
      queryKey: [...goalQueries.lists(), { archived }] as const,
      queryFn: ({ signal }) => listGoals({ archived, signal }),
    }),
  details: () => [...goalQueries.all(), "detail"] as const,
  detail: (goalId: string) =>
    queryOptions({
      queryKey: [...goalQueries.details(), goalId] as const,
      queryFn: ({ signal }) => getGoal(goalId, signal),
    }),
}
