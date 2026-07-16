import { queryOptions } from "@tanstack/react-query"

import { authenticatedQueryKey } from "@/shared/api"

import { listProjectGoals, listProjects } from "./project.api"

export const projectQueries = {
  all: (accountId: string) =>
    [...authenticatedQueryKey(accountId), "projects"] as const,
  list: (accountId: string) =>
    queryOptions({
      queryKey: [...projectQueries.all(accountId), "list"] as const,
      queryFn: ({ signal }) => listProjects(signal),
    }),
  goals: (accountId: string, projectId: string) =>
    queryOptions({
      queryKey: [
        ...projectQueries.all(accountId),
        "detail",
        projectId,
        "goals",
      ] as const,
      queryFn: ({ signal }) => listProjectGoals(projectId, signal),
    }),
}
