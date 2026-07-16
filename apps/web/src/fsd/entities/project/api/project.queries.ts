import { queryOptions } from "@tanstack/react-query"

import { listProjectGoals, listProjects } from "./project.api"

export const projectQueries = {
  all: () => ["projects"] as const,
  list: () =>
    queryOptions({
      queryKey: [...projectQueries.all(), "list"] as const,
      queryFn: ({ signal }) => listProjects(signal),
    }),
  goals: (projectId: string) =>
    queryOptions({
      queryKey: [
        ...projectQueries.all(),
        "detail",
        projectId,
        "goals",
      ] as const,
      queryFn: ({ signal }) => listProjectGoals(projectId, signal),
    }),
}
