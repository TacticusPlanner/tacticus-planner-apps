import { queryOptions } from "@tanstack/react-query"

import { listProjects } from "./project.api"

export const projectQueries = {
  all: () => ["projects"] as const,
  list: () =>
    queryOptions({
      queryKey: [...projectQueries.all(), "list"] as const,
      queryFn: ({ signal }) => listProjects(signal),
    }),
}
