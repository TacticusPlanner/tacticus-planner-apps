import { queryOptions } from "@tanstack/react-query"

import { listProjectGoals, listProjects } from "./project.api"

export const projectQueries = {
  all: () => ["projects"] as const,
  list: () =>
    queryOptions({
      queryKey: [...projectQueries.all(), "list"] as const,
      queryFn: ({ signal }) => listProjects(signal),
    }),
  // Prefix of every per-project member list: what an order change or a completion invalidates,
  // without refetching the project list itself.
  details: () => [...projectQueries.all(), "detail"] as const,
  goals: (projectId: string) =>
    queryOptions({
      queryKey: [...projectQueries.details(), projectId, "goals"] as const,
      queryFn: ({ signal }) => listProjectGoals(projectId, signal),
    }),
}
