import { queryOptions } from "@tanstack/react-query"

import { authenticatedQueryKey } from "@/shared/api"

import { getGoal, listGoals } from "./goal.api"

export const goalQueries = {
  all: (accountId: string) =>
    [...authenticatedQueryKey(accountId), "goals"] as const,
  lists: (accountId: string) =>
    [...goalQueries.all(accountId), "list"] as const,
  list: (accountId: string, archived: boolean) =>
    queryOptions({
      queryKey: [...goalQueries.lists(accountId), { archived }] as const,
      queryFn: ({ signal }) => listGoals({ archived, signal }),
    }),
  details: (accountId: string) =>
    [...goalQueries.all(accountId), "detail"] as const,
  detail: (accountId: string, goalId: string) =>
    queryOptions({
      queryKey: [...goalQueries.details(accountId), goalId] as const,
      queryFn: ({ signal }) => getGoal(goalId, signal),
    }),
}
